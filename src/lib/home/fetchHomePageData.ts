import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { EventRow } from "@/types";

export async function fetchHomePageData() {
  // Use anon client so it's fully static and doesn't rely on cookies or auth headers
  const supabaseAnon = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const serverTime = new Date();
  const todayIST = new Date(serverTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const yyyy = todayIST.getFullYear();
  const mm = String(todayIST.getMonth() + 1).padStart(2, '0');
  const dd = String(todayIST.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  
  const PUBLIC_EVENT_FIELDS = "id, slug, title, category, date_string, start_time, end_time, location, city, poster_url, organizer_name, is_free, is_featured, goal_tags, branch_tags, target_audience, is_virtual, college_only, college_id, colleges(name), profiles(username)";

  // CACHED: Fetch all public active events. This runs once and serves 1M users without hitting DB.
  const getCachedGlobalData = unstable_cache(
    async (today: string) => {
      // Fetch only public events (exclude strictly college-only events unless target audience allows it)
      let visibilityFilter = `college_only.is.null,college_only.eq.false,target_audience.cs.{Anyone}`;
      
      const { data: rawAllEvents } = await supabaseAnon
        .from("events")
        .select(PUBLIC_EVENT_FIELDS)
        .eq("status", "approved")
        .gte("date_string", today)
        .or(visibilityFilter)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      // Fetch platform stats for hero section
      const { data: statsData } = await supabaseAnon.rpc("get_platform_stats").single();
      const platformStats = statsData as { event_count: number; city_count: number; category_count: number; user_count: number };
      
      return {
        rawAllEvents: rawAllEvents || [],
        platformStats: platformStats || { event_count: 0, city_count: 0, category_count: 0, user_count: 0 }
      };
    },
    ['global_events_cache'],
    { tags: ['events'], revalidate: 3600 } // Cache for 1 hour
  );

  // Grab the data instantly from Cache (No DB load)
  const { rawAllEvents, platformStats } = await getCachedGlobalData(todayStr);
  const allEvents = rawAllEvents as Partial<EventRow>[];

  // Derive dynamic lists from the cached events for filters
  const activeCategories = Array.from(new Set(allEvents.map(e => e.category).filter(Boolean) as string[]));
  const dynamicChips = activeCategories.length > 0 
    ? [{ name: "All", value: "" }, ...activeCategories.map(cat => ({ name: `${cat}s`, value: cat }))]
    : [];

  const activeLocations = Array.from(new Set(allEvents.map(e => e.city).filter(Boolean) as string[]));
  const dynamicLocationChips = activeLocations.length > 0
    ? [{ name: "Anywhere", value: "" }, ...activeLocations.map(loc => ({ name: loc, value: loc }))]
    : [];

  const allEventDates = Array.from(new Set(allEvents.map(e => e.date_string).filter(Boolean) as string[]));
  const featuredEvents = allEvents.filter(e => e.is_featured);

  return {
    allEvents,
    dynamicChips,
    dynamicLocationChips,
    allEventDates,
    featuredEvents,
    platformStats,
    displayToday: `${todayIST.getDate()} ${todayIST.toLocaleDateString('en-US', { month: 'short' })}`
  };
}