import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import Image from "next/image";
import Link from "next/link";
import { Plus, CalendarDays, Settings, Mail, Edit3, Trash2, AlertTriangle, LayoutGrid, Bookmark, Eye, MessageSquare, Lock, Trophy } from "lucide-react";
import { MobileFeedbackWrapper } from "./MobileFeedbackWrapper";
import { format, parseISO } from "date-fns";
import { getCategoryConfig } from "@/lib/category-config";
import { deleteEventAction } from "./action";
import type { ProfileRow } from "@/types";

export const dynamic = "force-dynamic";

type ReportWithEventSlug = {
  id: string;
  reason: string;
  status: string | null;
  created_at: string;
  events: { title: string; slug: string | null } | null;
};

type ProfileEvent = {
  id: string;
  slug: string | null;
  title: string;
  category: string;
  date_string: string | null;
  status: string;
  poster_url: string | null;
  is_featured: boolean;
  interested_events: any;
  saved_events: any;
};

const calculateCompletion = (prof: Partial<ProfileRow> | null) => {
  if (!prof) return 0;
  let score = 0;
  if (prof.avatar_url) score += 20;
  if (prof.username) score += 20;
  if ((prof as any).preferred_cities && (prof as any).preferred_cities.length > 0) score += 20;
  if (prof.goals && prof.goals.length > 0) score += 20;
  const isStudent = (prof as any).user_type === "student";
  if (!isStudent) {
    score += 20;
  } else if (prof.college && (prof as any).graduation_year) {
    score += 20;
  }
  return score;
};

export default async function ProfilePage({ searchParams, }: { searchParams:
Promise<{ tab?: string }>; }) { 
  const { tab } = await searchParams; 
  const activeTab = (tab && tab !== "menu") ? tab : "posted";
  const isMobileMenu = !tab || tab === "menu";
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: myEventsRaw },
    { data: savedEventsData },
    { data: myReportsRaw, error: reportsError },
    { data: appSettings }
  ] = await Promise.all([
    supabase.from("profiles").select("full_name, username, avatar_url, et_score, college, goals, preferred_cities, user_type, graduation_year").eq("id", user.id).maybeSingle(),
    supabase.from("events").select("id, slug, title, category, date_string, status, poster_url, is_featured, saved_events(count), interested_events(count)").eq("creator_id", user.id).order("created_at", { ascending: false }),
    supabase.from("saved_events").select("events(id, slug, title, category, date_string, location, city, poster_url, is_free, organizer_name, is_featured, target_audience)").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("event_reports").select("id, reason, status, created_at, events(title, slug)").eq("curator_id", user.id).eq("status", "pending").order("created_at", { ascending: false }),
    supabase.from("app_settings").select("leaderboard_enabled").eq("id", 1).maybeSingle()
  ]);

  if (!profile) {
    redirect("/profile/settings");
  }

  // FIX: Safely fetch Audience Requests without crashing if the table doesn't exist yet
  const { data: audienceReqsRaw, error: reqError } = await supabase.from("event_category_requests" as any).select("*").eq("curator_id", user.id).order("created_at", { ascending: false }) as any;
  const audienceRequests = reqError ? [] : (audienceReqsRaw || []);

  if (reportsError) {
    console.error("Error fetching reports:", reportsError);
  }

  // Debugging logs to verify if queries return data or empty arrays due to RLS
  console.log("--- Profile Page Data Fetch Debug ---");
  console.log("myEventsRaw:", myEventsRaw);
  console.log("savedEventsData:", savedEventsData);
  console.log("myReportsRaw:", myReportsRaw);
  console.log("-------------------------------------");

  const myReports = myReportsRaw as ReportWithEventSlug[] | null;
  const myEvents = myEventsRaw as ProfileEvent[] | null;

  const etScore = profile?.et_score || 100;
  const leaderboardEnabled = appSettings?.leaderboard_enabled ?? true;
  const profilePic = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || "/window.svg";
  const completionPercentage = calculateCompletion(profile);
  const savedEvents = savedEventsData?.flatMap((item) => item.events ? [item.events] : []) ?? [];

  // NEW: What's missing checklist, mirrors the calculateCompletion formula
  const missingItems: string[] = [];
  if (!profile?.avatar_url) missingItems.push("Profile photo");
  if (!(profile as any)?.username) missingItems.push("Username");
  if (!(profile as any)?.preferred_cities || (profile as any).preferred_cities.length === 0) missingItems.push("Preferred cities");
  if (!profile?.goals || profile.goals.length === 0) missingItems.push("Interest categories");
  if ((profile as any)?.user_type === "student" && (!profile?.college || !(profile as any)?.graduation_year)) missingItems.push("College & graduation year");

  async function handleDelete(formData: FormData) {
    "use server";
    await deleteEventAction(formData);
  }

  const eventCount = myEvents?.length || 0;
  let totalSaves = 0;
  let totalInterested = 0;

  if (myEvents && myEvents.length > 0) {
      myEvents.forEach(ev => {
      // Extract the aggregated counts returned natively by the Supabase join
      const eventSaves = ev.saved_events?.[0]?.count || 0;
      const eventInterested = ev.interested_events?.[0]?.count || 0;
      
      totalSaves += eventSaves;
      totalInterested += eventInterested;
    });
  }
  // This exactly saves the bookmarks done by the user
  totalSaves = savedEvents.length;

  let strokeColor = "#005AE0"; 
  if (eventCount >= 69) {
    strokeColor = "#F59E0B";
  } else if (eventCount >= 30) {
    strokeColor = "#94A3B8";
  } else if (eventCount >= 10) {
    strokeColor = "#B45309";
  }

  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      <Navbar variant="centered" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    {/* Unified Master Box enclosing both Sidebar and Content */}
    <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm flex flex-col lg:flex-row overflow-hidden min-h-[700px]">
      
      {/* LEFT SIDEBAR */}
      <div className={`w-full lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 ${isMobileMenu ? "block" : "hidden lg:block"}`}>
        <div className="flex flex-col h-full">
              
              {/* Profile Info Section */}
              <div className="p-6 flex flex-col items-center text-center">
                <div className="relative w-28 h-28 mb-4 flex items-center justify-center shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="58" fill="none" className="stroke-slate-100" strokeWidth="4" />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="58" 
                      fill="none" 
                      stroke={strokeColor} 
                      strokeWidth="4" 
                      strokeDasharray="364" 
                      strokeDashoffset={364 - (completionPercentage / 100) * 364} 
                      strokeLinecap="round" 
                      className="transition-all duration-1000 ease-out" 
                    />
                  </svg>
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
                    <Image src={profilePic} alt="Profile" fill unoptimized={true} sizes="96px" className="object-cover" />
                  </div>
                </div>

                <h1 className="text-xl font-heading font-bold text-slate-900 tracking-tight leading-tight">
                  {profile?.full_name || user.user_metadata?.full_name || "Curator"}
                </h1>
                
               <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="font-medium text-xs break-all px-2">{user.email}</span>
                </div>

                {missingItems.length > 0 && (
                  <Link href="/profile/settings" className="w-full mt-3 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2 hover:bg-amber-100 transition-colors">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide shrink-0">{completionPercentage}%</span>
                    <span className="text-[11px] font-medium text-amber-600 text-left">Missing: {missingItems.join(" · ")}</span>
                  </Link>
                )}
                {missingItems.length === 0 && <div className="mb-6" />}

                {/* Unified Minimal Stats Panel */}
                <div className={`grid ${leaderboardEnabled ? 'grid-cols-4' : 'grid-cols-3'} w-full border-t border-slate-100 pt-5 text-center divide-x divide-slate-100`}>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-slate-900 leading-none">{eventCount}</span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1.5">Events</span>
                  </div>
                   {leaderboardEnabled && (
                    <div className="flex flex-col items-center">
                      <span className="text-base font-bold text-slate-900 leading-none">{totalSaves}</span>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1.5">Saves</span>
                    </div>
                  )}                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-slate-900 leading-none">{totalInterested}</span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1.5">Clicks</span>
                  </div>
                  {leaderboardEnabled && (
                    <div className="flex flex-col items-center">
                      <span className="text-base font-bold text-[#F59E0B] leading-none">{etScore}</span>
                      <span className="text-[9px] font-semibold text-[#F59E0B] uppercase tracking-wider mt-1.5">Score</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full"></div>

              {/* Vertical Menu Navigation */}
              <div className="flex flex-col p-3 gap-1">
                <Link href="?tab=posted" className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeTab === "posted" ? "bg-[#EDE8FF] text-[#6C47FF]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
                  <LayoutGrid className="w-4 h-4" /> My Events
                </Link>
                
                <Link href="?tab=saved" className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeTab === "saved" ? "bg-[#EDE8FF] text-[#6C47FF]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
                  <div className="flex items-center gap-3">
                    <Bookmark className="w-4 h-4" /> Saved Events
                  </div>
                  {savedEvents.length > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === "saved" ? "bg-[#6C47FF]/10 text-[#6C47FF]" : "bg-slate-100 text-slate-500"}`}>
                      {savedEvents.length}
                    </span>
                  )}
                </Link>
                
                <Link href="?tab=alerts" className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeTab === "alerts" ? "bg-red-50 text-red-600" : "text-slate-500 hover:bg-red-50 hover:text-red-600"}`}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4" /> Alerts
                  </div>
                  {myReports && myReports.length > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === "alerts" ? "bg-red-100 text-red-600" : "bg-red-100 text-red-600"}`}>
                      {myReports.length}
                    </span>
                  )}
                </Link>
                
                <div className="h-px bg-slate-100 my-2 mx-2"></div>
                
                <Link 
                  href={eventCount >= 15 ? "?tab=requests" : "#"} 
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeTab === "requests" ? "bg-[#EDE8FF] text-[#6C47FF]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"} ${eventCount < 15 ? "pointer-events-none opacity-50 bg-slate-50/50" : ""}`}
                  title={eventCount < 15 ? "Unlock at 15 events" : "Audience Requests"}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4" /> Audience Requests
                  </div>
                  {eventCount < 15 && (
                    <div className="flex items-center gap-1 bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-500 scale-90">
                      <Lock className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">15 Events</span>
                    </div>
                  )}
                </Link>

                {leaderboardEnabled && (
                  <Link href="/leaderboard" className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
                    <Trophy className="w-4 h-4" /> Leaderboard
                  </Link>
                )}

                <Link href="/profile/settings" className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all">
                  <Settings className="w-4 h-4" /> Profile Settings
                </Link>
                
                {/* Mobile Only Feedback Button */}
                <MobileFeedbackWrapper />
              </div>

              <div className="p-4 pt-1 mb-2 mt-auto">
                <Link href="/events/new" className="w-full bg-[#6C47FF] hover:bg-[#5535E0] text-white px-5 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm">
                  <Plus className="w-4 h-4" /> Create New Event
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT AREA */}
      <div className={`flex-1 p-6 sm:p-8 lg:p-10 flex-col ${isMobileMenu ? "hidden lg:flex" : "flex"}`}>
        
        {/* Mobile Back Button */}
        <Link href="?tab=menu" className="lg:hidden flex items-center gap-2 text-slate-500 hover:text-[#6C47FF] font-bold text-sm mb-6 transition-colors w-fit">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Profile
        </Link>

        {/* Content Tab Header */}
            <div className="mb-8">
              <h2 className="text-xl font-heading font-bold text-slate-900 tracking-tight">
                {activeTab === 'posted' && "My Posted Events"}
                {activeTab === 'saved' && "Saved Events"}
                {activeTab === 'alerts' && "Action Required"}
                {activeTab === 'requests' && "Audience Requests"}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {activeTab === 'posted' && "Manage and track the events you've created."}
                {activeTab === 'saved' && "Events you've bookmarked for later."}
                {activeTab === 'alerts' && "Events reported by users that need your attention."}
                {activeTab === 'requests' && "See what kind of events your audience wants next."}
              </p>
            </div>

            {/* Structured Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {/* POSTED EVENTS GRID */}
              {activeTab === "posted" && (
                myEvents && myEvents.length > 0 ? (
                  myEvents.map((event) => (
                    <div key={event.id} className="group bg-white rounded-2xl border border-slate-200/60 p-2 flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-50">
                        <Image src={event.poster_url || getCategoryConfig(event.category).backgroundImage} alt={event.title} fill unoptimized={true} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover group-hover:scale-102 transition-transform duration-500" />
                        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
                          {event.status === 'pending' && <span className="bg-amber-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-md shadow-sm">Pending Review</span>}
                          {event.status === 'rejected' && <span className="bg-red-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-md shadow-sm">Rejected</span>}
                        </div>
                      </div>
                      
                      <div className="px-2 pt-3.5 pb-1 flex flex-col grow">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight mb-2 line-clamp-2 h-9">{event.title}</h3>
                        
                        <div className="flex items-center justify-between mt-auto mb-3.5">
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>{event.date_string ? format(parseISO(event.date_string), "MMM d, yyyy") : "TBA"}</span>
                          </div>
                          
                          {leaderboardEnabled && (
                            <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-100">
                              <Bookmark className="w-2.5 h-2.5" />
                              <span>{event.saved_events?.[0]?.count || 0} Saves</span>
                            </div>
                          )}                        </div>

                        {/* Management Icon Controls */}
                        <div className="mt-auto flex gap-1.5 border-t border-slate-100 pt-3">
                          <Link href={`/events/${event.slug}`} title="View Event" className="flex-1 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 py-2 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link href={`/events/${event.slug}/edit`} title="Edit Event" className="flex-1 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 py-2 rounded-lg transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <form action={handleDelete} className="flex-1">
                            <input type="hidden" name="eventId" value={event.id} />
                            <button type="submit" title="Delete Event" className="w-full flex items-center justify-center text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 py-2 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                    <div className="relative w-full max-w-[280px] sm:max-w-[420px] aspect-video mb-8">
                      <Image src="/empty-profile.webp" alt="Empty Profile" fill className="object-contain" priority />
                    </div>
                    <h3 className="text-slate-900 font-bold text-xl">Ready to Make an Impact?</h3>
                    <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed max-w-[380px] mx-auto mb-8">You haven't posted any events yet. Share your first event with the community!</p>
                    <Link href="/events/new" className="inline-flex items-center gap-2 bg-[#6C47FF] hover:bg-[#5535E0] text-white px-7 py-3.5 rounded-full text-sm font-bold transition-all shadow-md active:scale-95">
                      <Plus className="w-4 h-4" /> Create Your First Event
                    </Link>
                  </div>
                )
              )}

              {/* SAVED EVENTS GRID */}
              {activeTab === "saved" && (
                savedEvents.length > 0 ? (
                  savedEvents.map((event) => (
                    <div key={event.id} className="group bg-white rounded-2xl border border-slate-200/60 p-2 flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300">
                      <Link href={`/events/${event.slug}`} className="flex flex-col h-full">
                        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-50">
                          <Image src={event.poster_url || getCategoryConfig(event.category).backgroundImage} alt={event.title} fill className="object-cover group-hover:scale-102 transition-transform duration-500" />
                        </div>
                        <div className="px-2 pt-3.5 pb-1 flex flex-col grow">
                          <h3 className="text-sm font-bold text-slate-900 leading-tight mb-2 line-clamp-2 h-9">{event.title}</h3>
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mt-auto mb-3">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>{event.date_string ? format(parseISO(event.date_string), "MMM d, yyyy") : "TBA"}</span>
                          </div>
                          
                          <div className="mt-auto border-t border-slate-100 pt-3">
                            <div className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 group-hover:bg-slate-900 group-hover:text-white py-2.5 rounded-lg transition-all">
                              <Eye className="w-3.5 h-3.5" /> View Details
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                    <div className="relative w-full max-w-[280px] sm:max-w-[420px] aspect-video mb-8">
                      <Image src="/empty-saved.webp" alt="No Saved Events" fill className="object-contain" priority />
                    </div>
                    <h3 className="text-slate-900 font-bold text-xl">No Bookmarks Found</h3>
                    <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed max-w-[380px] mx-auto">Events you save while exploring will be safely organized here.</p>
                  </div>
                )
              )}

              {/* ALERTS SECTION */}
              {activeTab === "alerts" && (
                myReports && myReports.length > 0 ? (
                  myReports.map((report) => {
                    const eventData = report.events;
                    return (
                      <div key={report.id} className="col-span-full bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                        <div className="flex gap-3.5 items-start">
                          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-red-100|0">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          </div>
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-bold uppercase tracking-wider rounded border border-red-100 mb-1.5">
                              Action Required: {report.reason}
                            </span>
                            <h4 className="font-bold text-slate-900 text-base">{eventData?.title || "Unknown Event"}</h4>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">A community member reported an accuracy problem. Please review updates immediately.</p>
                          </div>
                        </div>
                        {eventData?.slug && (
                          <Link href={`/events/${eventData.slug}/edit`} className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap active:scale-98 shadow-sm">
                            Fix Issue
                          </Link>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                    <div className="relative w-full max-w-[280px] sm:max-w-[420px] aspect-video mb-8">
                      <Image src="/empty-alerts.webp" alt="No Alerts" fill className="object-contain" priority />
                    </div>
                    <h3 className="text-slate-900 font-bold text-xl">No Active Alerts</h3>
                    <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed max-w-[380px] mx-auto">Your curated events look stellar and community approved!</p>
                  </div>
                )
              )}

              {/* AUDIENCE REQUESTS */}
              {activeTab === "requests" && eventCount >= 15 && (
                audienceRequests && audienceRequests.length > 0 ? (
                  audienceRequests.map((req: any) => (
                    <div key={req.id} className="col-span-full bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-[#6C47FF]/10 text-[#6C47FF] text-[9px] font-bold uppercase tracking-wider rounded border border-[#6C47FF]/20 mb-1.5">
                          Requested Category: {req.category || "General"}
                        </span>
                        <p className="font-bold text-slate-900 text-base">{req.message || "A user requested more events in this category."}</p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">Received on {new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                    <div className="relative w-full max-w-[280px] sm:max-w-[420px] aspect-video mb-8">
                      <Image src="/empty-category.webp" alt="No Requests" fill className="object-contain" priority />
                    </div>
                    <h3 className="text-slate-900 font-bold text-xl">No Requests Yet</h3>
                    <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed max-w-[380px] mx-auto">When your audience requests specific configurations, they will line up here.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}