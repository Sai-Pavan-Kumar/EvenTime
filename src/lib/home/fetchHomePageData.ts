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

  // NEW: Dynamically get today's date to display on the button
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleDateString('en-US', { month: 'short' });
  const displayToday = `${day} ${month}`; // Formats to "24 May"

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // 1. Fetch user session and profile for onboarding check
  const { data: { user } } = await supabase.auth.getUser();
  
  // FIX: Extend the ProfileRow type to include 'city' so TypeScript stops complaining
  let profile: (Partial<ProfileRow> & { city?: string }) | null = null; 
  
  // FIX: Properly type personalizedEvents to include matchReason so we don't use 'any'
  let personalizedEvents: (Partial<EventRow> & { matchReason?: string })[] = [];
  let collegeEvents: Partial<EventRow>[] = [];
  let fallbackEvents: Partial<EventRow>[] = []; // Properly defined once

  // Define exact fields needed globally for all queries in this file
  const EVENT_FIELDS = "id, slug, title, category, date_string, start_time, location, city, poster_url, organizer_name, is_free, is_featured, goal_tags, branch_tags, target_audience, is_virtual, lat, lon";

  if (user) {
    // FIX: Removed 'as any' from the select statement
    const { data } = await supabase.from("profiles").select("is_onboarded, branch, goals, role, college_id, city").eq("id", user.id).single();
    profile = data as (Partial<ProfileRow> & { city?: string }) | null;

   // 2. THE MATCHMAKER ENGINE: Fetch events matching user's Branch OR Goals
    if (profile?.is_onboarded && (profile.branch || (profile.goals?.length ?? 0) > 0)) {

      // Fetch by Branch (Filtered at DB level)
      const branchQuery = supabase.from("events").select(EVENT_FIELDS).contains("branch_tags", [profile.branch]).eq("status", "approved");
      const { data: branchEvents } = profile.branch 
        ? await (date ? branchQuery.eq("date_string", date) : branchQuery.gte("date_string", todayStr))
        : { data: [] };
        
      // Fetch by Goals (Filtered at DB level)
      const goalQuery = supabase.from("events").select(EVENT_FIELDS).overlaps("goal_tags", profile.goals || []).eq("status", "approved");
      const { data: goalEvents } = (profile.goals?.length ?? 0) > 0 
        ? await (date ? goalQuery.eq("date_string", date) : goalQuery.gte("date_string", todayStr))
        : { data: [] };

      // Merge and deduplicate intelligently (JS date filtering removed)
      const merged = [...(branchEvents || []), ...(goalEvents || [])];
      
      const uniqueEventsMap = new Map();
      // FIX: Added (event: Partial<EventRow>) type
      merged.forEach((event: Partial<EventRow>) => {
        if (!uniqueEventsMap.has(event.id)) {
          // Identify EXACTLY why this event matched
          const matchReason = getMatchLabel(event, profile);
          
          uniqueEventsMap.set(event.id, { ...event, matchReason });
        }
      });

      // Get the top 4 highly relevant events
      personalizedEvents = Array.from(uniqueEventsMap.values()).slice(0, 4) as (Partial<EventRow> & { matchReason?: string })[];
    }

    // NEW: Fetch events specifically for the student's college (STRICTLY STUDENTS ONLY)
    if (profile?.role === 'student' && profile?.college_id) {
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
  const PUBLIC_EVENT_FIELDS = "id, slug, title, category, date_string, start_time, location, city, poster_url, organizer_name, is_free, is_featured, goal_tags, branch_tags, target_audience, is_virtual, lat, lon";

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

  if (location) query = query.or(`city.ilike.%${location}%,location.ilike.%${location}%`);
  
  if (q) query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%,category.ilike.%${q}%`);

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

  // NEW: Check if there are any events in the user's city (Empty City State Fallback)
  let hasCityEvents = true;
  if (profile?.city && allEvents && allEvents.length > 0 && !q && !category && !branch) {
    // FIX: Added (event: Partial<EventRow>) type
    hasCityEvents = allEvents.some((event: Partial<EventRow>) => 
      event.location?.toLowerCase().includes(profile.city!.toLowerCase()) || 
      event.city?.toLowerCase().includes(profile.city!.toLowerCase())
    );
  }

  // 4. Fetch Active Categories & Event Dates for Dynamic Chips and Calendar Grid (Derived from allEvents to save a query)
  const activeCategories = Array.from(new Set(allEvents.map((e: Partial<EventRow>) => e.category).filter(Boolean) as string[]));
  const activeLocations = Array.from(new Set(allEvents.map((e: Partial<EventRow>) => e.city).filter(Boolean) as string[]));
  const eventDates = Array.from(new Set(allEvents.map((e: Partial<EventRow>) => e.date_string).filter(Boolean) as string[]));
    
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
    
    // Typecast to ensure it matches the Partial<EventRow>[] declaration
    fallbackEvents = (virtualEvents || []) as Partial<EventRow>[];
  }

  return {
    user,
    profile,
    activeTab,
    displayToday,
    date,
    eventDates,
    personalizedEvents,
    collegeEvents,
    fallbackEvents,
    allEvents,
    hasCityEvents,
    dynamicChips,
    dynamicLocationChips,
    featuredEvents,
    isFallback,
    userProfiles,
    branch,
    q,
    category,
    location,
    view
  };
}