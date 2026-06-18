"use client"
import { useRef, useEffect } from "react";
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
  collegeEvents: Partial<EventRow>[];
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
  } = props;

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
        <div className="sticky top-[80px] -mt-8 z-40 mx-auto bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-200 px-4 py-2 flex items-center gap-4 w-max max-w-[90vw] mb-10">
            
            {/* INSTANT DISCOVERY CHIPS */}
            <div className="flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
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
            <div className="h-6 w-px bg-slate-300 shrink-0" />

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
          
          {/* FOR YOU: Personalized Recommendations */}
          {user && profile?.is_onboarded && !q && !category && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-heading font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-amber-500" /> For You
                  </h2>
                  <p className="text-slate-500 font-medium text-sm">Tailored to your branch and career goals</p>
                </div>
              </div>
              
              {personalizedEvents.length > 0 ? (
                <EventGrid 
                  events={personalizedEvents} 
                  gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                  isFeatured={true}
                  user={user}
                />
              ) : (
                <EmptyState 
                  title="No exact matches"
                  message="We couldn't find personalized events matching your profile right now. But the stage is never empty."
                  variant="foryou"
                  icon={<Sparkles className="w-8 h-8 text-amber-400" />}
                />
              )}
            </div>
          )}

          {/* PREMIUM HYPER-LOCAL TAB LAYER SEPARATION CONTROL - STRICTLY STUDENTS ONLY */}
          {user && profile?.role === 'student' && profile?.college_id && !q && !category && (
            <div className="flex overflow-x-auto justify-start md:justify-start gap-3 sm:gap-4 border-b border-slate-200/60 pb-4 mb-2 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <Link
                href={{ pathname: "/", query: { ...(branch && { branch }), ...(location && { location }), ...(view && { view }), tab: "around_you" } }}
                className={`shrink-0 whitespace-nowrap px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-all border ${
                  activeTab === "around_you"
                    ? "bg-[#1D1D1F] text-white border-[#1D1D1F] shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Happening Around You
              </Link>
              <Link
                href={{ pathname: "/", query: { ...(branch && { branch }), ...(location && { location }), ...(view && { view }), tab: "in_college" } }}
                className={`shrink-0 whitespace-nowrap px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-all border ${
                  activeTab === "in_college"
                    ? "bg-[#6C47FF] text-white border-[#6C47FF] shadow-md shadow-[#6C47FF]/20"
                    : "bg-white text-[#6C47FF] border-slate-200 hover:bg-[#6C47FF]/5"
                }`}
              >
                🏥 Happening in College
              </Link>
            </div>
          )}

          {/* DYNAMIC SECTION RENDERING LAYER ACCORDING TO USER FLOW SELECTION */}
          {activeTab === "in_college" && user && profile?.role === 'student' && profile?.college_id && !q && !category ? (
            <div className="bg-[#6C47FF] rounded-[40px] p-8 sm:p-12 shadow-xl relative overflow-hidden transition-all duration-300">
              {/* FIX: Made decorative blobs responsive so they don't break mobile layout width */}
              <div className="absolute top-[-50%] left-[-10%] w-64 h-64 md:w-96 md:h-96 bg-white/10 rounded-full blur-2xl md:blur-3xl" />
              <div className="absolute bottom-[-50%] right-[-10%] w-64 h-64 md:w-96 md:h-96 bg-white/10 rounded-full blur-2xl md:blur-3xl" />
              
              <div className="relative z-10 space-y-8">
                <div>
                  <h2 className="text-3xl font-heading font-black text-white flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-amber-400" /> My Campus Directory
                  </h2>
                  <p className="text-[#E5E5EA] font-medium text-sm sm:text-base mt-2">Exclusive updates curated inside your college environment framework safely</p>
                </div>

                {collegeEvents.length > 0 ? (
                  <EventGrid 
                    events={collegeEvents} 
                    gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    defaultMatchLabel="College Exclusive"
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
          ) : (activeTab === "around_you" || q || category || location) ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-heading font-black text-slate-900 flex items-center gap-2">
                    <CalendarDays className="w-6 h-6 text-[#6C47FF]" /> 
                    {category 
                      ? `${category}s` 
                      : !user 
                        ? "Events Happening" 
                        : profile?.is_onboarded 
                          ? "Happening Around You" 
                          : "Events Near You"}
                  </h2>
                  {branch && <p className="text-slate-500 text-sm font-medium">Showing results for branch: {branch}</p>}
                  {location && <p className="text-slate-500 text-sm font-medium">Showing events in: {location}</p>}
                  
                  {/* NEW: City Fallback Label */}
                  {profile?.city && !hasCityEvents && !q && !category && !branch && !location && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <MapIcon className="w-3.5 h-3.5 text-amber-500" />
                      <p className="text-xs font-medium text-amber-700">
                        No events in <span className="font-bold">{profile.city}</span> right now — showing all events.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* FEATURED EVENTS HORIZONTAL SCROLL (Moved outside fallback) */}
              {featuredEvents && featuredEvents.length > 0 && !q && !category && !location && (
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
                    {featuredEvents.map((event: Partial<EventRow>) => (
                      <div key={`featured-${event.id}`} className="min-w-[280px] sm:min-w-[320px] md:min-w-[350px] max-w-[350px] snap-start shrink-0">
                        <EventCard 
                          id={event.id as string}
                          slug={event.slug || (event.id as string)}
                          title={event.title!}
                          category={event.category!}
                          date={event.start_time ? `${event.date_string} · ${event.start_time}` : event.date_string!}
                          city={event.location || event.city!}
                          imageUrl={event.poster_url || "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop"}
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
                  {allEvents && allEvents.length > 0 ? (
                    (() => {
                      // Split only when no filters/date selected
                      const shouldSplit = !date && !q && !category && !location && !branch;
                      if (!shouldSplit) {
                        return (
                          <EventGrid
                            events={allEvents}
                            profile={profile}
                            user={user}
                            useMatchLogic={true}
                            gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            isPastDateView={!!date && date < new Date().toISOString().substring(0, 10)}
                          />
                        );
                      }
                      const todayMidnight = new Date(); todayMidnight.setHours(0,0,0,0);
                      const threeDaysLater = new Date(todayMidnight); threeDaysLater.setDate(threeDaysLater.getDate() + 3);
                      const threeDayStr = `${threeDaysLater.getFullYear()}-${String(threeDaysLater.getMonth()+1).padStart(2,'0')}-${String(threeDaysLater.getDate()).padStart(2,'0')}`;
                      const next3 = (allEvents as Partial<EventRow>[]).filter(e => e.date_string && e.date_string <= threeDayStr);
                      const upcoming = (allEvents as Partial<EventRow>[]).filter(e => e.date_string && e.date_string > threeDayStr);
                      // If one bucket is empty, show single list
                      if (next3.length === 0 || upcoming.length === 0) {
                        return (
                          <EventGrid
                            events={allEvents}
                            profile={profile}
                            user={user}
                            useMatchLogic={true}
                            gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                          />
                        );
                      }
                      return (
                        <div className="space-y-14">
                          <div className="space-y-6">
                            <h3 className="text-xl font-heading font-black text-slate-900 flex items-center gap-2">
                              ⚡ Next 3 Days
                            </h3>
                            <EventGrid
                              events={next3}
                              profile={profile}
                              user={user}
                              useMatchLogic={true}
                              gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            />
                          </div>
                          <div className="space-y-6">
                            <h3 className="text-xl font-heading font-black text-slate-900 flex items-center gap-2">
                              🗓️ Upcoming
                            </h3>
                            <EventGrid
                              events={upcoming}
                              profile={profile}
                              user={user}
                              useMatchLogic={true}
                              gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            />
                          </div>
                        </div>
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
                      {isFallback && fallbackEvents.length > 0 && (
                        <div className="mt-16 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="h-px bg-slate-200 flex-1" />
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                              Showing Virtual Events Instead
                            </span>
                            <div className="h-px bg-slate-200 flex-1" />
                          </div>

                          <EventGrid 
                            events={fallbackEvents} 
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
          ) : null}
        </div>
        
        </div>
    </main>
  );
}