"use server";

import { createClient } from "@/lib/supabase/server";
import { isVerifiedDomain } from "@/lib/constants/verifiedDomains";
import { revalidateTag, revalidatePath } from "next/cache";
import type { TablesUpdate, TablesInsert } from "@/types/database";

export interface SubmitEventActionPayload {
  title: string;
  category: string;
  organizer_name?: string | null;
  description?: string | null;
  target_audience?: string[] | null;
  start_time?: string | null;
  end_time?: string | null;
  end_date_string?: string | null;
  date_string: string;
  location?: string | null;
  city?: string | null;
  is_virtual?: boolean | null;
  is_free?: boolean | null;
  price?: number | null;
  registration_link?: string | null;
  prizes?: string | null;
  team_size?: string | null;
  website?: string | null;
  is_featured?: boolean | null;
  status?: string | null;
  registration_deadline?: string | null;
  branch_tags?: string[] | null;
  college_branch?: string | null;
  college_year?: string | null;
  college_only?: boolean | null;
  college_id?: string | null;
  poster_url?: string | null;
}

export type SubmitEventActionResult =
  | {
      success: true;
      id: string;
      slug?: string;
      status: "approved" | "pending";
      title: string;
      category: string;
      dateString: string;
      city: string;
      location?: string;
      posterUrl?: string | null;
      isTrusted?: boolean;
      isEditing?: boolean;
    }
  | {
      success: false;
      error: string;
    };

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

    // Auto-sanitize URLs (auto-prefix https:// and nullify empty strings)
    const cleanRegLink = payloadData.registration_link?.trim();
    const finalRegLink = cleanRegLink
      ? /^https?:\/\//i.test(cleanRegLink)
        ? cleanRegLink
        : `https://${cleanRegLink}`
      : null;

    const cleanWebsite = payloadData.website?.trim();
    const finalWebsite = cleanWebsite
      ? /^https?:\/\//i.test(cleanWebsite)
        ? cleanWebsite
        : `https://${cleanWebsite}`
      : null;

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

    const isAdmin = profile?.user_type === "admin" || profile?.role === "admin";
    const isTrustedLink = isVerifiedDomain(finalRegLink, dbDomains.length > 0 ? dbDomains : undefined);
    const finalStatus: "approved" | "pending" = isAdmin || isTrustedLink ? "approved" : "pending";

    // Auto-fetch and assign curator name if organizer_name is empty
    let organizerName = payloadData.organizer_name?.trim();
    if (!organizerName) {
      const authName = (user.user_metadata?.full_name || user.user_metadata?.name) as string | undefined;
      organizerName = profile?.full_name || authName || profile?.username || "Event Curator";
    }

    const eventCity = payloadData.is_virtual
      ? "online"
      : (payloadData.city || payloadData.location || "online");

    const cleanCollegeId =
      payloadData.college_id && payloadData.college_id.trim() !== ""
        ? payloadData.college_id.trim()
        : null;

    if (isEditing && eventId) {
      const updatePayload: TablesUpdate<"events"> = {
        title: payloadData.title.trim(),
        category: payloadData.category,
        organizer_name: organizerName,
        description: payloadData.description?.trim() || null,
        target_audience: payloadData.target_audience || ["Everyone"],
        start_time: payloadData.start_time || null,
        end_time: payloadData.end_time || null,
        end_date_string: payloadData.end_date_string || null,
        date_string: payloadData.date_string,
        location: payloadData.is_virtual ? "Virtual Event" : (payloadData.location || null),
        city: eventCity,
        is_virtual: Boolean(payloadData.is_virtual),
        is_free: Boolean(payloadData.is_free),
        price: payloadData.is_free ? 0 : Number(payloadData.price || 0),
        registration_link: finalRegLink,
        prizes: payloadData.prizes || null,
        team_size: payloadData.team_size || null,
        website: finalWebsite,
        is_featured: Boolean(payloadData.is_featured),
        registration_deadline: payloadData.registration_deadline || null,
        branch_tags: payloadData.branch_tags || null,
        college_branch: payloadData.college_branch || null,
        college_year: payloadData.college_year || null,
        college_only: Boolean(payloadData.college_only),
        college_id: cleanCollegeId,
      };

      if (payloadData.poster_url) {
        updatePayload.poster_url = payloadData.poster_url;
      }

      let query = supabase.from("events").update(updatePayload).eq("id", eventId);
      if (!isAdmin) {
        query = query.eq("creator_id", user.id);
      }

      const { error: updateErr } = await query;
      if (updateErr) throw updateErr;

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
        title: payloadData.title.trim(),
        category: payloadData.category,
        dateString: payloadData.date_string,
        city: eventCity,
        location: payloadData.is_virtual ? "Virtual Event" : (payloadData.location || ""),
        posterUrl: payloadData.poster_url || null,
      };
    }

    // Generate unique slug
    const slugTitle = (payloadData.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const citySlug = eventCity
      ? eventCity.split(",")[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : "online";
    const eventDate = payloadData.date_string ? new Date(payloadData.date_string) : undefined;
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const month = eventDate && !isNaN(eventDate.getTime()) ? monthNames[eventDate.getMonth()] : "";
    const year = eventDate && !isNaN(eventDate.getTime()) ? eventDate.getFullYear().toString() : "";
    const randomSuffix = crypto.randomUUID().split("-")[0].substring(0, 4);
    const uniqueSlug = [slugTitle, citySlug, month, year, randomSuffix].filter(Boolean).join("-");

    const insertPayload: TablesInsert<"events"> = {
      title: payloadData.title.trim(),
      category: payloadData.category,
      organizer_name: organizerName,
      description: payloadData.description?.trim() || null,
      target_audience: payloadData.target_audience || ["Everyone"],
      start_time: payloadData.start_time || null,
      end_time: payloadData.end_time || null,
      end_date_string: payloadData.end_date_string || null,
      date_string: payloadData.date_string,
      location: payloadData.is_virtual ? "Virtual Event" : (payloadData.location || null),
      city: eventCity,
      is_virtual: Boolean(payloadData.is_virtual),
      is_free: Boolean(payloadData.is_free),
      price: payloadData.is_free ? 0 : Number(payloadData.price || 0),
      registration_link: finalRegLink,
      prizes: payloadData.prizes || null,
      team_size: payloadData.team_size || null,
      website: finalWebsite,
      is_featured: Boolean(payloadData.is_featured),
      status: finalStatus,
      approved_at: finalStatus === "approved" ? new Date().toISOString() : null,
      registration_deadline: payloadData.registration_deadline || null,
      branch_tags: payloadData.branch_tags || null,
      college_branch: payloadData.college_branch || null,
      college_year: payloadData.college_year || null,
      college_only: Boolean(payloadData.college_only),
      college_id: cleanCollegeId,
      poster_url: payloadData.poster_url || null,
      slug: uniqueSlug,
      creator_id: user.id,
    };

    const { data: insertedEvent, error: insertErr } = await supabase
      .from("events")
      .insert([insertPayload])
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    // Award +20 ET points if approved live
    if (finalStatus === "approved") {
      try {
        await supabase.rpc("increment_et_score", {
          user_id: user.id,
          delta: 20,
        });
      } catch {}

      // Broadcast push notifications to mobile app users in that city
      try {
        if (insertPayload.city && insertPayload.city !== "online") {
          void supabase.functions.invoke("send-push-notification", {
            body: {
              city: insertPayload.city,
              category: insertPayload.category,
              notification_type: "city_updates",
              title: `New in ${insertPayload.city} · ${insertPayload.category}`,
              body: `"${insertPayload.title}" opened for registration.`,
              data: { eventId: insertedEvent?.id, id: insertedEvent?.id },
              channel_id: "city-updates",
            },
          }).catch(() => {});
        }
      } catch {}

      try {
        revalidateTag("events", "events");
        revalidatePath("/", "layout");
        revalidatePath("/", "page");
        revalidatePath("/search", "page");
        revalidatePath("/cities", "page");
        revalidatePath(`/events/${uniqueSlug}`, "page");
      } catch {}
    }

    return {
      success: true,
      id: insertedEvent?.id || "",
      slug: uniqueSlug,
      status: finalStatus,
      title: insertPayload.title,
      category: insertPayload.category,
      dateString: insertPayload.date_string,
      city: insertPayload.city || eventCity,
      location: insertPayload.location || "",
      posterUrl: insertPayload.poster_url,
      isTrusted: isTrustedLink || isAdmin,
    };
  } catch (err: any) {
    console.error("[submitEventAction] Error:", err);
    const isDuplicateLink =
      err?.code === "23505" &&
      (err?.message?.includes("unique_registration_link") ||
        err?.details?.includes("registration_link"));

    return {
      success: false,
      error: isDuplicateLink
        ? "This event link has already been posted by someone else."
        : (err?.message || "Failed to submit event. Please try again."),
    };
  }
}
