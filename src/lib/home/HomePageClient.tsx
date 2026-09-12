"use client"
import { useRef, useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { EventCard } from "@/app/events/EventCard";
import { OnboardingModal } from "@/components/profile/OnboardingModal";
import Link from "next/link";
import { CalendarDays, Search, Building2, SearchX, ArrowRight, X } from "lucide-react";
import type { ProfileRow, EventRow } from "@/types";
import { getMatchLabel } from "@/lib/events/match";
import { parseEventDateString } from "@/lib/utils/date";
import { differenceInCalendarDays } from "date-fns";
import type { User } from "@supabase/supabase-js";
import { eventSync } from "@/lib/events/eventSync";
import { HeroSection } from "./HeroSection";
import { LandingIntro } from "./LandingIntro";
import { EventGrid } from "./EventGrid";
import { EmptyState } from "./EmptyState";
import { CityGrid } from "./CityGrid";
import { useAuth } from "@/context/AuthContext";

// The props now ONLY receive the public static buffet from the server
export interface HomePageClientProps {
  allEvents: Partial<EventRow>[];
  dynamicChips: { name: string; value: string; count?: number }[];
  dynamicLocationChips?: { name: string; value: string; count?: number }[];
  allEventDates: string[];
  featuredEvents: Partial<EventRow>[];
  platformStats?: { event_count: number; city_count: number; category_count: number; user_count: number };
  displayToday: string;
  leaderboardEnabled?: boolean;
  calendarDates?: string[];
}


const PROFILE_STORAGE_KEY = 'et_cached_profile';
const CAMPUS_EVENTS_STORAGE_KEY = 'et_cached_campus_events';

function getLocalProfile(): (Partial<ProfileRow> & { city?: string }) | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalProfile(data: (Partial<ProfileRow> & { city?: string }) | null) {
  if (typeof window === 'undefined') return;
  try {
    if (data) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(CAMPUS_EVENTS_STORAGE_KEY);
    }
  } catch {}
}

function getLocalCampusEvents(): Partial<EventRow>[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CAMPUS_EVENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalCampusEvents(events: Partial<EventRow>[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CAMPUS_EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch {}
}

export function HomePageClient(props: HomePageClientProps) {
  const {
    allEvents,
    dynamicChips,
    dynamicLocationChips,
    allEventDates,
    featuredEvents,
    platformStats,
    displayToday
  } = props;

  // NEW: Read all filters instantly from the URL in the browser (Jet Speed)
  const searchParams = useSearchParams();
  const branch = searchParams.get('branch') || undefined;
  const q = searchParams.get('q') || undefined;
  const category = searchParams.get('category') || undefined;
  const location = searchParams.get('location') || undefined;
  const date = searchParams.get('date') || undefined;
  const view = searchParams.get('view') || undefined;

  // Read directly from centralized AuthContext (0 network requests for guests)
  const { user, profile: authProfile, isLoading: isAuthLoading } = useAuth();
  const profile = (authProfile || getLocalProfile()) as (Partial<ProfileRow> & { city?: string }) | null;

  // Local copies of events
  const [liveAllEvents, setLiveAllEvents] = useState(allEvents);
  const [liveFeaturedEvents, setLiveFeaturedEvents] = useState(featuredEvents);
  const [liveCollegeEvents, setLiveCollegeEvents] = useState<Partial<EventRow>[]>(() => getLocalCampusEvents());

  // Determine initial active pill synchronously on Frame 1
  const [activeFeedPill, setActiveFeedPill] = useState<'for_you' | 'around_you' | 'campus'>(() => {
    const cached = getLocalProfile();
    return (cached?.goals && cached.goals.length > 0) ? 'for_you' : 'around_you';
  });
  
  const isCollegeStudent = !!((user || profile) && profile?.user_type === 'student' && profile?.college_id);

  // Apple-grade Campus Batch Eligibility Filter (All Events vs Eligible for Me)
  const [campusFilterMode, setCampusFilterMode] = useState<'all' | 'eligible'>('all');

  const studentBranch = (profile?.branch || '').trim().toLowerCase();
  const studentGradYear = profile?.graduation_year ? String(profile.graduation_year).trim().toLowerCase() : '';

  const isEligibleForCampusStudent = useCallback(
    (ev: Partial<EventRow>) => {
      if (!ev) return false;
      if (!studentBranch && !studentGradYear) return true;

      // 1. Branch match: all branches, exact match, or bracketed abbreviation match
      const evBranch = (ev.college_branch || '').trim().toLowerCase();
      const evBranches = ev.branch_tags || (evBranch ? [evBranch] : []);
      let branchMatch = !evBranch || evBranch === 'all branches' || evBranch === 'all';
      if (!branchMatch && studentBranch) {
        if (evBranch === studentBranch || evBranches.some((b: string) => {
          const bl = b.toLowerCase();
          return bl === 'all' || bl === 'all branches' || bl === studentBranch;
        })) {
          branchMatch = true;
        } else {
          // Check bracketed abbreviation if exists, e.g. "CSE"
          const evCode = evBranch.match(/\(([^)]+)\)/)?.[1]?.trim() || '';
          const sCode = studentBranch.match(/\(([^)]+)\)/)?.[1]?.trim() || '';
          if (evCode && sCode && evCode === sCode) {
            branchMatch = true;
          }
        }
      }

      // 2. Year match: all years or exact match
      const evYear = (ev.college_year || '').toString().trim().toLowerCase();
      let yearMatch = !evYear || evYear === 'all years' || evYear === 'all';
      if (!yearMatch && studentGradYear) {
        if (evYear === studentGradYear) {
          yearMatch = true;
        }
      }

      return branchMatch && yearMatch;
    },
    [studentBranch, studentGradYear]
  );

  const eligibleCollegeEvents = useMemo(() => {
    return liveCollegeEvents.filter(isEligibleForCampusStudent);
  }, [liveCollegeEvents, isEligibleForCampusStudent]);

  const displayedCollegeEvents = useMemo(() => {
    if (campusFilterMode === 'eligible') {
      return eligibleCollegeEvents;
    }
    return liveCollegeEvents;
  }, [campusFilterMode, eligibleCollegeEvents, liveCollegeEvents]);  

  const isLandingPage = !user && !profile && !q && !date && !category;
  const [feedLoadStage, setFeedLoadStage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync with server if the static buffet updates via ISR
  useEffect(() => { setLiveAllEvents(allEvents); }, [allEvents]);
  useEffect(() => { setLiveFeaturedEvents(featuredEvents); }, [featuredEvents]);

  // Reactive client-side deletion sync
  useEffect(() => {
    const unsubscribe = eventSync.subscribe((payload) => {
      if (payload.type === 'delete') {
        setLiveAllEvents((prev) => prev.filter((e) => e.id !== payload.eventId && e.slug !== payload.eventId));
        setLiveFeaturedEvents((prev) => prev.filter((e) => e.id !== payload.eventId && e.slug !== payload.eventId));
      }
    });
    return unsubscribe;
  }, []);

  // Sync active feed pill when user goals are available
  useEffect(() => {
    if (profile?.goals && profile.goals.length > 0) {
      setActiveFeedPill('for_you');
    }
  }, [profile?.goals]);

  const preferredCities = useMemo(() => profile?.preferred_cities || [], [profile?.preferred_cities]);
  const cityMatch = useCallback(
    (e: Partial<EventRow>) =>
      Boolean(e.is_virtual) ||
      preferredCities.length === 0 ||
      (e.city ? preferredCities.includes(e.city) : false),
    [preferredCities]
  );

  const nonCampusEvents = useMemo(() => {
    if (profile?.user_type === 'student' && profile?.college_id) {
      return (liveAllEvents || []).filter((e) => e.college_id !== profile.college_id);
    }
    return liveAllEvents || [];
  }, [liveAllEvents, profile?.user_type, profile?.college_id]);

  // Synchronous, zero-lag plate computation:
  const livePersonalizedEvents = useMemo(() => {
    if (!profile?.goals || profile.goals.length === 0) return [];
    const goalSet = new Set(profile.goals);
    return nonCampusEvents.filter((e) => isUpcomingEvent(e) && cityMatch(e) && !!(e.category && goalSet.has(e.category)));
  }, [nonCampusEvents, profile?.goals, cityMatch]);

  const liveAroundYouEvents = useMemo(() => {
    if (profile?.goals && profile.goals.length > 0) {
      const goalSet = new Set(profile.goals);
      return nonCampusEvents.filter((e) => cityMatch(e) && !(e.category && goalSet.has(e.category)));
    }
    return nonCampusEvents.filter(cityMatch);
  }, [nonCampusEvents, profile?.goals, cityMatch]);

  // Background fetch for campus events if student
  useEffect(() => {
    if (profile?.user_type === 'student' && profile?.college_id) {
      const fetchCollegeEvents = async () => {
        const supabase = createClient();
        const todayStr = new Date().toISOString().substring(0, 10);
        let query = supabase
          .from("events")
          .select("id, slug, title, category, date_string, start_time, end_time, location, city, poster_url, organizer_name, is_free, is_featured, goal_tags, branch_tags, college_branch, college_year, target_audience, is_virtual, college_only, college_id, colleges(name), profiles(username)")
          .eq("status", "approved")
          .eq("college_id", profile.college_id!);

        if (date) {
          query = query.eq("date_string", date);
        } else {
          query = query.gte("date_string", todayStr);
        }

        const { data: cEvents } = await query
          .order("date_string", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(50);

        if (cEvents) {
          setLiveCollegeEvents(cEvents as any);
          setLocalCampusEvents(cEvents as any);
        }
      };
      fetchCollegeEvents();
    }
  }, [profile?.user_type, profile?.college_id, date]);

  // Smart cascading filters: options in each dropdown narrow down based on
  // the OTHER filter currently selected — computed from already-loaded
  // events (liveAllEvents), no extra database call.
  const isUpcomingEvent = (e: Partial<EventRow>) => {
    const checkDate = parseEventDateString(e.date_string || "");
    if (!checkDate) return true;
    return differenceInCalendarDays(checkDate, new Date()) >= 0;
  };

  const cascadingCategoryChips = useMemo(() => {
    const upcoming = (liveAllEvents || []).filter(isUpcomingEvent);
    const source = location ? upcoming.filter((e) => e.city === location) : upcoming;
    const cats = Array.from(new Set(source.map((e) => e.category).filter(Boolean) as string[]));
    return cats.length > 0
      ? [{ name: "All", value: "" }, ...cats.map((cat) => ({ name: `${cat}s`, value: cat }))]
      : dynamicChips;
  }, [liveAllEvents, location, dynamicChips]);

  const cascadingLocationChips = useMemo(() => {
    const upcoming = (liveAllEvents || []).filter(isUpcomingEvent);
    const source = category ? upcoming.filter((e) => e.category === category) : upcoming;
    const locs = Array.from(new Set(source.map((e) => e.city).filter(Boolean) as string[]));
    return locs.length > 0
      ? [{ name: "Anywhere", value: "" }, ...locs.map((loc) => ({ name: loc.toLowerCase() === "online" ? "Online" : loc, value: loc }))]
      : dynamicLocationChips;
  }, [liveAllEvents, category, dynamicLocationChips]);

  const bothCategoryAndLocationPicked = !!category && !!location;
  // Filtering Logic instantly applies without server hits
  const noFiltersActive = !q && !category && !location && !date && !branch;
  const hasGoals = (profile?.goals?.length ?? 0) > 0;
  const showFeedPills = Boolean((user || profile) && profile && noFiltersActive);

  let filteredAllEvents = liveAllEvents || [];

  if (!noFiltersActive) {
    filteredAllEvents = filteredAllEvents.filter(e => {
      let match = true;
      
      if (date) {
        if (e.date_string !== date) match = false;
        if (location && !e.city?.toLowerCase().includes(location.toLowerCase()) && !e.location?.toLowerCase().includes(location.toLowerCase())) match = false;
      } else {
        if (branch && !e.branch_tags?.includes(branch)) match = false;
        if (category && e.category !== category) match = false;
        if (location && !e.city?.toLowerCase().includes(location.toLowerCase()) && !e.location?.toLowerCase().includes(location.toLowerCase())) match = false;
      }

      if (q) {
        const query = q.toLowerCase();
        if (!e.title?.toLowerCase().includes(query) && 
            !e.category?.toLowerCase().includes(query) &&
            !e.city?.toLowerCase().includes(query) &&
            !e.location?.toLowerCase().includes(query)) {
          match = false;
        }
      }
      return match;
    });
  }

  const isUpcoming = (e: Partial<EventRow>) => {
    const checkDate = parseEventDateString(e.date_string || "");
    if (!checkDate) return true;
    return differenceInCalendarDays(checkDate, new Date()) >= 0;
  };

  const allUpcomingEvents = useMemo(() => {
    return (liveAllEvents || []).filter(isUpcoming);
  }, [liveAllEvents]);

  const gridSource = !noFiltersActive
    ? filteredAllEvents
    : (user || profile)
      ? (activeFeedPill === 'campus' ? displayedCollegeEvents : activeFeedPill === 'for_you' ? livePersonalizedEvents : liveAroundYouEvents)
      : allUpcomingEvents;

  const upcomingForYouCount = livePersonalizedEvents.filter(isUpcoming).length;
  const upcomingAroundYouCount = liveAroundYouEvents.filter(isUpcoming).length;
  const upcomingCollegeCount = liveCollegeEvents.filter(isUpcoming).length;
  useEffect(() => { setFeedLoadStage(0); }, [activeFeedPill, q, category, location, date]);
  let clientIsFallback = false;
  let clientFallbackEvents: Partial<EventRow>[] = [];
  if (!noFiltersActive && filteredAllEvents.length === 0) {
    clientIsFallback = true;
    clientFallbackEvents = (liveAllEvents || []).filter(e => e.is_virtual).slice(0, 4);
  }

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar 
        categoryChips={cascadingCategoryChips} 
        locationChips={cascadingLocationChips} 
        platformStats={platformStats} 
        leaderboardEnabled={props.leaderboardEnabled}
        calendarDates={props.calendarDates || allEventDates}
      />

      {/* Top Stationary Greeting and Feed Segmented Tabs (Only for logged-in users) */}
      {Boolean((user || profile) && profile) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-3 pb-1">
          <div className="flex flex-col gap-2.5">
            <h1 className="text-[22px] sm:text-2xl font-heading font-black text-[#0F172A] tracking-[-0.4px] truncate">
              {(() => {
                const h = new Date().getHours();
                const rawName = profile?.username?.trim() || profile?.full_name?.split(" ")[0]?.trim();
                const name = rawName ? (rawName.length > 12 ? rawName.slice(0, 12) : rawName) : "there";
                if (h >= 6 && h < 9) return `Morning, ${name}.`;
                if (h >= 9 && h < 12) return `Tiffin time, ${name}.`;
                if (h >= 12 && h < 14) return `Afternoon, ${name}.`;
                if (h >= 14 && h < 17) return `Lunch done, ${name}?`;
                if (h >= 17 && h < 18) return `Snack time, ${name}.`;
                if (h >= 18 && h < 20) return `Evening, ${name}.`;
                if (h >= 20 && h < 22) return `Dinner time, ${name}.`;
                if (h >= 22 && h < 23) return `Dinner done yet, ${name}?`;
                if (h >= 23 || h < 0) return `Night, ${name} — sleep well.`;
                if (h >= 0 && h < 4) return `Still up, ${name}?`;
                return `Up early, ${name}?`;
              })()}
            </h1>

            {showFeedPills && (
              <div className="w-full max-w-md bg-[#F1F5F9] rounded-[14px] p-[3px] flex items-center h-11 relative">
                <button
                  type="button"
                  onClick={() => setActiveFeedPill('for_you')}
                  className={`flex-1 h-full rounded-[11px] text-[13px] font-bold font-['Switzer',sans-serif] transition-all flex items-center justify-center gap-1.5 z-10 ${
                    activeFeedPill === 'for_you'
                      ? 'bg-white text-[#0F172A] shadow-[0_2px_4px_rgba(0,0,0,0.08)]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <span>For You</span>
                  <span className={`text-[11px] font-semibold ${activeFeedPill === 'for_you' ? 'text-brand-primary' : 'text-[#94A3B8]'}`}>
                    ({upcomingForYouCount})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFeedPill('around_you')}
                  className={`flex-1 h-full rounded-[11px] text-[13px] font-bold font-['Switzer',sans-serif] transition-all flex items-center justify-center gap-1.5 z-10 ${
                    activeFeedPill === 'around_you'
                      ? 'bg-white text-[#0F172A] shadow-[0_2px_4px_rgba(0,0,0,0.08)]'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <span>Around You</span>
                  <span className={`text-[11px] font-semibold ${activeFeedPill === 'around_you' ? 'text-brand-primary' : 'text-[#94A3B8]'}`}>
                    ({upcomingAroundYouCount})
                  </span>
                </button>

                {isCollegeStudent && (
                  <button
                    type="button"
                    onClick={() => setActiveFeedPill('campus')}
                    className={`flex-1 h-full rounded-[11px] text-[13px] font-bold font-['Switzer',sans-serif] transition-all flex items-center justify-center gap-1.5 z-10 ${
                      activeFeedPill === 'campus'
                        ? 'bg-white text-[#0F172A] shadow-[0_2px_4px_rgba(0,0,0,0.08)]'
                        : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                  >
                    <span>Your Campus</span>
                    <span className={`text-[11px] font-semibold ${activeFeedPill === 'campus' ? 'text-brand-primary' : 'text-[#94A3B8]'}`}>
                      ({upcomingCollegeCount})
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Onboarding check: don't show until auth finishes checking */}
      {!isAuthLoading && !profile?.is_onboarded && (<OnboardingModal user={user} profile={profile} />
      )}
      <div className="flex flex-col">
        {/* Hide Hero and Stats when in Explore by City (Map) view */}
        {view !== "cities" && (
          <>
            {isAuthLoading && !profile && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8">
                <div className="h-48 bg-slate-100/70 rounded-3xl animate-pulse" />
              </div>
            )}

            {!isAuthLoading && !user && !profile && !q && !date && !category && !location && (
              <div className="relative">
                <HeroSection />
              </div>
            )}

          {!isAuthLoading && !user && !profile && !q && !date && !category && !location && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <LandingIntro isLeaderboardEnabled={false} isSmartAlertsEnabled={false} />
            </div>
          )}
          </>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12 w-full">
          
          {view === "cities" ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-brand-primary" /> Explore by City
              </h2>
              <CityGrid events={liveAllEvents || []} />
            </div>
          ) : (
            <>
            <div className="space-y-6 pt-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="w-full">
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-brand-primary" /> 
                      {category && location 
                        ? `${category}s in ${location === "online" ? "Online" : location}`
                        : date
                        ? `Events on ${new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`
                        : (!user && !profile)
                        ? "What's Happening"
                        : activeFeedPill === 'for_you'
                        ? 'For You'
                        : activeFeedPill === 'around_you'
                        ? 'Around You'
                        : 'Your Campus'}
                    </h2>
                    <span className="text-xs sm:text-sm font-bold text-slate-400">
                      {date
                        ? `${filteredAllEvents.length} ${filteredAllEvents.length === 1 ? 'event' : 'events'}`
                        : (!user && !profile)
                        ? `${allUpcomingEvents.length} ${allUpcomingEvents.length === 1 ? 'event' : 'events'}`
                        : activeFeedPill === 'for_you' 
                        ? `${upcomingForYouCount} ${upcomingForYouCount === 1 ? 'event' : 'events'}` 
                        : activeFeedPill === 'around_you' 
                        ? `${upcomingAroundYouCount} ${upcomingAroundYouCount === 1 ? 'event' : 'events'}` 
                        : `${upcomingCollegeCount} ${upcomingCollegeCount === 1 ? 'event' : 'events'}`}
                    </span>
                  </div>
                  {branch && <p className="text-slate-500 text-sm font-medium mt-1">Showing results for branch: {branch}</p>}
                  {location && <p className="text-slate-500 text-sm font-medium mt-1">Showing events in: {location}</p>}
                </div>
              </div>

                            {/* Active Calendar Date Banner */}
              {date && (
                <div className="flex items-center justify-between bg-purple-50 border border-purple-200/80 rounded-2xl px-4 py-2.5 mb-6">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#6C47FF]" />
                    <span className="text-xs sm:text-sm font-bold text-[#6C47FF]">
                      Showing events for {new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-bold transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear
                  </Link>
                </div>
              )}

              {/* Campus Batch Filter Pills (All Events vs Eligible for Me) */}
              {activeFeedPill === 'campus' && isCollegeStudent && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-100">
                  <div className="inline-flex items-center gap-1 bg-purple-50/80 p-1 rounded-full border border-purple-100">
                    <button
                      type="button"
                      onClick={() => setCampusFilterMode('all')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        campusFilterMode === 'all'
                          ? 'bg-[#6C47FF] text-white shadow-sm'
                          : 'text-purple-700 hover:text-purple-900'
                      }`}
                    >
                      All Events ({liveCollegeEvents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampusFilterMode('eligible')}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        campusFilterMode === 'eligible'
                          ? 'bg-[#6C47FF] text-white shadow-sm'
                          : 'text-purple-700 hover:text-purple-900'
                      }`}
                    >
                      Eligible for Me ({eligibleCollegeEvents.length})
                    </button>
                  </div>
                  {studentBranch && (
                    <span className="text-xs font-semibold text-slate-400">
                      Eligible for {studentBranch.toUpperCase()} {studentGradYear ? `('${studentGradYear.slice(-2)})` : ''}
                    </span>
                  )}
                </div>
              )}

              {(() => {
                const upcomingFeatured = (liveFeaturedEvents || []).filter(e => {
                  const checkDate = parseEventDateString(e.date_string || "");
                  if (!checkDate) return true;
                  const today = new Date();
                  return differenceInCalendarDays(checkDate, today) >= 0;
                });

                if (upcomingFeatured.length === 0 || q || category || location) return null;

                return (
                  <div className="col-span-full mb-10 mt-6">
                    <div className="flex items-center justify-between mb-6 px-2">
                      <h2 className="text-2xl font-black text-slate-900 font-heading">
                        Featured Events
                      </h2>
                      <Link 
                        href="/events?view=grid" 
                        className="text-sm font-bold text-brand-primary hover:text-[#5835e5] transition-colors flex items-center gap-1"
                      >
                        View All <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                    
                    <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0">                    
                      {upcomingFeatured.map((event: Partial<EventRow>) => (
                        <div key={`featured-${event.id}`} className="min-w-70 sm:min-w-[320px] md:min-w-87.5 max-w-87.5 snap-start shrink-0">
                          <EventCard 
                            id={event.id as string}
                            slug={event.slug || (event.id as string)}
                            title={event.title!}
                            category={event.category!}
                            date={event.start_time ? `${event.date_string} · ${event.start_time}` : event.date_string!}
                            city={event.is_virtual ? "Online" : (event.city || event.location || "India")}
                            imageUrl={event.poster_url || ""}
                            organizerName={event.organizer_name!}
                            organizerUsername={(event as any).profiles?.username}
                            isFree={event.is_free!}
                            isFeatured={true}
                            matchLabel={getMatchLabel(event, profile)}
                            audience={event.target_audience!}
                            collegeName={
                              event.college_id && profile?.college_id === event.college_id 
                              ? null
                                : (event as any).colleges?.name
                            }
                            interestedCount={(event as any).interested_events?.[0]?.count ?? (event as any).interested_count ?? 0}
                            isGuest={!user && !profile}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="w-full">
                {isAuthLoading && !profile ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <div key={n} className="h-96 bg-slate-100/80 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  (() => {
                    const upcomingEvents = (gridSource || []).filter(e => {
                    if (date) return true; // Don't filter if viewing a specific date
                    const checkDate = parseEventDateString(e.date_string || "");
                    if (!checkDate) return true;
                    const today = new Date();
                    return differenceInCalendarDays(checkDate, today) >= 0;
                  });

                  if (upcomingEvents.length > 0) {
                    const sortedEvents = [...upcomingEvents].sort((a, b) => {
                      const dateDiff = (a.date_string || "").localeCompare(b.date_string || "");
                      if (dateDiff !== 0) return dateDiff;
                      const toMinutes = (t?: string | null) => {
                        if (!t) return 0;
                        const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
                        if (!match) return 0;
                        let h = parseInt(match[1], 10);
                        const m = parseInt(match[2], 10);
                        if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
                        if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
                        return h * 60 + m;
                      };
                      return toMinutes(a.start_time) - toMinutes(b.start_time);
                    });
                  
                    // For guests (!user && !profile): show strictly 4 events first; "Show More" reveals next 4 (max 8)
                    const isGuest = !user && !profile;
                    const guestLimit = feedLoadStage === 0 ? 4 : 8;
                    const eventsToShow = isGuest
                      ? sortedEvents.slice(0, guestLimit)
                      : (() => {
                          const rowSize = isMobile ? 2 : 4;
                          const maxEvents =
                            feedLoadStage === 0 ? rowSize * 2 :
                            feedLoadStage === 1 ? rowSize * 4 :
                            rowSize * 4 + rowSize * 3 * (feedLoadStage - 1);
                          return sortedEvents.slice(0, maxEvents);
                        })();

                    return (
                      <div className="space-y-12">
                        <EventGrid
                          events={eventsToShow}
                          profile={profile}
                          user={user}
                          useMatchLogic={false}
                          gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                          isPastDateView={!!date && date < new Date().toISOString().substring(0, 10)}
                        />
                        
                        {isGuest ? (
                          <>
                            {/* If at stage 0 and there are more than 4 events, show "Show More" */}
                            {feedLoadStage === 0 && sortedEvents.length > 4 ? (
                              <div className="flex justify-center pt-6">
                                <button
                                  type="button"
                                  onClick={() => setFeedLoadStage(1)}
                                  className="px-8 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:shadow-md hover:border-purple-200 hover:text-brand-primary transition-all flex items-center gap-2 group cursor-pointer"
                                >
                                  <span>Show More</span>
                                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                                </button>
                              </div>
                            ) : (
                              /* After clicking Show More (or if total events <= 4), show Sign In CTA card */
                              <div className="mt-8 p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm text-center flex flex-col items-center justify-center gap-4">
                                <div className="max-w-md">
                                  <h3 className="text-xl font-bold font-heading text-slate-900 font-['Outfit']">
                                    Want to explore all events across India?
                                  </h3>
                                  <p className="text-sm text-slate-500 font-['Switzer',sans-serif] mt-1">
                                    Sign in to discover hackathons, tech meetups, and college fests with personalized matching and instant RSVPs.
                                  </p>
                                </div>
                                <Link
                                  href="/login"
                                  className="px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white font-bold text-sm rounded-full shadow-md shadow-brand-primary/20 transition-all active:scale-95 flex items-center gap-2"
                                >
                                  <span>Sign In to view all</span>
                                  <ArrowRight className="w-4 h-4" />
                                </Link>
                              </div>
                            )}
                          </>
                        ) : (
                          sortedEvents.length > eventsToShow.length && (
                            <div className="flex justify-center pt-8">
                              <button
                                onClick={() => setFeedLoadStage((s) => s + 1)}
                                className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:shadow-md hover:border-purple-200 hover:text-brand-primary transition-all flex items-center gap-2 group cursor-pointer"
                              >
                                Load More
                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    );
                  } else {
                    const todayObj = new Date();
                    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
                    const isPastDate = date ? date < todayStr : false;
                    
                    const isCampusTab = activeFeedPill === 'campus';
                    const isForYouTab = activeFeedPill === 'for_you';
                    const isAroundYouTab = activeFeedPill === 'around_you';
                    const isGuest = !user && !profile;

                    const isCampusEligibleTab = isCampusTab && campusFilterMode === 'eligible';
                    const isCampusAllTab = isCampusTab && campusFilterMode === 'all';

                    // 1. Direct, Unconditional Image Selection by Active Feed Tab
                    const emptyImageSrc = isCampusTab
                      ? (isCampusEligibleTab ? "/eligible_for_me.webp" : "/no_college_events.webp")
                      : isForYouTab
                      ? "/For_you.webp"
                      : isAroundYouTab
                      ? "/Around_you.webp"
                      : q
                      ? "/illustrations/search_state.webp"
                      : "/illustrations/Empty_state.webp";

                    // 2. Clear, Dedicated Title per Tab
                    const title = isPastDate
                      ? "No past events"
                      : date
                      ? "No Events Scheduled"
                      : isCampusEligibleTab
                      ? "No Specific Batch Events"
                      : isCampusAllTab
                      ? "No Campus Events Yet"
                      : isForYouTab
                      ? (liveAroundYouEvents.length > 0
                          ? "No Events In Your Categories"
                          : "No Events in " + (preferredCities.length ? preferredCities.join(', ') : 'Your City'))
                      : isAroundYouTab
                      ? (livePersonalizedEvents.length > 0
                          ? "All caught up in " + (preferredCities.length ? preferredCities.join(', ') : 'your city') + "!"
                          : "No Events in " + (preferredCities.length ? preferredCities.join(', ') : 'your city'))
                      : isGuest && upcomingEvents.length === 0
                      ? "No Upcoming Events Yet"
                      : "No exact matches";

                    // 3. Clear, Distinct Message per Tab
                    const message = isPastDate
                      ? "There were no events hosted on this date."
                      : date
                      ? `There are no events scheduled for ${new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}. Be the first to host one!`
                      : isCampusEligibleTab
                      ? "No events are currently restricted to your branch or graduation year. Switch to All Events to explore everything happening on campus!"
                      : isCampusAllTab
                      ? "There are no private events currently listed for your campus. Host one for your college!"
                      : isForYouTab
                      ? (liveAroundYouEvents.length > 0
                        ? "Events are happening in " + (preferredCities.length ? preferredCities.join(', ') : 'your city') + ", but none currently match your selected interest categories. Explore 'Around You' to discover them, or update your preferences in Profile!"
                        : "No upcoming events found in " + (preferredCities.length ? preferredCities.join(', ') : 'your city') + ". Add more cities in your Profile or host an event yourself to get the community buzzing!")
                      : isAroundYouTab
                      ? (livePersonalizedEvents.length > 0
                        ? "All scheduled events in " + (preferredCities.length ? preferredCities.join(', ') : 'your city') + " currently match your selected interests and are waiting in 'For You'. Check back soon as new categories are added!"
                        : "No upcoming events found in " + (preferredCities.length ? preferredCities.join(', ') : 'your city') + ". Add more cities in your Profile or host an event yourself to get the community started!")
                      : isGuest && upcomingEvents.length === 0
                      ? "Stay tuned! New hackathons, workshops, and tech events across India are added regularly."
                      : q ? `We couldn't find any events for "${q}". But the stage is never empty.`
                      : location ? `No events happening in ${location} right now. Try changing your city or category filters for better matches.`
                      : category ? `No ${category}s happening right now. Try changing your city or category filters for better matches.`
                      : `We couldn't find exactly what you're looking for. Try changing your city or category filters for better matches.`;

                    // 4. Action Buttons and Call-to-Action Handlers
                    const showBtn = !isPastDate;
                    const btnText = date
                      ? "Clear Date"
                      : isCampusEligibleTab
                      ? "Show All Campus Events"
                      : isCampusAllTab
                      ? "Host an Event"
                      : isForYouTab
                      ? (liveAroundYouEvents.length > 0 ? "Explore Around You" : (user || profile ? "Update Preferences" : "Sign In / Sign Up"))
                      : isAroundYouTab
                      ? (livePersonalizedEvents.length > 0 ? "View For You" : (user || profile ? "Update Cities" : "Sign In / Sign Up"))
                      : isGuest
                      ? "Sign In / Sign Up"
                      : "Be the first to host one";

                    const onAction = date
                      ? () => {
                          const params = new URLSearchParams(searchParams.toString());
                          params.delete('date');
                          window.history.replaceState(null, '', '?' + params.toString());
                          window.location.reload();
                        }
                      : isCampusEligibleTab
                      ? () => setCampusFilterMode('all')
                      : isForYouTab && liveAroundYouEvents.length > 0
                      ? () => setActiveFeedPill('around_you')
                      : isAroundYouTab && livePersonalizedEvents.length > 0
                      ? () => setActiveFeedPill('for_you')
                      : undefined;

                    const actionHref = date || isCampusEligibleTab || (isForYouTab && liveAroundYouEvents.length > 0) || (isAroundYouTab && livePersonalizedEvents.length > 0)
                      ? undefined
                      : isCampusAllTab
                      ? "/events/new"
                      : isForYouTab
                      ? (user || profile ? "/profile" : "/login")
                      : isAroundYouTab
                      ? (user || profile ? "/profile" : "/login")
                      : isGuest
                      ? "/login"
                      : undefined;
                    
                    return (
                      <div className="col-span-full">
                        <EmptyState 
                          title={title}
                          message={message}
                          imageSrc={emptyImageSrc}
                          variant="default"
                          showButton={showBtn}
                          buttonText={btnText}
                          onAction={onAction}
                          actionHref={actionHref}
                        />
                      
                        {clientIsFallback && clientFallbackEvents.length > 0 && (
                          <div className="mt-16 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="h-px bg-slate-200 flex-1" />
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                                Showing Virtual Events Instead
                              </span>
                              <div className="h-px bg-slate-200 flex-1" />
                            </div>

                            <EventGrid 
                              events={clientFallbackEvents}
                              gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                              defaultMatchLabel="Recommended Virtual"
                              user={user}
                            />
                          </div>
                        )}
                      </div>
                    );
                  }
                })())}
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}