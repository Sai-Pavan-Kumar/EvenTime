"use client"
import { useRef, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { EventCard } from "@/app/events/EventCard";
import { OnboardingModal } from "@/components/profile/OnboardingModal";
import Link from "next/link";
import { CalendarDays, Search, Building2, SearchX, ArrowRight } from "lucide-react";
import type { ProfileRow, EventRow } from "@/types";
import { getMatchLabel } from "@/lib/events/match";
import { parseEventDateString } from "@/lib/utils/date";
import { differenceInCalendarDays } from "date-fns";
import type { User } from "@supabase/supabase-js";
import { HeroSection } from "./HeroSection";
import { LandingIntro } from "./LandingIntro";
import { EventGrid } from "./EventGrid";
import { EmptyState } from "./EmptyState";
import { CityGrid } from "./CityGrid";

// The props now ONLY receive the public static buffet from the server
export interface HomePageClientProps {
  allEvents: Partial<EventRow>[];
  dynamicChips: { name: string; value: string; count?: number }[];
  dynamicLocationChips?: { name: string; value: string; count?: number }[];
  allEventDates: string[];
  featuredEvents: Partial<EventRow>[];
  platformStats?: { event_count: number; city_count: number; category_count: number; user_count: number };
  displayToday: string;
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

  // NEW: Client-side User & Profile State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<(Partial<ProfileRow> & { city?: string }) | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Local copies of events
  const [liveAllEvents, setLiveAllEvents] = useState(allEvents);
  const [liveFeaturedEvents, setLiveFeaturedEvents] = useState(featuredEvents);
  const [livePersonalizedEvents, setLivePersonalizedEvents] = useState<Partial<EventRow>[]>([]);
  const [liveAroundYouEvents, setLiveAroundYouEvents] = useState<Partial<EventRow>[]>([]);
  const [liveCollegeEvents, setLiveCollegeEvents] = useState<Partial<EventRow>[]>([]);

  // Pill toggles: Default to 'around_you' initially
  const [activeFeedPill, setActiveFeedPill] = useState<'for_you' | 'around_you' | 'campus'>('around_you');
  
  const isCollegeStudent = !!(user && profile?.user_type === 'student' && profile?.college_id);  

  const isLandingPage = !user && !q && !date && !category;
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

  // NEW: Fetch User & Profile directly from the browser on mount
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        const { data } = await supabase
          .from("profiles")
          .select("is_onboarded, goals, user_type, college_id, preferred_cities")
          .eq("id", currentUser.id)
          .single();
        if (data) {
          setProfile(data as any);
          if (data.goals && data.goals.length > 0) {
            setActiveFeedPill('for_you'); // Switch default if they have goals
          }
        }
      }
      setIsAuthLoading(false);
    };
    fetchUserAndProfile();
  }, []);

  // NEW: Organize the Buffet into Personalized Plates
  useEffect(() => {
    let nonCampusEvents = liveAllEvents || [];
    
    // If student, fetch their private campus events quickly in the background
    if (user && profile?.user_type === 'student' && profile?.college_id) {
      nonCampusEvents = (liveAllEvents || []).filter(e => e.college_id !== profile.college_id);
      
      const fetchCollegeEvents = async () => {
        const supabase = createClient();
        const todayStr = new Date().toISOString().substring(0, 10);
        const { data: cEvents } = await supabase
          .from("events")
          .select("id, slug, title, category, date_string, start_time, end_time, location, city, poster_url, organizer_name, is_free, is_featured, goal_tags, branch_tags, target_audience, is_virtual, college_only, college_id, colleges(name), profiles(username)")
          .eq("status", "approved")
          .eq("college_id", profile.college_id!)
          .gte("date_string", todayStr)
          .order("created_at", { ascending: false })
          .limit(8);
        
        if (cEvents) setLiveCollegeEvents(cEvents as any);
      };
      fetchCollegeEvents();
    }

    // Split into For You and Around You based on profile goals
    if ((profile?.goals?.length ?? 0) > 0) {
      const goalSet = new Set(profile!.goals);
      setLivePersonalizedEvents(nonCampusEvents.filter(e => e.category && goalSet.has(e.category)));
      setLiveAroundYouEvents(nonCampusEvents.filter(e => !(e.category && goalSet.has(e.category))));
    } else {
      setLiveAroundYouEvents(nonCampusEvents);
      setLivePersonalizedEvents([]);
    }
  }, [profile, user, liveAllEvents]);

  // Filtering Logic instantly applies without server hits
  const noFiltersActive = !q && !category && !location && !date && !branch;
  const hasGoals = (profile?.goals?.length ?? 0) > 0;
  const showFeedPills = !!(user && profile?.is_onboarded && (hasGoals || isCollegeStudent) && noFiltersActive);

  let filteredAllEvents = liveAllEvents || [];
  
  if (!noFiltersActive) {
    filteredAllEvents = filteredAllEvents.filter(e => {
      let match = true;
      
      if (date) {
        if (e.date_string !== date) match = false;
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

   const gridSource = !noFiltersActive
    ? filteredAllEvents
    : showFeedPills
      ? (activeFeedPill === 'campus' ? liveCollegeEvents : activeFeedPill === 'for_you' ? livePersonalizedEvents : liveAroundYouEvents)
      : liveAroundYouEvents;

  useEffect(() => { setFeedLoadStage(0); }, [activeFeedPill, q, category, location, date]);
  let clientIsFallback = false;
  let clientFallbackEvents: Partial<EventRow>[] = [];
  if (!noFiltersActive && filteredAllEvents.length === 0) {
    clientIsFallback = true;
    clientFallbackEvents = (liveAllEvents || []).filter(e => e.is_virtual).slice(0, 4);
  }

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar categoryChips={dynamicChips} locationChips={dynamicLocationChips} />
      
      {/* Onboarding check: don't show until auth finishes checking */}
      {!isAuthLoading && user && !profile?.is_onboarded && (
        <OnboardingModal user={user} profile={profile} />
      )}

      <div className="flex flex-col">
        {/* Hide Hero and Stats when in Explore by City (Map) view */}
        {view !== "map" && (
          <>
            {isAuthLoading && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8">
                <div className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
              </div>
            )}

            {!isAuthLoading && !user && (
              <div className="relative">
                <HeroSection stats={platformStats} />
              </div>
            )}

            {/* PLATFORM STATS STRIP */}
            <div className={`sticky top-[80px] z-40 mx-auto mb-10 w-max ${!user ? '-mt-8' : 'mt-8'}`}>
              <div className="flex items-center divide-x divide-slate-200 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-200 px-6 py-3">
                <div className="flex flex-col items-center px-3">
                  <span className="text-base font-black text-slate-900">{String(platformStats?.event_count ?? 0).padStart(2, '0')}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Events</span>
                </div>
                <div className="flex flex-col items-center px-3">
                  <span className="text-base font-black text-slate-900">{String(platformStats?.city_count ?? 0).padStart(2, '0')}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Cities</span>
                </div>
                <div className="flex flex-col items-center px-3">
                  <span className="text-base font-black text-slate-900">{String(platformStats?.category_count ?? 0).padStart(2, '0')}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Categories</span>
                </div>
                <div className="flex flex-col items-center px-3">
                  <span className="text-base font-black text-slate-900">{String(platformStats?.user_count ?? 0).padStart(2, '0')}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Users</span>
                </div>
              </div>
            </div>

          {!isAuthLoading && !user && !q && !date && !category && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <LandingIntro isLeaderboardEnabled={false} isSmartAlertsEnabled={false} />
            </div>
          )}
          </>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20 w-full">
          
          {view === "map" ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-brand-primary" /> Explore by City
              </h2>
              <CityGrid events={liveAllEvents || []} />
            </div>
          ) : (
            <>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-heading font-black text-slate-900 flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-brand-primary" /> 
                    {category ? `${category}s` : "What's happening"}
                  </h2>
                  {branch && <p className="text-slate-500 text-sm font-medium">Showing results for branch: {branch}</p>}
                  {location && <p className="text-slate-500 text-sm font-medium">Showing events in: {location}</p>}

                  {showFeedPills && (
                    <div className="mt-3 inline-flex items-center gap-1 bg-slate-100 rounded-full p-1">
                      <button
                        type="button"
                        onClick={() => setActiveFeedPill('for_you')}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                          activeFeedPill === 'for_you' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        For You
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFeedPill('around_you')}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                          activeFeedPill === 'around_you' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        Around You
                      </button>
                      {isCollegeStudent && (
                        <button
                          type="button"
                          onClick={() => setActiveFeedPill('campus')}
                          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                            activeFeedPill === 'campus' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          Your Campus
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

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
                    
                    <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0">                    
                      {upcomingFeatured.map((event: Partial<EventRow>) => (
                        <div key={`featured-${event.id}`} className="min-w-70 sm:min-w-[320px] md:min-w-[350px] max-w-[350px] snap-start shrink-0">
                          <EventCard 
                            id={event.id as string}
                            slug={event.slug || (event.id as string)}
                            title={event.title!}
                            category={event.category!}
                            date={event.start_time ? `${event.date_string} · ${event.start_time}` : event.date_string!}
                            city={event.location || event.city!}
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
                            isGuest={!user}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="w-full">
                {(() => {
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
                  
                    // Row-based staged reveal: 2 rows first, then 4 rows total, then +3 rows each click
                    const rowSize = isMobile ? 2 : 4;
                    const maxEvents =
                      feedLoadStage === 0 ? rowSize * 2 :
                      feedLoadStage === 1 ? rowSize * 4 :
                      rowSize * 4 + rowSize * 3 * (feedLoadStage - 1);
                    const eventsToShow = sortedEvents.slice(0, maxEvents);

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
                        
                        {sortedEvents.length > maxEvents && (
                          <div className="flex justify-center pt-8">
                            <button
                              onClick={() => setFeedLoadStage((s) => s + 1)}
                              className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:shadow-md hover:border-purple-200 hover:text-brand-primary transition-all flex items-center gap-2 group"
                            >
                              Load More
                              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    const todayObj = new Date();
                    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
                    const isPastDate = date ? date < todayStr : false;
                    
                    const title = isPastDate ? "No past events" : "No exact matches";
                    const message = isPastDate 
                        ? "There were no events hosted on this date." 
                        : q ? `We couldn't find any events for "${q}". But the stage is never empty.` 
                        : location ? `No events happening in ${location} right now. But the stage is never empty.`
                        : category ? `No ${category}s happening right now. But the stage is never empty.` 
                        : `We couldn't find exactly what you're looking for. But the stage is never empty.`;
                    
                    return (
                      <div className="col-span-full">
                        <EmptyState 
                          title={title}
                          message={message}
                          variant="default"
                          showButton={!isPastDate}
                          buttonText="Be the first to host one"
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
                })()}
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}