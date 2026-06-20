"use client"
import { useRef, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { EventCard } from "@/app/events/EventCard";
import { OnboardingModal } from "@/components/profile/OnboardingModal";
import { CalendarStrip } from "@/components/layout/CalendarStrip";
import Link from "next/link";
import { Sparkles, CalendarDays, Search, Map as MapIcon, SearchX, ArrowRight, X } from "lucide-react";
import type { ProfileRow, EventRow } from "@/types";
import { getMatchLabel } from "@/lib/events/match";
import type { User } from "@supabase/supabase-js";
import { HeroSection } from "./HeroSection";
import { FilterChips } from "./FilterChips";
import { EventGrid } from "./EventGrid";
import { EmptyState } from "./EmptyState";
import { CityGrid } from "./CityGrid";

// Interface for all the props passed down from the server orchestrator
export interface HomePageClientProps {
  user: User | null; // Supabase user object
  profile: (Partial<ProfileRow> & { city?: string }) | null;
  activeTab: string;
  displayToday: string;
  personalizedEvents: (Partial<EventRow> & { matchReason?: string })[];
  aroundYouEvents: Partial<EventRow>[];
  collegeEvents: Partial<EventRow>[];
  otherCollegeEvents: Partial<EventRow>[];
  fallbackEvents: Partial<EventRow>[];
  allEvents: Partial<EventRow>[] | null;
  hasCityEvents: boolean;
  dynamicChips: { name: string; value: string; count?: number }[];
  dynamicLocationChips?: { name: string; value: string; count?: number }[];
  date?: string;
  eventDates: string[];
  allEventDates: string[];
  featuredEvents: Partial<EventRow>[];
  isFallback: boolean;
  userProfiles: Partial<ProfileRow>[];
  branch?: string;
  q?: string;
  category?: string;
  location?: string;
  view?: string;
}

export function HomePageClient(props: HomePageClientProps) {
  const {
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
  } = props;

  // Local copies of the server-fetched event lists, so we can remove an event
  // instantly (without a full page refresh) when it gets deleted/rejected elsewhere.
  const [livePersonalizedEvents, setLivePersonalizedEvents] = useState(personalizedEvents);
  const [liveAroundYouEvents, setLiveAroundYouEvents] = useState(aroundYouEvents);
  const [liveCollegeEvents, setLiveCollegeEvents] = useState(collegeEvents);
  const [liveOtherCollegeEvents, setLiveOtherCollegeEvents] = useState(otherCollegeEvents);
  const [liveFallbackEvents, setLiveFallbackEvents] = useState(fallbackEvents);
  const [liveAllEvents, setLiveAllEvents] = useState(allEvents);
  const [liveFeaturedEvents, setLiveFeaturedEvents] = useState(featuredEvents);

  // Pill toggles: which sub-feed is active inside each section
  const [activeFeedPill, setActiveFeedPill] = useState<'for_you' | 'around_you'>('for_you');
  const [activeCollegePill, setActiveCollegePill] = useState<'mine' | 'other'>('mine');
  
  // Keep local state in sync if the server sends fresh props (e.g. after navigation/filter change)
  useEffect(() => { setLivePersonalizedEvents(personalizedEvents); }, [personalizedEvents]);
  useEffect(() => { setLiveAroundYouEvents(aroundYouEvents); }, [aroundYouEvents]);
  useEffect(() => { setLiveCollegeEvents(collegeEvents); }, [collegeEvents]);
  useEffect(() => { setLiveOtherCollegeEvents(otherCollegeEvents); }, [otherCollegeEvents]);
  useEffect(() => { setLiveFallbackEvents(fallbackEvents); }, [fallbackEvents]);
  useEffect(() => { setLiveAllEvents(allEvents); }, [allEvents]);
  useEffect(() => { setLiveFeaturedEvents(featuredEvents); }, [featuredEvents]);

  // Realtime: listen for any event becoming non-approved (rejected/deleted) and
  // instantly remove it from whatever list it's currently shown in.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("home-events-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        (payload) => {
          const newRow = payload.new as { id?: string; status?: string } | null;
          const oldRow = payload.old as { id?: string } | null;
          const removedId = payload.eventType === "DELETE"
            ? oldRow?.id
            : (newRow?.status && newRow.status !== "approved" ? newRow.id : null);

          if (!removedId) return;

          setLivePersonalizedEvents((prev) => prev.filter((e) => e.id !== removedId));
          setLiveAroundYouEvents((prev) => prev.filter((e) => e.id !== removedId));
          setLiveCollegeEvents((prev) => prev.filter((e) => e.id !== removedId));
          setLiveOtherCollegeEvents((prev) => prev.filter((e) => e.id !== removedId));
          setLiveFallbackEvents((prev) => prev.filter((e) => e.id !== removedId));
          setLiveAllEvents((prev) => prev ? prev.filter((e) => e.id !== removedId) : prev);
          setLiveFeaturedEvents((prev) => prev.filter((e) => e.id !== removedId));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Added ref to control the native <details> dropdown
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Effect to close the calendar when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
        detailsRef.current.removeAttribute("open");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Calculate the display text for the date toggle based on the selected 'date' prop
  let activeDateDisplay = displayToday;
  if (date) {
    const [year, month, day] = date.split('-');
    if (year && month && day) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthIndex = parseInt(month, 10) - 1;
      const dayNum = parseInt(day, 10);
      
      if (monthIndex >= 0 && monthIndex <= 11 && !isNaN(dayNum)) {
        activeDateDisplay = `${dayNum} ${monthNames[monthIndex]}`;
      }
    }
  }

  // Function to close the calendar when a date is selected
  const closeCalendar = () => {
    if (detailsRef.current) {
      detailsRef.current.removeAttribute("open");
    }
  };

  // No filters active = passive browsing mode → show pill-based feed. Any filter active → show liveAllEvents directly.
  const noFiltersActive = !q && !category && !location && !date;
  const hasGoals = (profile?.goals?.length ?? 0) > 0;
  const showFeedPills = !!(user && profile?.is_onboarded && hasGoals && noFiltersActive);
  const gridSource = !noFiltersActive
    ? liveAllEvents
    : showFeedPills
      ? (activeFeedPill === 'for_you' ? livePersonalizedEvents : liveAroundYouEvents)
      : liveAroundYouEvents;

  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      <Navbar />
      
      {/* Onboarding check: user & profile null unna sare modal render avvali */}
      {!profile?.is_onboarded && (
        <OnboardingModal user={user} profile={profile} />
      )}

      <div className="flex flex-col">
        {/* Header Section Background & Combined Navigation Pill */}
        <div className="relative">
          <HeroSection />
        </div>

        {/* COMBINED DISCOVERY PILL - Moved out of the relative div to parent scope for sticky to work */}
        <div className="sticky top-[80px] -mt-8 z-40 mx-auto bg-white/95 backdrop-blur-md rounded-[28px] sm:rounded-full shadow-lg border border-slate-200 px-4 py-3 sm:py-2 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-[92vw] sm:w-max sm:max-w-[90vw] mb-10">
            
            {/* INSTANT DISCOVERY CHIPS */}
            <div className="flex items-center justify-center gap-1.5 max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
              <span className="text-sm font-bold text-slate-500 whitespace-nowrap">Explore:</span>
              <FilterChips dynamicChips={dynamicChips} category={category} location={location} q={q} branch={branch} paramName="category" />
              
              {dynamicLocationChips && dynamicLocationChips.length > 0 && (
                <>
                  <div className="h-4 w-px bg-slate-200 shrink-0 mx-1" />
                  <span className="text-sm font-bold text-slate-500 whitespace-nowrap">In:</span>
                  <FilterChips dynamicChips={dynamicLocationChips} category={category} location={location} q={q} branch={branch} paramName="location" />
                </>
              )}
            </div>

            {/* DIVIDER */}
            <div className="hidden sm:block h-6 w-px bg-slate-300 shrink-0" />

            {/* DATE TOGGLE (Right Corner) */}
            <details ref={detailsRef} className="group cursor-pointer shrink-0 relative">
              <summary className="flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-[#555570] hover:text-[#6C47FF] hover:bg-slate-50 transition-all list-none [&::-webkit-details-marker]:hidden select-none active:scale-95">
                <CalendarDays className="w-4 h-4 text-[#6C47FF]" />
                {activeDateDisplay}
              </summary>
              
              {/* CALENDAR STRIP DROPDOWN */}
              <div className="absolute right-0 mt-4 w-[min(calc(100vw-2rem),360px)] -translate-x-[max(0px,calc(100%-100vw+2rem))] sm:translate-x-0 animate-in fade-in slide-in-from-top-2 duration-300 origin-top-right z-50">
                <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-2xl shadow-black/10">
                  <CalendarStrip eventDates={allEventDates} onDateSelect={closeCalendar} />
                  <div className="text-center pb-1 pt-3 border-t border-slate-50/50 mt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                      <X className="w-3 h-3" /> Click Date button to close
                    </p>
                  </div>
                </div>
              </div>
            </details>
           </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20 w-full">
          
         {/* DYNAMIC SECTION RENDERING LAYER ACCORDING TO USER FLOW SELECTION */}
          {view === "map" ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-heading font-black text-slate-900 flex items-center gap-2">
                <MapIcon className="w-6 h-6 text-[#6C47FF]" /> Explore by City
              </h2>
              <CityGrid events={liveAllEvents || []} />
            </div>
          ) : (
            <>
            {/* COLLEGE SECTION — shown ALONGSIDE the city section for students, not instead of it */}
            {user && profile?.user_type === 'student' && profile?.college_id && !q && !category && (
            <div className="bg-[#6C47FF] rounded-[40px] p-8 sm:p-12 shadow-xl relative overflow-hidden transition-all duration-300">
              {/* FIX: Made decorative blobs responsive so they don't break mobile layout width */}
              <div className="absolute top-[-50%] left-[-10%] w-64 h-64 md:w-96 md:h-96 bg-white/10 rounded-full blur-2xl md:blur-3xl" />
              <div className="absolute bottom-[-50%] right-[-10%] w-64 h-64 md:w-96 md:h-96 bg-white/10 rounded-full blur-2xl md:blur-3xl" />
              
              <div className="relative z-10 space-y-8">
                <div>
                  <h2 className="text-3xl font-heading font-black text-white flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-amber-400" /> Events happening in your college
                  </h2>
                  <p className="text-[#E5E5EA] font-medium text-sm sm:text-base mt-2">Exclusive updates curated inside your college environment framework safely</p>

                  <div className="mt-4 inline-flex items-center gap-1 bg-white/10 rounded-full p-1">
                    <button
                      type="button"
                      onClick={() => setActiveCollegePill('mine')}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                        activeCollegePill === 'mine' ? 'bg-white text-[#6C47FF] shadow-sm' : 'text-white/80'
                      }`}
                    >
                      In Your College
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCollegePill('other')}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                        activeCollegePill === 'other' ? 'bg-white text-[#6C47FF] shadow-sm' : 'text-white/80'
                      }`}
                    >
                      In Other College
                    </button>
                  </div>
                </div>

                {(activeCollegePill === 'mine' ? liveCollegeEvents : liveOtherCollegeEvents).length > 0 ? (
                  <EventGrid 
                    events={activeCollegePill === 'mine' ? liveCollegeEvents : liveOtherCollegeEvents}
                    gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    defaultMatchLabel={activeCollegePill === 'mine' ? "College Exclusive" : "Open to All Colleges"}
                    defaultImage="/window.svg"
                    user={user}
                  />
                ) : (
                  <div className="py-12 text-center bg-[#5835e5] rounded-3xl border border-[#7a5cff]">
                    <p className="text-white font-bold uppercase tracking-widest text-xs">No active live campaigns running on campus timeline right now</p>
                    <Link href="/events/new" className="mt-4 inline-block bg-white text-[#6C47FF] px-6 py-3 rounded-full font-bold shadow-sm active:scale-95 transition-transform">
                      Host the first one
                    </Link>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* CITY SECTION — always shown */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-heading font-black text-slate-900 flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-[#6C47FF]" /> 
                    {category ? `${category}s` : "Events happening in the city"}
                  </h2>
                  {branch && <p className="text-slate-500 text-sm font-medium">Showing results for branch: {branch}</p>}
                  {location && <p className="text-slate-500 text-sm font-medium">Showing events in: {location}</p>}

                  {showFeedPills && (
                    <div className="mt-3 inline-flex items-center gap-1 bg-slate-100 rounded-full p-1">
                      <button
                        type="button"
                        onClick={() => setActiveFeedPill('for_you')}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                          activeFeedPill === 'for_you' ? 'bg-white text-[#6C47FF] shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        For You
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveFeedPill('around_you')}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                          activeFeedPill === 'around_you' ? 'bg-white text-[#6C47FF] shadow-sm' : 'text-slate-500'
                        }`}
                      >
                        Around You
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* FEATURED EVENTS HORIZONTAL SCROLL (Moved outside fallback) */}
              {liveFeaturedEvents && liveFeaturedEvents.length > 0 && !q && !category && !location && (
                <div className="col-span-full mb-10 mt-6">
                  <div className="flex items-center justify-between mb-6 px-2">
                    <h2 className="text-2xl font-black text-slate-900 font-heading">
                      Featured Events
                    </h2>
                    <Link 
                      href="/events?view=grid" 
                      className="text-sm font-bold text-[#6C47FF] hover:text-[#5835e5] transition-colors flex items-center gap-1"
                    >
                      View All <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  {/* Horizontal Scroll Container - FIX: Hid scrollbars here too */}
                    <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0">                    
                    {/* FIX: Added (event: Partial<EventRow>) type */}
                    {liveFeaturedEvents.map((event: Partial<EventRow>) => (
                      <div key={`featured-${event.id}`} className="min-w-[280px] sm:min-w-[320px] md:min-w-[350px] max-w-[350px] snap-start shrink-0">
                        <EventCard 
                          id={event.id as string}
                          slug={event.slug || (event.id as string)}
                          title={event.title!}
                          category={event.category!}
                          date={event.start_time ? `${event.date_string} · ${event.start_time}` : event.date_string!}
                          city={event.location || event.city!}
                          imageUrl={event.poster_url || ""}
                          organizerName={event.organizer_name!}
                          isFree={event.is_free!}
                          isFeatured={true}
                          matchLabel={getMatchLabel(event, profile)}
                          audience={event.target_audience!}
                          isGuest={!user}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(
                <div className="w-full">
                  {gridSource && gridSource.length > 0 ? (
                    (() => {
                      const sortedEvents = [...gridSource].sort((a, b) => {
                        const dateDiff = (a.date_string || "").localeCompare(b.date_string || "");
                        if (dateDiff !== 0) return dateDiff;
                        // Same date — sort by actual time, not the raw "h:mm AM/PM" string (which sorts wrong)
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
                      return (
                        <EventGrid
                          events={sortedEvents}
                          profile={profile}
                          user={user}
                          useMatchLogic={false}
                          gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                          isPastDateView={!!date && date < new Date().toISOString().substring(0, 10)}
                        />
                      );
                    })()
                  ) : (
                    // --- PREMIUM GSAP-STYLE EMPTY STATE & FALLBACK ---
                    <div className="col-span-full">
                      {(() => {
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
                          <EmptyState 
                            title={title}
                            message={message}
                            variant="default"
                            showButton={!isPastDate}
                            buttonText="Be the first to host one"
                          />
                        );
                      })()}
                    

                      {/* Fallback Events (Virtual/Online) */}
                      {isFallback && liveFallbackEvents.length > 0 && (
                        <div className="mt-16 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="h-px bg-slate-200 flex-1" />
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                              Showing Virtual Events Instead
                            </span>
                            <div className="h-px bg-slate-200 flex-1" />
                          </div>

                          <EventGrid 
                            events={liveFallbackEvents}
                            gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            defaultMatchLabel="Recommended Virtual"
                            user={user}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            </>
          )}
        </div>
        
        </div>
    </main>
  );
}