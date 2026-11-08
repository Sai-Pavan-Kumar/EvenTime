import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { LoadMoreGrid } from "@/components/shared/LoadMoreGrid";
import { getCityConfig } from "@/lib/city-config";
import { CITIES } from "@/lib/constants/cities";
import { MapPin } from "lucide-react";
import { toJsonLd } from "@/lib/utils";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { ONLINE_CITY, PUBLIC_AUDIENCE_FILTER, cityLabel, localDateString, resolveCity, shortDate, upcomingFilter } from "../cityEvents";
import { CityHero } from "./CityHero";

const SOON_DAYS = 7;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const resolved = resolveCity(city);
  if (!resolved) {
    return { title: "City Not Found | EvenTime" };
  }
  const isOnline = resolved === ONLINE_CITY;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventime.thesurfboard.in";
  const title = isOnline ? "Online Events | EvenTime" : `Events in ${resolved} | EvenTime`;
  const description = isOnline
    ? "Discover the best online events, hackathons, and meetups on EvenTime."
    : `Discover the best events, hackathons, and meetups in ${resolved} on EvenTime.`;

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

import { cookies } from "next/headers";

export const revalidate = 600;

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const resolved = resolveCity(city);
  if (!resolved) {
    notFound();
  }
  const isOnline = resolved === ONLINE_CITY;
  const cityName = cityLabel(resolved);
  const heading = isOnline ? "Online Events" : cityName;
  const today = localDateString();

  const EVENT_FIELDS = "id, slug, title, category, date_string, end_date_string, start_time, location, city, poster_url, organizer_name, is_free, is_featured, target_audience, college_id, creator_id, profiles(username)";

  // CACHED: public events for this city (same for every anonymous/non-student visitor)
  const getCachedPublicCityEvents = unstable_cache(
    async () => {
      const supabaseAnon = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );
      // Throwing keeps a failed read out of the cache
      const { data, error } = await supabaseAnon
        .from("events")
        .select(EVENT_FIELDS)
        .eq("status", "approved")
        .ilike("city", resolved)
        .or(upcomingFilter(today))
        .or(PUBLIC_AUDIENCE_FILTER)
        .order("date_string", { ascending: true })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    [`city_events_${resolved.toLowerCase()}`],
    { tags: ["events"], revalidate: 600 } // 10 minutes
  );

  // Fast check: Only query Supabase auth if session cookie is present
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some(c => c.name.includes("-auth-token"));

  let user = null;
  let profile: { user_type: string | null; college_id: string | null } | null = null;
  let supabaseServer = null;

  if (hasAuthCookie) {
    supabaseServer = await createClient();
    const { data: authData } = await supabaseServer.auth.getUser();
    user = authData.user;
    if (user) {
      const { data: prof } = await supabaseServer.from("profiles").select("user_type, college_id").eq("id", user.id).single();
      profile = prof;
    }
  }

  let loadFailed = false;
  const publicEvents: any[] = await getCachedPublicCityEvents().catch((err) => {
    console.warn("[CityPage] Could not load events:", err);
    loadFailed = true;
    return [];
  });

  // 3. UNCACHED but tiny: only this user's own extra visible events
  let personalEvents: any[] = [];
  if (user) {
    let extraFilter = `creator_id.eq.${user.id}`;
    if (profile?.user_type === "student" && profile?.college_id) {
      extraFilter += `,college_id.eq.${profile.college_id}`;
    }
    const { data } = await supabaseServer!
      .from("events")
      .select(EVENT_FIELDS)
      .eq("status", "approved")
      .ilike("city", resolved)
      .or(upcomingFilter(today))
      .or(extraFilter)
      .order("date_string", { ascending: true })
      .limit(50);
    personalEvents = data || [];
  }

  // 4. Merge, de-duplicate by id
  const eventMap = new Map();
  [...publicEvents, ...personalEvents].forEach((e: any) => eventMap.set(e.id, e));
  const events = Array.from(eventMap.values()).sort((a, b) => a.date_string.localeCompare(b.date_string));

  // Running events started before today, so they naturally land in "soon"
  const soonLimit = new Date();
  soonLimit.setDate(soonLimit.getDate() + SOON_DAYS);
  const soonDate = localDateString(soonLimit);
  const soonEvents = events.filter((e) => e.date_string <= soonDate);
  const laterEvents = events.filter((e) => e.date_string > soonDate);
  const eventGroups = [
    { title: `Next ${SOON_DAYS} days`, events: soonEvents },
    { title: "Later", events: laterEvents },
  ].filter((group) => group.events.length > 0);

  const nextDate = events[0]?.date_string;
  const heroStats = nextDate
    ? {
        upcoming: events.length,
        next: nextDate < today ? "Now" : nextDate === today ? "Today" : shortDate(nextDate),
        free: events.filter((e) => e.is_free).length,
      }
    : null;
  const hostHref = `/events/new?city=${encodeURIComponent(resolved)}`;
  const hostLabel = isOnline ? "Host an online event" : `Host An Event in ${cityName}`;

  const cityConfig = getCityConfig(resolved);

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
        eventAttendanceMode: isOnline ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: isOnline
          ? { "@type": "VirtualLocation", url: `${baseUrl}/events/${ev.slug}` }
          : { "@type": "Place", name: ev.location || cityName, address: cityName },
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
        dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }}
      />
      <Navbar />
      
      <CityHero heading={heading} cityImage={cityConfig?.backgroundImage} hostHref={hostHref} hostLabel={hostLabel} stats={heroStats} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loadFailed ? (
          <div role="alert" className="py-20 flex flex-col items-center text-center bg-white rounded-[32px] border border-slate-200 shadow-sm">
            <h3 className="text-slate-900 font-bold text-lg font-heading">Could not load events</h3>
            <p className="text-slate-500 font-medium text-sm mt-2">Check your connection and try again.</p>
            <a href={`/cities/${city}`} className="mt-6 inline-flex items-center min-h-11 px-6 bg-brand-primary text-white font-bold rounded-xl text-sm active:scale-95 transition-transform">
              Try again
            </a>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-12">
            {eventGroups.map((group) => (
              <section key={group.title}>
                <h2 className="mb-6 flex items-baseline gap-2 text-2xl md:text-3xl font-black text-slate-900 font-heading tracking-tight">
                  {group.title}
                  <span className="text-base font-bold text-slate-500">{group.events.length}</span>
                </h2>
                <LoadMoreGrid events={group.events} gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" />
              </section>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[32px] border border-dashed border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-bold text-lg font-heading">No Upcoming Events</h3>
            <p className="text-slate-500 font-medium text-sm mt-2 max-w-sm">
              There are no upcoming {isOnline ? "online events" : `events in ${cityName}`} right now. Check back soon or host the first one!
            </p>
            <Link
              href={hostHref}
              className="mt-6 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-all text-sm shadow-sm active:scale-95 flex items-center gap-2"
            >
              {hostLabel}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}