"use client"
import { useRef, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { EventCard } from "@/app/events/EventCard";
import { OnboardingModal } from "@/components/profile/OnboardingModal";
import Link from "next/link";
import { Sparkles, CalendarDays, Search, Map as MapIcon, SearchX, ArrowRight } from "lucide-react";
import type { ProfileRow, EventRow } from "@/types";
import { getMatchLabel } from "@/lib/events/match";
import type { User } from "@supabase/supabase-js";
import { HeroSection } from "./HeroSection";
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
  platformStats?: { event_count: number; city_count: number; category_count: number; user_count: number };
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
    view,
    platformStats
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
  const [activeFeedPill, setActiveFeedPill] = useState<'for_you' | 'around_you' | 'campus'>('for_you');
  const isCollegeStudent = !!(user && profile?.user_type === 'student' && profile?.college_id);  
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

  // No filters active = passive browsing mode → show pill-based feed. Any filter active → show liveAllEvents directly.
 const noFiltersActive = !q && !category && !location && !date;
  const hasGoals = (profile?.goals?.length ?? 0) > 0;
  const showFeedPills = !!(user && profile?.is_onboarded && (hasGoals || isCollegeStudent) && noFiltersActive);
  const gridSource = !noFiltersActive
    ? liveAllEvents
    : showFeedPills
      ? (activeFeedPill === 'campus' ? liveCollegeEvents : activeFeedPill === 'for_you' ? livePersonalizedEvents : liveAroundYouEvents)
      : liveAroundYouEvents;

  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      <Navbar categoryChips={dynamicChips} locationChips={dynamicLocationChips} />
      
      {/* Onboarding check: user & profile null unna sare modal render avvali */}
      {!profile?.is_onboarded && (
        <OnboardingModal user={user} profile={profile} />
      )}

      <div className="flex flex-col">
        {/* Hide Hero and Stats when in Explore by City (Map) view */}
        {view !== "map" && (
          <>
            {/* Header Section Background & Combined Navigation Pill */}
            <div className="relative">
              <HeroSection stats={platformStats} />
            </div>

            {/* PLATFORM STATS STRIP - moved here from HeroSection per design feedback */}
            <div className="sticky top-[80px] -mt-8 z-40 mx-auto mb-10 w-max">
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

            {/* GUEST-ONLY INTRO — explains what EvenTime is. Hidden once user is signed in, since they already know. */}
            {!user && (
              <p className="text-center text-[#555570] font-medium text-sm md:text-base max-w-[640px] mx-auto px-4 -mt-4 mb-4 leading-relaxed">
                Stop hunting across ten apps. We&apos;ve already found what&apos;s happening — you just have to look here.
              </p>
            )}
          </>
        )}

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

            {/* CITY SECTION — always shown */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-heading font-black text-slate-900 flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-[#6C47FF]" /> 
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
                      {isCollegeStudent && (
                        <button
                          type="button"
                          onClick={() => setActiveFeedPill('campus')}
                          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                            activeFeedPill === 'campus' ? 'bg-white text-[#6C47FF] shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          Your Campus
                        </button>
                      )}
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