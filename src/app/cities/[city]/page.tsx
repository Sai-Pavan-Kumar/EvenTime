import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { LoadMoreGrid } from "@/components/shared/LoadMoreGrid";
import { getCityConfig } from "@/lib/city-config";
import { CITIES } from "@/lib/constants/cities";
import { MapPin } from "lucide-react";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const decodedCity = decodeURIComponent(city).replace(/-/g, ' ');
  const normalized = decodedCity.trim().toLowerCase();
  const matchedCity = CITIES.find((c) => c.toLowerCase() === normalized);
  if (!matchedCity && !getCityConfig(city)) {
    return { title: "City Not Found | EvenTime" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventime.thesurfboard.in";
  const title = `Events in ${matchedCity || decodedCity} | EvenTime`;
  const description = `Discover the best events, hackathons, and meetups in ${matchedCity || decodedCity} on EvenTime.`;

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/cities/${city}` },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/cities/${city}`,
      type: "website",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const decodedCity = decodeURIComponent(city).replace(/-/g, ' ');
  const normalized = decodedCity.trim().toLowerCase();
  const matchedCity = CITIES.find((c) => c.toLowerCase() === normalized);
  if (!matchedCity && !getCityConfig(city)) {
    notFound();
  }

  const supabase = await createClient();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const EVENT_FIELDS = "id, slug, title, category, date_string, start_time, location, city, poster_url, organizer_name, is_free, is_featured, target_audience, college_id, creator_id, profiles(username)";

  // CACHED: public events for this city (same for every anonymous/non-student visitor)
  const getCachedPublicCityEvents = unstable_cache(
    async () => {
      const supabaseAnon = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );
      const { data } = await supabaseAnon
        .from("events")
        .select(EVENT_FIELDS)
        .eq("status", "approved")
        .ilike("city", matchedCity || decodedCity)
        .gte("date_string", todayStr)
        .or(`college_only.is.null,college_only.eq.false,target_audience.cs.{"Everyone"}`)
        .order("date_string", { ascending: true })
        .limit(50);
      return data || [];
    },
    [`city_events_${(matchedCity || decodedCity).toLowerCase()}`],
    { tags: ["events"], revalidate: 600 } // 10 minutes
  );

  // 1. Run the auth check AND the cached public events fetch at the same time
  const [{ data: { user } }, publicEvents] = await Promise.all([
    supabase.auth.getUser(),
    getCachedPublicCityEvents(),
  ]);

  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("user_type, college_id").eq("id", user.id).single();
    profile = data;
  }

  // 3. UNCACHED but tiny: only this user's own extra visible events
  let personalEvents: any[] = [];
  if (user) {
    let extraFilter = `creator_id.eq.${user.id}`;
    if (profile?.user_type === "student" && profile?.college_id) {
      extraFilter += `,college_id.eq.${profile.college_id}`;
    }
    const { data } = await supabase
      .from("events")
      .select(EVENT_FIELDS)
      .eq("status", "approved")
      .ilike("city", matchedCity || decodedCity)
      .gte("date_string", todayStr)
      .or(extraFilter)
      .order("date_string", { ascending: true })
      .limit(50);
    personalEvents = data || [];
  }

  // 4. Merge, de-duplicate by id
  const eventMap = new Map();
  [...publicEvents, ...personalEvents].forEach((e: any) => eventMap.set(e.id, e));
  const events = Array.from(eventMap.values());

  const cityConfig = getCityConfig(decodedCity);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventime.thesurfboard.in";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: (events || []).slice(0, 20).map((ev, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Event",
        name: ev.title,
        startDate: ev.date_string || undefined,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Place",
          name: ev.location || decodedCity,
          address: decodedCity,
        },
        image: ev.poster_url ? [ev.poster_url] : undefined,
        organizer: ev.organizer_name ? { "@type": "Organization", name: ev.organizer_name } : undefined,
        isAccessibleForFree: ev.is_free ?? undefined,
        url: `${baseUrl}/events/${ev.slug}`,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-surface-base pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      
      {/* City Cover Hero — only shown if a real cover image exists for this city */}
      {cityConfig.coverImage && (
        <div className="w-full h-[35vh] md:h-[45vh] relative mt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full h-full rounded-[32px] overflow-hidden relative shadow-sm border border-slate-200/60">
            <img 
              src={cityConfig.coverImage} 
              alt={decodedCity} 
              className="w-full h-full object-cover object-bottom"
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 font-heading capitalize truncate">
            Events happening in {matchedCity || decodedCity}
          </h2>
          <span className="text-sm font-bold text-slate-500 bg-slate-200/60 px-3 py-1.5 rounded-xl border border-slate-200 w-fit shrink-0">
            {events?.length || 0} {events?.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>

        {events && events.length > 0 ? (
          <LoadMoreGrid events={events} gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" />
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[32px] border border-dashed border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-bold text-lg font-heading">No Upcoming Events</h3>
            <p className="text-slate-500 font-medium text-sm mt-2 max-w-sm">
              There are no upcoming events scheduled in {matchedCity || decodedCity} right now. Check back soon or host the first one!
            </p>
            <Link
              href={`/events/new?city=${encodeURIComponent(matchedCity || decodedCity)}`}
              className="mt-6 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-[#5835e5] transition-all text-sm shadow-sm active:scale-95 flex items-center gap-2"
            >
              Host An Event in {matchedCity || decodedCity}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}