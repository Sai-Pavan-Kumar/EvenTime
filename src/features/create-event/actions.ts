"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isVerifiedDomain } from "@/lib/constants/verifiedDomains";
import { DEFAULT_CURRENCY } from "@/lib/eventPrice";
import { DUPLICATE_CANDIDATE_LIMIT, IGNORED_DUPLICATE_STATUSES, isSameRegistrationLink, normalizeRegistrationLink } from "./utils/duplicateCheck";
import { isUuid, isValidWebLink, validateEventPayload } from "./utils/validateEventPayload";
import { buildSlug, isOwnPosterUrl, withProtocol, type SubmitEventActionPayload, type SubmitEventActionResult } from "./utils/eventSubmission";
import { revalidateTag, revalidatePath } from "next/cache";
import type { TablesUpdate, TablesInsert } from "@/types/database";

// High enough that a real organiser never meets it; it exists to stop scripts, not busy posters.
const MAX_EVENTS_PER_DAY = 30;
// Posting more is welcome, but points and city-wide pushes stop here, so there is nothing to farm.
const REWARDED_EVENTS_PER_DAY = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
const POINTS_PER_EVENT = 20;
const UNIQUE_VIOLATION = "23505";

export async function submitEventAction(
  payloadData: SubmitEventActionPayload,
  isEditing: boolean = false,
  eventId?: string
): Promise<SubmitEventActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return { success: false, error: "Please login to submit an event." };
    }

    const invalidReason = validateEventPayload(payloadData, isEditing);
    if (invalidReason) return { success: false, error: invalidReason };

    const finalRegLink = withProtocol(payloadData.registration_link);
    const finalWebsite = withProtocol(payloadData.website);
    if ((finalRegLink && !isValidWebLink(finalRegLink)) || (finalWebsite && !isValidWebLink(finalWebsite))) {
      return { success: false, error: "Please enter a valid link." };
    }

    // Fetch user profile to check admin status and curator name fallback
    let profile: {
      user_type?: string | null;
      role?: string | null;
      full_name?: string | null;
      username?: string | null;
    } | null = null;

    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, username, user_type, role")
        .eq("id", user.id)
        .maybeSingle();
      profile = profileData;
    } catch {}

    let dbDomains: string[] = [];
    try {
      const { data: trustedData } = await supabase.from("verified_domains").select("domain_name");
      if (trustedData) {
        dbDomains = trustedData.map((d: any) => d.domain_name);
      }
    } catch {}

    // Only role: users can edit their own user_type, and database triggers protect role alone.
    const isAdmin = profile?.role === "admin";
    const isTrustedLink = isVerifiedDomain(finalRegLink, dbDomains.length > 0 ? dbDomains : undefined);

    // Check for duplicate registration link to prevent multiple postings of the same event
    if (finalRegLink) {
      const parsed = normalizeRegistrationLink(finalRegLink);
      if (parsed) {
        let dupQuery = supabase
          .from("events")
          .select("id, title, registration_link")
          .ilike("registration_link", parsed.pattern)
          .not("status", "in", IGNORED_DUPLICATE_STATUSES)
          .limit(DUPLICATE_CANDIDATE_LIMIT);

        if (isEditing && eventId) {
          dupQuery = dupQuery.neq("id", eventId);
        }
        // A retry must not collide with the row its own lost first attempt saved.
        if (!isEditing && payloadData.submission_id && isUuid(payloadData.submission_id)) {
          dupQuery = dupQuery.neq("id", payloadData.submission_id);
        }

        const { data: candidates } = await dupQuery;
        const duplicateEvent = candidates?.find((row) => isSameRegistrationLink(finalRegLink, row.registration_link));
        if (duplicateEvent) {
          return {
            success: false,
            error: `This event was already posted as "${duplicateEvent.title}".`,
          };
        }
      }
    }

    // Auto-fetch and assign curator name if organizer_name is empty
    let organizerName = payloadData.organizer_name?.trim();
    if (!organizerName) {
      const authName = (user.user_metadata?.full_name || user.user_metadata?.name) as string | undefined;
      organizerName = profile?.full_name || authName || profile?.username || "Event Curator";
    }

    const eventCity = payloadData.is_virtual ? "online" : (payloadData.city || payloadData.location || "online");
    const title = payloadData.title.trim();
    const location = payloadData.is_virtual ? "Virtual Event" : (payloadData.location || null);

    const priceCurrency = (!payloadData.is_free && payloadData.price_currency) || DEFAULT_CURRENCY;
    const priceIsStarting = !payloadData.is_free && Boolean(payloadData.price_is_starting);
    const hasDefaultPriceOptions = priceCurrency === DEFAULT_CURRENCY && !priceIsStarting;

    const sharedFields = {
      title,
      category: payloadData.category,
      organizer_name: organizerName,
      description: payloadData.description?.trim() || null,
      target_audience: payloadData.target_audience || ["Everyone"],
      start_time: payloadData.start_time || null,
      end_time: payloadData.end_time || null,
      end_date_string: payloadData.end_date_string || null,
      date_string: payloadData.date_string,
      location,
      city: eventCity,
      is_virtual: Boolean(payloadData.is_virtual),
      is_free: Boolean(payloadData.is_free),
      price: payloadData.is_free ? 0 : Number(payloadData.price || 0),
      // Left out for a plain rupee price, so posting keeps working until the price columns exist.
      ...(hasDefaultPriceOptions ? {} : { price_currency: priceCurrency, price_is_starting: priceIsStarting }),
      registration_link: finalRegLink,
      prizes: payloadData.prizes || null,
      team_size: payloadData.team_size || null,
      website: finalWebsite,
      registration_deadline: payloadData.registration_deadline || null,
      branch_tags: payloadData.branch_tags || null,
      college_branch: payloadData.college_branch || null,
      college_year: payloadData.college_year || null,
      college_only: Boolean(payloadData.college_only),
      college_id: payloadData.college_id?.trim() || null,
    };

    if (isEditing) {
      if (!eventId) return { success: false, error: "Event not found." };

      const { data: existing } = await supabase
        .from("events")
        .select("status, registration_link, poster_url, creator_id")
        .eq("id", eventId)
        .maybeSingle();

      if (!existing || existing.status === "deleted" || (!isAdmin && existing.creator_id !== user.id)) {
        return { success: false, error: "You can't edit this event." };
      }
      if (payloadData.poster_url && payloadData.poster_url !== existing.poster_url && !isOwnPosterUrl(payloadData.poster_url)) {
        return { success: false, error: "Invalid poster image." };
      }

      // Approval was earned by the old link, so swapping in an unverified one sends the event back to review.
      const linkChanged = finalRegLink !== existing.registration_link;
      const needsReview = !isAdmin && existing.status === "approved" && linkChanged && !isTrustedLink;
      const finalStatus = (needsReview ? "pending" : existing.status) as "approved" | "pending";

      const updatePayload: TablesUpdate<"events"> = { ...sharedFields };
      // Featured placement is an admin decision, and this request can be forged from the browser.
      if (isAdmin) updatePayload.is_featured = Boolean(payloadData.is_featured);
      if (payloadData.poster_url) updatePayload.poster_url = payloadData.poster_url;

      const { error: updateErr } = await supabase.from("events").update(updatePayload).eq("id", eventId);
      if (updateErr) throw updateErr;

      if (hasDefaultPriceOptions) {
        // An edit back to a plain rupee price must clear the old choice. PGRST204: columns not added yet.
        const { error: priceErr } = await supabase.from("events").update({ price_currency: DEFAULT_CURRENCY, price_is_starting: false }).eq("id", eventId);
        if (priceErr && priceErr.code !== "PGRST204") throw priceErr;
      }

      if (needsReview) {
        // A database guard silently ignores status changes from normal users, so this needs the service client.
        const { error: reviewErr } = await createAdminClient()
          .from("events")
          .update({ status: "pending", approved_at: null })
          .eq("id", eventId);
        if (reviewErr) throw reviewErr;
      }

      try {
        await supabase
          .from("event_reports")
          .update({ status: "resolved" })
          .eq("event_id", eventId)
          .eq("status", "pending");
      } catch {}

      try {
        revalidateTag("events", "events");
        revalidatePath("/", "layout");
        revalidatePath("/profile");
      } catch {}

      return {
        success: true,
        id: eventId,
        isEditing: true,
        status: finalStatus,
        title,
        category: payloadData.category,
        dateString: payloadData.date_string,
        city: eventCity,
        location: location || "",
        posterUrl: payloadData.poster_url || null,
      };
    }

    if (payloadData.poster_url && !isOwnPosterUrl(payloadData.poster_url)) {
      return { success: false, error: "Invalid poster image." };
    }

    let postedToday = 0;
    if (!isAdmin) {
      const { count } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", user.id)
        .gte("created_at", new Date(Date.now() - DAY_MS).toISOString());
      postedToday = count ?? 0;
      if (postedToday >= MAX_EVENTS_PER_DAY) {
        return { success: false, error: "You've reached today's posting limit. Please try again tomorrow." };
      }
    }

    const finalStatus: "approved" | "pending" = isAdmin || isTrustedLink ? "approved" : "pending";
    const uniqueSlug = buildSlug(title, eventCity, payloadData.date_string);
    const submissionId = payloadData.submission_id && isUuid(payloadData.submission_id) ? payloadData.submission_id : undefined;

    const insertPayload: TablesInsert<"events"> = {
      ...sharedFields,
      ...(submissionId ? { id: submissionId } : {}),
      is_featured: isAdmin && Boolean(payloadData.is_featured),
      status: finalStatus,
      approved_at: finalStatus === "approved" ? new Date().toISOString() : null,
      poster_url: payloadData.poster_url || null,
      slug: uniqueSlug,
      creator_id: user.id,
    };

    const baseResult = {
      success: true as const,
      title,
      category: payloadData.category,
      dateString: payloadData.date_string,
      city: eventCity,
      location: location || "",
      posterUrl: insertPayload.poster_url,
      isTrusted: isTrustedLink || isAdmin,
    };

    const { data: insertedEvent, error: insertErr } = await supabase
      .from("events")
      .insert([insertPayload])
      .select("id")
      .single();

    if (insertErr) {
      // The first attempt did save and only its response was lost, so report that event as the success.
      if (insertErr.code === UNIQUE_VIOLATION && submissionId) {
        const { data: alreadySaved } = await supabase
          .from("events")
          .select("id, slug, status")
          .eq("id", submissionId)
          .eq("creator_id", user.id)
          .maybeSingle();
        if (alreadySaved) {
          return { ...baseResult, id: alreadySaved.id, slug: alreadySaved.slug ?? undefined, status: alreadySaved.status as "approved" | "pending" };
        }
      }
      throw insertErr;
    }

    if (finalStatus === "approved") {
      if (postedToday < REWARDED_EVENTS_PER_DAY) {
        try {
          await supabase.rpc("increment_et_score", {
            user_id: user.id,
            delta: POINTS_PER_EVENT,
          });
        } catch {}

        // Broadcast push notifications to mobile app users in that city
        try {
          if (eventCity !== "online") {
            void supabase.functions.invoke("send-push-notification", {
              body: {
                city: eventCity,
                category: insertPayload.category,
                notification_type: "city_updates",
                title: `New in ${eventCity} · ${insertPayload.category}`,
                body: `"${title}" opened for registration.`,
                data: { eventId: insertedEvent?.id, id: insertedEvent?.id },
                channel_id: "city-updates",
              },
            }).catch(() => {});
          }
        } catch {}
      }

      try {
        revalidateTag("events", "events");
        revalidatePath("/", "layout");
        revalidatePath("/", "page");
        revalidatePath("/search", "page");
        revalidatePath("/cities", "page");
        revalidatePath(`/events/${uniqueSlug}`, "page");
      } catch {}
    }

    return { ...baseResult, id: insertedEvent?.id || "", slug: uniqueSlug, status: finalStatus };
  } catch (err: any) {
    console.error("[submitEventAction] Error:", err);
    const isDuplicateLink =
      err?.code === UNIQUE_VIOLATION &&
      (err?.message?.includes("unique_registration_link") ||
        err?.details?.includes("registration_link"));

    return {
      success: false,
      error: isDuplicateLink
        ? "This event link has already been posted by someone else."
        : "We couldn't save your event. Please try again.",
    };
  }
}
