import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import EventClientUI from "./EventClientUI";

export const revalidate = 3600;

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
    { tags: ["events", `event_${slug}`], revalidate: 3600 }
  )();

// Fallback for draft/pending events visible only to curator/admin
const getEvent = cache(async (slug: string) => {
  const cached = await getCachedPublicEvent(slug);
  if (cached && cached.status === "approved") {
    return cached;
  }
  try {
    const supabase = await createServerClient();
    const isUUID = isValidUUID(slug);
    let query = supabase.from("events").select(EVENT_DETAIL_FIELDS);
    query = isUUID ? query.eq("id", slug) : query.eq("slug", slug);
    const { data } = await query.maybeSingle();
    return data;
  } catch {
    return cached;
  }
});

const getCachedSimilarEvents = (category: string, currentId: string) =>
  unstable_cache(
    async () => {
      const supabaseAnon = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );
      const todayStr = new Date().toISOString().split("T")[0];
      const { data } = await supabaseAnon
        .from("events")
        .select(EVENT_DETAIL_FIELDS)
        .eq("category", category)
        .eq("status", "approved")
        .gte("date_string", todayStr)
        .neq("id", currentId)
        .order("created_at", { ascending: false })
        .limit(6);
      return data || [];
    },
    ["similar_events", category, currentId],
    { tags: ["events"], revalidate: 3600 }
  )();

const getCachedInterestedAvatars = (eventId: string) =>
  unstable_cache(
    async () => {
      const supabaseAnon = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );
      const { data: interestedRows } = await supabaseAnon
        .from("interested_events")
        .select("profiles(avatar_url, username)")
        .eq("event_id", eventId)
        .limit(3);
      return (interestedRows || []).map((r: any) => r.profiles).filter(Boolean);
    },
    ["interested_avatars", eventId],
    { tags: ["events"], revalidate: 300 }
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
  const event = await getEvent(slug);

  if (!event || event.status !== "approved") return { title: "Event Not Found" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||  "https://eventime.thesurfboard.in";
  const ogUrl = new URL(`${baseUrl}/api/og`);
  ogUrl.searchParams.set("title", event.title);
  if (event.category) ogUrl.searchParams.set("category", event.category);
  if (event.date_string) ogUrl.searchParams.set("date", event.date_string);
  if (event.city) ogUrl.searchParams.set("city", event.city);
  if (event.location) ogUrl.searchParams.set("location", event.location);

  const ogImageUrl = event.poster_url || event.banner_url || ogUrl.toString();

  return {
    title: `${event.title} | EvenTime`,
    description: event.description?.slice(0, 160) || "Check out this event on EvenTime.",
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160) || "Check out this event on EvenTime.",
      images: [ogImageUrl],
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

  // Removed redundant N+1 query. Username is directly mapped from the joined profiles data.
  const profileData = finalEvent?.profiles as { username: string | null }[] | { username: string | null } | null;
  const curatorUsername = (Array.isArray(profileData) ? profileData[0]?.username : profileData?.username) || "event-curator";

  // Ensure pending/rejected events are only visible to the creator or an admin
  if (finalEvent.status !== "approved") {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isCreator = user?.id === finalEvent.creator_id;
    
    let isAdmin = false;
    if (user && !isCreator) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      isAdmin = profile?.role === "admin";
    }

    if (!isCreator && !isAdmin) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-surface-base">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 text-2xl shadow-sm border border-amber-100">⏳</div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 font-['Outfit'] tracking-tight">Event Under Review</h2>
          <p className="text-slate-500 font-medium max-w-md font-['Switzer']">This event is currently pending approval by our moderators or has been rejected. Check back later.</p>
        </div>
      );
    }
  }

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

  // Cached Similar Events & Social Proof Avatars (0ms roundtrips)
  const similarEvents = finalEvent.category
    ? await getCachedSimilarEvents(finalEvent.category, finalEvent.id)
    : [];

  const interestedAvatars = await getCachedInterestedAvatars(finalEvent.id);

  // Pass the data cleanly to the client UI
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <EventClientUI event={finalEvent} similarEvents={similarEvents} curatorUsername={curatorUsername} interestedAvatars={interestedAvatars} collegeName={(finalEvent as any).colleges?.name || null} />
      </Suspense>
    </>
  );
}