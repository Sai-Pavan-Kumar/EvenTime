import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/permissions";
import EventClientUI from "./EventClientUI";

// Helper function to check if the slug is a valid UUID
const isValidUUID = (id: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const EVENT_DETAIL_FIELDS = "id, slug, title, category, date_string, start_time, end_date_string, end_time, location, city, is_virtual, poster_url, banner_url, organizer_name, description, registration_link, is_free, price, prizes, team_size, registration_deadline, college_branch, college_year, college_only, branch_tags, goal_tags, website, target_audience, creator_id, status, college_id, colleges(name), interested_events(count),profiles(username, full_name)";

// CACHED: Static/Public event fetcher using anon client (zero cookie dependencies, blazing fast)
const getCachedPublicEvent = (slug: string) =>
  unstable_cache(
    async () => {
      const supabaseAnon = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );
      const isUUID = isValidUUID(slug);
      let query = supabaseAnon.from("events").select(EVENT_DETAIL_FIELDS);
      query = isUUID ? query.eq("id", slug) : query.eq("slug", slug);
      const { data } = await query.maybeSingle();
      return data;
    },
    ["event_detail", slug],
    { tags: ["events", `event_${slug}`], revalidate: false }
  )();

// Fallback for draft/pending events visible to curator/admin (service role fetch, 0 cookies)
const getEvent = cache(async (slug: string) => {
  const cached = await getCachedPublicEvent(slug);
  if (cached && cached.status === "approved") {
    return cached;
  }
  try {
    const adminClient = createAdminClient();
    const isUUID = isValidUUID(slug);
    let query = adminClient.from("events").select(EVENT_DETAIL_FIELDS);
    query = isUUID ? query.eq("id", slug) : query.eq("slug", slug);
    const { data } = await query.maybeSingle();
    return data || cached;
  } catch {
    return cached;
  }
});

const getCachedCityEvents = (city: string | null, isVirtual: boolean, currentId: string) =>
  unstable_cache(
    async () => {
      const supabaseAnon = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );
      const todayStr = new Date().toISOString().split("T")[0];
      let query = supabaseAnon
        .from("events")
        .select(EVENT_DETAIL_FIELDS)
        .eq("status", "approved")
        .gte("date_string", todayStr)
        .neq("id", currentId);

      const normalizedCity = city?.trim().toLowerCase();
      if (isVirtual || normalizedCity === "online") {
        query = query.or("is_virtual.eq.true,city.ilike.online");
      } else if (city?.trim()) {
        query = query.ilike("city", city.trim());
      }

      const { data } = await query
        .order("date_string", { ascending: true })
        .limit(20);
      return data || [];
    },
    ["city_events", city || "virtual", String(isVirtual), currentId],
    { tags: ["events"], revalidate: false }
  )();

const getCachedInterestedAvatars = (eventId: string) =>
  unstable_cache(
    async () => {
      const supabaseAnon = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );
      const { data } = await supabaseAnon
        .from("interested_events")
        .select("profiles(username, avatar_url)")
        .eq("event_id", eventId)
        .limit(3);
      return (data || []).map((row: any) => row.profiles).filter(Boolean);
    },
    ["interested_avatars", eventId],
    { tags: [`event_interested_${eventId}`], revalidate: false }
  )();

const getCachedAppBannerSetting = () =>
  unstable_cache(
    async () => {
      try {
        const supabaseAnon = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { auth: { persistSession: false } }
        );
        const { data } = await supabaseAnon
          .from("app_settings")
          .select("app_banner_enabled")
          .eq("id", 1)
          .maybeSingle();
        return Boolean(data?.app_banner_enabled);
      } catch {
        return false;
      }
    },
    ["app_settings_banner"],
    { tags: ["app_settings"], revalidate: false }
  )();

export async function generateStaticParams() {
  try {
    const supabaseAnon = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const { data } = await supabaseAnon
      .from("events")
      .select("slug, id")
      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30);

    return (data || []).map((ev) => ({
      slug: ev.slug || ev.id,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getCachedPublicEvent(slug);

  if (!event || event.status !== "approved") return { title: "Event Not Found" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||  "https://eventime.thesurfboard.in";
  const ogUrl = new URL(`${baseUrl}/api/og`);
  ogUrl.searchParams.set("title", event.title);
  if (event.category) ogUrl.searchParams.set("category", event.category);
  if (event.date_string) ogUrl.searchParams.set("date", event.date_string);
  if (event.city) ogUrl.searchParams.set("city", event.city);
  if (event.location) ogUrl.searchParams.set("location", event.location);

  const hasCustomUpload = event.poster_url && event.poster_url.startsWith("http");
  const ogImageUrl = hasCustomUpload ? event.poster_url : ogUrl.toString();

  return {
    title: `${event.title} | EvenTime`,
    description: event.description?.slice(0, 160) || "Check out this event on EvenTime.",
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160) || "Check out this event on EvenTime.",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
      url: `${baseUrl}/events/${event.slug || event.id}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.description?.slice(0, 160) || "Check out this event on EvenTime.",
      images: [ogImageUrl],
    },
  };
}

// Convert "10:00 AM" or "02:30 PM" to "HH:mm:00" for Schema.org ISO format
function to24Hour(timeStr: string | null | undefined): string | null {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  const [, h, m, ampm] = match;
  let hour = parseInt(h, 10);
  if (!ampm) return `${String(hour).padStart(2, "0")}:${m}:00`;
  if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${m}:00`;
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const finalEvent = await getEvent(slug);

  if (!finalEvent) {
    notFound();
  }

  // Security Gate: Non-approved events (pending, draft, rejected) must only be accessible to their creator or admins
  if (finalEvent.status !== "approved") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      notFound();
    }

    const isCreator = user.id === finalEvent.creator_id;
    const isAdmin = await requireAdmin(supabase as any, user.id);

    if (!isCreator && !isAdmin) {
      notFound();
    }
  }

  // Removed redundant N+1 query. Username is directly mapped from the joined profiles data.
  const profileData = finalEvent?.profiles as { username: string | null }[] | { username: string | null } | null;
  const curatorUsername = (Array.isArray(profileData) ? profileData[0]?.username : profileData?.username) || "event-curator";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||  "https://eventime.thesurfboard.in";
  const eventUrl = `${baseUrl}/events/${finalEvent.slug || finalEvent.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: finalEvent.title,
    description: finalEvent.description,
    startDate: finalEvent.date_string ? `${finalEvent.date_string}T${to24Hour(finalEvent.start_time) || "00:00:00"}` : undefined,
    endDate: finalEvent.end_date_string ? `${finalEvent.end_date_string}T${to24Hour(finalEvent.end_time) || "00:00:00"}` : undefined,
    eventAttendanceMode: finalEvent.is_virtual 
      ? "https://schema.org/OnlineEventAttendanceMode" 
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: finalEvent.is_virtual
      ? {
          "@type": "VirtualLocation",
          url: finalEvent.registration_link || finalEvent.website || eventUrl,
        }
      : {
          "@type": "Place",
          name: finalEvent.location || "TBA",
          address: {
            "@type": "PostalAddress",
            addressLocality: finalEvent.city || "TBA",
          },
        },
    image: [finalEvent.poster_url || finalEvent.banner_url || `${baseUrl}/api/og?title=${encodeURIComponent(finalEvent.title)}`].filter(Boolean),
    offers: {
      "@type": "Offer",
      url: finalEvent.registration_link || eventUrl,
      price: finalEvent.is_free ? "0" : (finalEvent.price?.toString() || "0"),
      priceCurrency: "INR", 
      availability: "https://schema.org/InStock"
    },
    organizer: {
      "@type": "Organization",
      name: finalEvent.organizer_name || "EvenTime",
    }
  };

  // Cached City Events & Social Proof Avatars (0ms roundtrips)
  const similarEvents = await getCachedCityEvents(
    finalEvent.city,
    Boolean(finalEvent.is_virtual),
    finalEvent.id
  );

  const interestedAvatars = await getCachedInterestedAvatars(finalEvent.id);
  const isAppBannerEnabled = await getCachedAppBannerSetting();

  // Pass the data cleanly to the client UI
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <EventClientUI
          event={finalEvent}
          similarEvents={similarEvents}
          curatorUsername={curatorUsername}
          interestedAvatars={interestedAvatars}
          collegeName={(finalEvent as any).colleges?.name || null}
          isAppBannerEnabled={isAppBannerEnabled}
        />
      </Suspense>
    </>
  );
}