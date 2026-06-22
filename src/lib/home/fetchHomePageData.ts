import { createClient } from "@/lib/supabase/server";
import { getMatchLabel } from "@/lib/events/match";
import type { ProfileRow, EventRow } from "@/types";
import type { HomePageClientProps } from "./HomePageClient";

export interface HomePageParams {
  branch?: string;
  q?: string;
  date?: string;
  category?: string;
  location?: string;
  view?: string;
  tab?: string;
  show_cal?: string;
}

export async function fetchHomePageData(searchParams: HomePageParams) {
  const { branch, q, date, category, location, view, tab, show_cal } = searchParams;
  const supabase = await createClient();
  const activeTab = tab || "around_you";

  // NEW: Dynamically get today's date using IST timezone.
  // The server runs on UTC time. By forcing it to calculate the date in 'Asia/Kolkata', 
  // we prevent the server from fetching yesterday's events during early morning hours in India,
  // which stops the client-side hydration flashing.
  const serverTime = new Date();
  const todayIST = new Date(serverTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const day = todayIST.getDate();
  const month = todayIST.toLocaleDateString('en-US', { month: 'short' });
  const displayToday = `${day} ${month}`; // Formats to "24 May"

  const yyyy = todayIST.getFullYear();
  const mm = String(todayIST.getMonth() + 1).padStart(2, '0');
  const dd = String(todayIST.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  // 1. Fetch user session and profile for onboarding check
  const { data: { user } } = await supabase.auth.getUser();
  
  // FIX: Extend the ProfileRow type to include 'city' so TypeScript stops complaining
  let profile: (Partial<ProfileRow> & { city?: string }) | null = null; 
  
  // FIX: Properly type personalizedEvents to include matchReason so we don't use 'any'
  let personalizedEvents: (Partial<EventRow> & { matchReason?: string })[] = [];
  let aroundYouEvents: Partial<EventRow>[] = [];
  let collegeEvents: Partial<EventRow>[] = [];
  let otherCollegeEvents: Partial<EventRow>[] = [];
  let fallbackEvents: Partial<EventRow>[] = []; // Properly defined once
  let activeCities: string[] = ["Hyderabad"]; // Default city for guests / non-onboarded users

  // Define exact fields needed globally for all queries in this file
  const EVENT_FIELDS = "id, slug, title, category, date_string, start_time, end_time, location, city, poster_url, organizer_name, is_free, is_featured, goal_tags, branch_tags, target_audience, is_virtual, college_only, college_id";

  if (user) {
    // FIX: Removed 'as any' from the select statement
    const { data } = await supabase.from("profiles").select("is_onboarded, goals, user_type, college_id, preferred_cities").eq("id", user.id).single();
    profile = data as (Partial<ProfileRow> & { city?: string }) | null;

    // City scope: use ALL the user's chosen cities, default stays "Hyderabad" if they haven't picked any
    activeCities = (profile?.preferred_cities?.length ?? 0) > 0 ? (profile!.preferred_cities as string[]) : ["Hyderabad"];

    // NEW: Fetch events specifically for the student's college (STRICTLY STUDENTS ONLY)
    if (profile?.user_type === 'student' && profile?.college_id) {
      let collegeQuery = supabase
        .from("events")
        .select(EVENT_FIELDS) // Replaced "*"
        .eq("status", "approved")
        .eq("college_id", profile.college_id);
        
      collegeQuery = date ? collegeQuery.eq("date_string", date) : collegeQuery.gte("date_string", todayStr);

      const { data: cEvents } = await collegeQuery
        .order("created_at", { ascending: false })
        .limit(8);
      
      collegeEvents = (cEvents || []) as Partial<EventRow>[];

      // NEW: "In Other College" pill — college events hosted elsewhere but open to any student
      let otherCollegeQuery = supabase
        .from("events")
        .select(EVENT_FIELDS)
        .eq("status", "approved")
        .eq("college_only", true)
        .neq("college_id", profile.college_id)
        .contains("target_audience", ["Anyone"]);

      otherCollegeQuery = date ? otherCollegeQuery.eq("date_string", date) : otherCollegeQuery.gte("date_string", todayStr);

      const { data: ocEvents } = await otherCollegeQuery
        .order("created_at", { ascending: false })
        .limit(8);

      otherCollegeEvents = (ocEvents || []) as Partial<EventRow>[];
    }
  }

  // 3. Fetch All Events with Dynamic Filters
  
  // NEW: Get followed curator IDs first
  let followedCuratorIds: string[] = [];
  if (user) {
    const { data: follows } = await supabase
      .from("followers")
      .select("curator_id")
      .eq("follower_id", user.id);
    // FIX: Typed f parameter to include null, as expected by Supabase types
    followedCuratorIds = follows?.map((f: { curator_id: string | null }) => f.curator_id as string) || [];
  }

  // If the EVENT_FIELDS variable wasn't defined above (due to user not being logged in), define it here safely
  const PUBLIC_EVENT_FIELDS = "id, slug, title, category, date_string, start_time, end_time, location, city, poster_url, organizer_name, is_free, is_featured, goal_tags, branch_tags, target_audience, is_virtual, college_only, college_id";

  let query = supabase
    .from("events")
    .select(PUBLIC_EVENT_FIELDS) // Replaced "*"
    .eq("status", "approved");

  // Filter past events at DB level instead of JS to prevent scalability crashes
  if (date) {
    // Matches the start of the ISO string (YYYY-MM-DD)
    query = query.ilike("date_string", `${date}%`);
  } else {
    query = query.gte("date_string", todayStr);
  }
  
  // Final Order: Featured first, then Created Date
  query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });

  if (branch) query = query.contains("branch_tags", [branch]);
  
  if (category) query = query.eq("category", category);

  if (location) {
    query = query.or(`city.ilike.%${location}%,location.ilike.%${location}%`);
  } else if (!date) {
    // No explicit location AND no specific calendar date picked? Scope to the user's chosen cities, but always let virtual/online events through.
    // When a specific date IS picked, skip city scoping so past/other-city events on that date still show.
    const cityFilterList = activeCities.map((c) => `city.eq.${c}`).join(",");
    query = query.or(`${cityFilterList},is_virtual.eq.true`);
  }
  
  if (q) query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%,category.ilike.%${q}%`);

  // College-only events: hide from everyone except students of that exact college,
  // unless the event explicitly opens itself up to "Anyone"
  if (profile?.user_type === 'student' && profile?.college_id) {
    query = query.or(`college_only.is.null,college_only.eq.false,college_id.eq.${profile.college_id},target_audience.cs.{Anyone}`);
  } else {
    query = query.or(`college_only.is.null,college_only.eq.false,target_audience.cs.{Anyone}`);
  }

  const { data: rawAllEvents } = await query;

  // NEW: Fetch user profiles if search query starts with '@'
  let userProfiles: Partial<ProfileRow>[] = [];
  if (q && q.startsWith('@')) {
    const usernameQuery = q.substring(1).trim();
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${usernameQuery}%`)
      .limit(10);
    
    if (profilesData) {
      userProfiles = profilesData as Partial<ProfileRow>[];
    }
  }

 const allEvents = (rawAllEvents || []) as Partial<EventRow>[];

  // Own-college events already show in the "Your Campus" pill — exclude them here
  // so the same event doesn't repeat in "For You" / "Around You".
  const nonCampusEvents = (profile?.user_type === 'student' && profile?.college_id)
    ? allEvents.filter((e) => e.college_id !== profile!.college_id)
    : allEvents;

  // Split the city-scoped feed: "For You" = chosen categories, "Around You" = everything else
  if ((profile?.goals?.length ?? 0) > 0) {
    const goalSet = new Set(profile!.goals);
    const forYou = nonCampusEvents.filter((e) => e.category && goalSet.has(e.category));
    const others = nonCampusEvents.filter((e) => !(e.category && goalSet.has(e.category)));
    personalizedEvents = forYou;
    aroundYouEvents = others;
  } else {
    aroundYouEvents = nonCampusEvents;
  }

  // NEW: Check if there are any events in the user's city (Empty City State Fallback)
  let hasCityEvents = true;
  const primaryCity = profile?.preferred_cities?.[0];
  if (primaryCity && allEvents && allEvents.length > 0 && !q && !category && !branch) {
    // FIX: Added (event: Partial<EventRow>) type
    hasCityEvents = allEvents.some((event: Partial<EventRow>) => 
      event.location?.toLowerCase().includes(primaryCity.toLowerCase()) || 
      event.city?.toLowerCase().includes(primaryCity.toLowerCase())
    );
  }

  // 4. Fetch Active Categories & Event Dates for Dynamic Chips and Calendar Grid (Derived from allEvents to save a query)
  const activeCategories = Array.from(new Set(allEvents.map((e: Partial<EventRow>) => e.category).filter(Boolean) as string[]));
  const eventDates = Array.from(new Set(allEvents.map((e: Partial<EventRow>) => e.date_string).filter(Boolean) as string[]));

  // Fetch ALL approved event dates (unfiltered by date param) so calendar dots persist after date selection
  const { data: allDateRows } = await supabase
    .from("events")
    .select("date_string")
    .eq("status", "approved");

  const allEventDates = Array.from(new Set((allDateRows || []).map((r: { date_string: string | null }) => r.date_string).filter(Boolean) as string[]));

  // Fetch approved + LIVE event cities only (unfiltered by location param) so the location dropdown always shows every city
  const { data: allCityRows } = await supabase
    .from("events")
    .select("city")
    .eq("status", "approved")
    .gte("date_string", todayStr);

  const activeLocations = Array.from(new Set((allCityRows || []).map((r: { city: string | null }) => r.city).filter(Boolean) as string[]));
    
  // Only create the chips array (including 'All') if there are actual categories
  const dynamicChips = activeCategories.length > 0 
    ? [{ name: "All", value: "" }, ...activeCategories.map(cat => ({ name: `${cat}s`, value: cat as string }))]
    : [];
  
  const dynamicLocationChips = activeLocations.length > 0
    ? [{ name: "Anywhere", value: "" }, ...activeLocations.map(loc => ({ name: loc as string, value: loc as string }))]
    : [];

  // NEW: Filter out featured events for the top scrolling section
  // FIX: Added (event: Partial<EventRow>) type
  const featuredEvents = allEvents?.filter((event: Partial<EventRow>) => event.is_featured) || [];

  // --- NEW: EMPTY STATE FALLBACK LOGIC ---
  let isFallback = false;

  // If user searched/filtered and found nothing, fetch some virtual events
  if ((!allEvents || allEvents.length === 0) && (q || category || location || branch)) {
    isFallback = true;
    let virtualQuery = supabase
      .from("events")
      .select(PUBLIC_EVENT_FIELDS) // Replaced "*"
      .eq("status", "approved")
      .eq("is_virtual", true);
      
    virtualQuery = date ? virtualQuery.eq("date_string", date) : virtualQuery.gte("date_string", todayStr);

    const { data: virtualEvents } = await virtualQuery
      .order("created_at", { ascending: false })
      .limit(4);
    
   // AFTER
    // Typecast to ensure it matches the Partial<EventRow>[] declaration
    fallbackEvents = (virtualEvents || []) as Partial<EventRow>[];
  }

  // NEW: Live platform stats for the hero section (single RPC call, no extra round trips)
  const { data: statsData } = await supabase.rpc("get_platform_stats" as any).single();
  const platformStats = (statsData as any) || { event_count: 0, city_count: 0, category_count: 0, user_count: 0 };

  return {
    user,
    profile,
    activeTab,
    displayToday,
    date,
    eventDates,
    allEventDates,
    personalizedEvents,
    aroundYouEvents,
    collegeEvents,
    otherCollegeEvents,
    fallbackEvents,
    allEvents,
    hasCityEvents,
    activeCities,
    dynamicChips,
    dynamicLocationChips,
    featuredEvents,
    isFallback,
    userProfiles,
    branch,
    q,
    category,
    location,
    view,
    platformStats
  };
}