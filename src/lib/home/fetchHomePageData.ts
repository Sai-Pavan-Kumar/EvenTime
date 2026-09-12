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
  const PUBLIC_EVENT_FIELDS = "id, slug, title, category, date_string, start_time, end_time, location, city, poster_url, organizer_name, is_free, is_featured, goal_tags, branch_tags, target_audience, is_virtual, college_only, college_id, colleges(name), profiles(username), interested_events(count)";

  // CACHED: Fetch all public active events. This runs once and serves 1M users without hitting DB.
  const getCachedGlobalData = unstable_cache(
    async () => {
      // Fetch only public events (exclude strictly college-only events unless target audience allows it)
      const visibilityFilter = `college_only.is.null,college_only.eq.false,target_audience.cs.{"Everyone"}`;
      
      const sixMonthsAgo = new Date(todayIST);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const sixMonthsAgoStr = sixMonthsAgo.toISOString().substring(0, 10);

      // Fetch events, stats, settings, and calendar dates in parallel inside the Edge Cache
      const [eventsRes, statsRes, settingsRes, datesRes] = await Promise.all([
        supabaseAnon
          .from("events")
          .select(PUBLIC_EVENT_FIELDS)
          .eq("status", "approved")
          .gte("date_string", sixMonthsAgoStr)
          .or(visibilityFilter)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(50),
        supabaseAnon.rpc("get_platform_stats").single(),
        supabaseAnon.from("app_settings").select("leaderboard_enabled").eq("id", 1).maybeSingle(),
        supabaseAnon.from("events").select("date_string").eq("status", "approved").gte("date_string", sixMonthsAgoStr)
      ]);

      const rawAllEvents = eventsRes.data || [];
      const platformStats = (statsRes.data as any) || { event_count: 0, city_count: 0, category_count: 0, user_count: 0 };
      const leaderboardEnabled = settingsRes.data?.leaderboard_enabled ?? true;
      const calendarDates = Array.from(new Set((datesRes.data || []).map((r: any) => r.date_string).filter(Boolean) as string[]));
      
      return {
        rawAllEvents,
        platformStats,
        leaderboardEnabled,
        calendarDates
      };
    },
    ['global_events_cache'],
    { tags: ['events', 'settings'], revalidate: false } // Pure on-demand revalidation on event change
  );

  // Grab the data instantly from Cache (No DB load)
  const { rawAllEvents, platformStats, leaderboardEnabled, calendarDates } = await getCachedGlobalData();
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

  const allEventDates = calendarDates.length > 0
    ? calendarDates
    : Array.from(new Set(allEvents.map(e => e.date_string).filter(Boolean) as string[]));
  const featuredEvents = allEvents.filter(e => e.is_featured);

  return {
    allEvents,
    dynamicChips,
    dynamicLocationChips,
    allEventDates,
    featuredEvents,
    platformStats,
    leaderboardEnabled,
    calendarDates: allEventDates,
    displayToday: `${todayIST.getDate()} ${todayIST.toLocaleDateString('en-US', { month: 'short' })}`
  };
}