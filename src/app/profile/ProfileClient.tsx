"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  CalendarDays,
  Settings,
  Mail,
  Edit3,
  AlertTriangle,
  LayoutGrid,
  Bookmark,
  Eye,
  Trophy,
  BarChart2,
  GraduationCap,
  Info,
  Shield,
  ChevronRight,
  Check,
  CheckCircle2,
  Users,
} from "lucide-react";
import { MobileFeedbackWrapper } from "./MobileFeedbackWrapper";
import { DeleteEventForm } from "@/components/profile/DeleteEventForm";
import { format, parseISO } from "date-fns";
import { getCategoryConfig } from "@/lib/category-config";
import { deleteEventAction } from "./action";
import type { ProfileRow } from "@/types";
import { MobileSignOutButton } from "@/components/profile/MobileSignOutButton";

export type ReportWithEventSlug = {
  id: string;
  reason: string;
  status: string | null;
  created_at: string;
  events: { title: string; slug: string | null } | null;
};

export type ProfileEvent = {
  id: string;
  slug: string | null;
  title: string;
  category: string;
  date_string: string | null;
  status: string;
  poster_url: string | null;
  is_featured: boolean;
  interested_events: { count: number }[];
  saved_events: { count: number }[];
  registered_events?: { count: number }[];
};

export interface ProfileClientProps {
  initialUser: any;
  initialProfile: Partial<ProfileRow>;
  initialMyEvents: ProfileEvent[];
  initialSavedEvents: any[];
  initialRegisteredEvents?: any[];
  initialMyReports: ReportWithEventSlug[];
  initialAppSettings: any;
}

const calculateCompletion = (prof: Partial<ProfileRow> | null) => {
  if (!prof) return 0;
  let score = 0;
  if (prof.username) score += 25;
  if (prof.preferred_cities && prof.preferred_cities.length > 0) score += 25;
  if (prof.goals && prof.goals.length > 0) score += 25;
  const isStudent = prof.user_type === "student";
  if (!isStudent) {
    score += 25;
  } else if (prof.graduation_year) {
    score += 25;
  }
  return score;
};

export default function ProfileClient({
  initialUser,
  initialProfile,
  initialMyEvents,
  initialSavedEvents,
  initialRegisteredEvents = [],
  initialMyReports,
  initialAppSettings,
}: ProfileClientProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const activeTab = tab && tab !== "menu" ? tab : "posted";
  const isMobileMenu = !tab || tab === "menu";

  // Pre-hydrated with server data for 0ms initial load
  const [user] = useState<any>(initialUser);
  const [profile] = useState<Partial<ProfileRow>>(initialProfile);
  const [myEvents, setMyEvents] = useState<ProfileEvent[]>(initialMyEvents);
  const [savedEvents] = useState<any[]>(initialSavedEvents);
  const [registeredEvents] = useState<any[]>(initialRegisteredEvents);
  const [myReports] = useState<ReportWithEventSlug[]>(initialMyReports);
  const [appSettings] = useState<any>(initialAppSettings);
  const [postedVisibleCount, setPostedVisibleCount] = useState(8);
  const [savedVisibleCount, setSavedVisibleCount] = useState(8);
  const [registeredVisibleCount, setRegisteredVisibleCount] = useState(8);

  // Sync saved event IDs with localStorage for fast global client-side lookup
  useEffect(() => {
    try {
      const savedIds = (savedEvents || []).map((ev: any) => ev.id).filter(Boolean);
      localStorage.setItem("eventime_saved_ids", JSON.stringify(savedIds));
    } catch {}
  }, [savedEvents]);

  // Sync registered event IDs with localStorage for fast global client-side lookup
  useEffect(() => {
    try {
      const regIds = (registeredEvents || []).map((ev: any) => ev.id).filter(Boolean);
      localStorage.setItem("eventime_registered_ids", JSON.stringify(regIds));
    } catch {}
  }, [registeredEvents]);

  const handleDelete = async (formData: FormData) => {
    const eventId = formData.get("eventId") as string;
    // Optimistic Update: instantly remove from UI
    setMyEvents((prev) => (prev ? prev.filter((e) => e.id !== eventId) : []));
    await deleteEventAction(formData);
  };

  const etScore = profile?.et_score || 100;
  const leaderboardEnabled = appSettings?.leaderboard_enabled ?? true;
  const profilePic =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    "/window.svg";
  const completionPercentage = calculateCompletion(profile);

  const missingItems: string[] = [];
  if (!profile?.avatar_url) missingItems.push("Profile photo");
  if (!profile?.username) missingItems.push("Username");
  if (!profile?.preferred_cities || profile.preferred_cities.length === 0)
    missingItems.push("Preferred cities");
  if (!profile?.goals || profile.goals.length === 0) missingItems.push("Interest categories");
  if (profile?.user_type === "student" && (!profile?.college || !profile?.graduation_year))
    missingItems.push("College & graduation year");

  const eventCount = myEvents?.length || 0;
  let totalSaves = 0;
  let totalInterested = 0;
  let totalRegistered = 0;

  if (myEvents && myEvents.length > 0) {
    myEvents.forEach((ev) => {
      const eventSaves = ev.saved_events?.[0]?.count || 0;
      const eventInterested = ev.interested_events?.[0]?.count || 0;
      const eventReg = (ev as any).registered_events?.[0]?.count || 0;
      totalSaves += eventSaves;
      totalInterested += eventInterested;
      totalRegistered += eventReg;
    });
  }

  const getTierInfo = () => {
    if (eventCount >= 69) {
      return { label: "Gold Curator", color: "#F59E0B", bg: "#FEF3C7" };
    }
    if (eventCount >= 30) {
      return { label: "Silver Curator", color: "#64748B", bg: "#F1F5F9" };
    }
    return { label: "Curator", color: "#6C47FF", bg: "#EDE8FF" };
  };
  const tier = getTierInfo();

  let strokeColor = "#005AE0";
  if (eventCount >= 69) {
    strokeColor = "#F59E0B";
  } else if (eventCount >= 30) {
    strokeColor = "#94A3B8";
  } else if (eventCount >= 10) {
    strokeColor = "#B45309";
  }

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Unified Master Box enclosing both Sidebar and Content */}
        <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm flex flex-col lg:flex-row overflow-hidden min-h-[700px]">
          {/* LEFT SIDEBAR */}
          <div
            className={`w-full lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto ${
              isMobileMenu ? "block" : "hidden lg:block"
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Profile Info Section */}
              <div className="p-6 flex flex-col items-center text-center">
                <div className="relative w-28 h-28 mb-4 flex items-center justify-center shrink-0">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      fill="none"
                      className="stroke-slate-100"
                      strokeWidth="4"
                    />
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
                    <Image
                      src={profilePic}
                      alt="Profile"
                      fill
                      unoptimized={true}
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                </div>

                <h1 className="text-xl font-heading font-bold text-slate-900 tracking-tight leading-tight">
                  {profile?.full_name || user?.user_metadata?.full_name || "Curator"}
                </h1>

                {profile?.username && (
                  <p className="text-xs font-bold text-slate-400 mt-0.5">@{profile.username}</p>
                )}

                {/* Tier Pill matching mobile app */}
                <div
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mt-2"
                  style={{ backgroundColor: tier.bg, color: tier.color }}
                >
                  <span>{tier.label}</span>
                  <span>•</span>
                  <span>{etScore} ET</span>
                </div>

                {/* Academic metadata matching mobile app */}
                {profile?.user_type === "student" && profile?.college && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium mt-2.5 max-w-full px-2">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {profile.college} {profile.branch ? `• ${profile.branch}` : ""}{" "}
                      {profile.graduation_year ? `('${String(profile.graduation_year).slice(-2)})` : ""}
                    </span>
                  </div>
                )}

                {/* Goals & Interests Chips matching mobile app */}
                {profile?.goals && profile.goals.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 px-2">
                    {profile.goals.slice(0, 3).map((g: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md"
                      >
                        {g}
                      </span>
                    ))}
                    {profile.goals.length > 3 && (
                      <span className="text-slate-400 text-[10px] font-bold">
                        +{profile.goals.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-slate-400 mt-2.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="font-medium text-xs break-all px-1">
                    {user?.email || profile?.username || "Curator"}
                  </span>
                </div>

                {missingItems.length > 0 && (
                  <Link
                    href="/profile/settings"
                    className="w-full mt-3 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2 hover:bg-amber-100 transition-colors"
                  >
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide shrink-0">
                      {completionPercentage}%
                    </span>
                    <span className="text-[11px] font-medium text-amber-600 text-left">
                      Missing: {missingItems.join(" · ")}
                    </span>
                  </Link>
                )}
                {missingItems.length === 0 && <div className="mb-6" />}

                {/* Unified Minimal Stats Panel */}
                <div
                  className={`grid ${
                    leaderboardEnabled ? "grid-cols-4" : "grid-cols-3"
                  } w-full border-t border-slate-100 pt-5 text-center divide-x divide-slate-100`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-slate-900 leading-none">{eventCount}</span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1.5">
                      Events
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-slate-900 leading-none">
                      {totalInterested}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1.5">
                      Interested
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-emerald-700 leading-none">
                      {totalRegistered}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider mt-1.5">
                      Registered
                    </span>
                  </div>
                  {leaderboardEnabled && (
                    <div className="flex flex-col items-center">
                      <span className="text-base font-bold text-brand-accent leading-none">{etScore}</span>
                      <span className="text-[9px] font-semibold text-brand-accent uppercase tracking-wider mt-1.5">
                        Score
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full"></div>

              {/* Vertical Menu Navigation */}
              <div className="flex flex-col p-3 gap-1">
                <Link
                  href="?tab=posted"
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === "posted"
                      ? "bg-[#EDE8FF] text-brand-primary"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" /> My Events
                </Link>

                <Link
                  href="?tab=registered"
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === "registered"
                      ? "bg-[#EDE8FF] text-brand-primary"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4" /> My Registrations
                  </div>
                  {registeredEvents.length > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        activeTab === "registered"
                          ? "bg-brand-primary/10 text-brand-primary"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {registeredEvents.length}
                    </span>
                  )}
                </Link>

                <Link
                  href="?tab=saved"
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === "saved"
                      ? "bg-[#EDE8FF] text-brand-primary"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bookmark className="w-4 h-4" /> Saved Events
                  </div>
                  {savedEvents.length > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        activeTab === "saved"
                          ? "bg-brand-primary/10 text-brand-primary"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {savedEvents.length}
                    </span>
                  )}
                </Link>

                <Link
                  href="?tab=alerts"
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${
                    activeTab === "alerts"
                      ? "bg-red-50 text-red-600"
                      : "text-slate-500 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4" /> Alerts
                  </div>
                  {myReports && myReports.length > 0 && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        activeTab === "alerts" ? "bg-red-100 text-red-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {myReports.length}
                    </span>
                  )}
                </Link>

                {leaderboardEnabled && (
                  <Link
                    href="/leaderboard"
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
                  >
                    <Trophy className="w-4 h-4" /> Leaderboard
                  </Link>
                )}

                <Link
                  href="/about"
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
                >
                  <Info className="w-4 h-4" /> About EvenTime
                </Link>

                <Link
                  href="/stats"
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
                >
                  <BarChart2 className="w-4 h-4" /> Live Platform Stats
                </Link>

                <Link
                  href="/profile/settings"
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
                >
                  <Settings className="w-4 h-4" /> Profile Settings
                </Link>

                {/* Administration Console (Role Gated) */}
                {(profile?.role === "admin" || profile?.user_type === "admin") && (
                  <Link
                    href="/et98"
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl font-bold text-sm bg-red-50/80 text-red-600 hover:bg-red-100 transition-all border border-red-100/80 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-900 leading-tight">Admin Console</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          Approvals, Reports & Settings
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}

                {/* Mobile Only Feedback Button */}
                <MobileFeedbackWrapper />
                <MobileSignOutButton />
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT AREA */}
          <div
            className={`flex-1 p-6 sm:p-8 lg:p-10 flex-col ${
              isMobileMenu ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Mobile Back Button */}
            <Link
              href="?tab=menu"
              className="lg:hidden flex items-center gap-2 text-slate-500 hover:text-brand-primary font-bold text-sm mb-6 transition-colors w-fit"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Profile
            </Link>

            {/* Content Tab Header */}
            <div className="mb-8">
              <h2 className="text-xl font-heading font-bold text-slate-900 tracking-tight">
                {activeTab === "posted" && "My Posted Events"}
                {activeTab === "registered" && "My Registrations"}
                {activeTab === "saved" && "Saved Events"}
                {activeTab === "alerts" && "Action Required"}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {activeTab === "posted" && "Manage and track the events you've created."}
                {activeTab === "registered" && "Events you've applied for and confirmed."}
                {activeTab === "saved" && "Events you've bookmarked for later."}
                {activeTab === "alerts" && "Events reported by users that need your attention."}
              </p>
            </div>

            {/* Structured Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* POSTED EVENTS GRID */}
              {activeTab === "posted" &&
                myEvents &&
                myEvents.length > 0 &&
                myEvents.slice(0, postedVisibleCount).map((event) => (
                  <div
                    key={event.id}
                    className="group bg-white rounded-2xl border border-slate-200/60 p-2 flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-50">
                      <Image
                        src={event.poster_url || getCategoryConfig(event.category).backgroundImage}
                        alt={event.title}
                        fill
                        unoptimized={true}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
                        {event.status === "pending" && (
                          <span className="bg-amber-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                            Pending Review
                          </span>
                        )}
                        {event.status === "rejected" && (
                          <span className="bg-red-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="px-2 pt-3.5 pb-1 flex flex-col grow">
                      <h3 className="text-sm font-bold text-slate-900 leading-tight mb-2 line-clamp-2 h-9">
                        {event.title}
                      </h3>

                      <div className="flex items-center justify-between mt-auto mb-3.5 flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>
                            {event.date_string
                              ? format(parseISO(event.date_string), "MMM d, yyyy")
                              : "TBA"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div
                            title="Self-reported registrations"
                            className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-200/80"
                          >
                            <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[2.5]" />
                            <span>{(event as any).registered_events?.[0]?.count || 0} Reg</span>
                          </div>
                          <div
                            title="People interested"
                            className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200/60"
                          >
                            <Users className="w-2.5 h-2.5 text-slate-400" />
                            <span>{event.interested_events?.[0]?.count || 0}</span>
                          </div>
                          {leaderboardEnabled && (
                            <div
                              title="People who bookmarked this event"
                              className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200/60"
                            >
                              <Bookmark className="w-2.5 h-2.5 text-slate-400" />
                              <span>{event.saved_events?.[0]?.count || 0}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto flex gap-1.5 border-t border-slate-100 pt-3">
                        <Link
                          href={`/events/${event.slug}`}
                          title="View Event"
                          className="flex-1 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 py-2 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/events/${event.slug}/edit`}
                          title="Edit Event"
                          className="flex-1 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 py-2 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <DeleteEventForm eventId={event.id} deleteAction={handleDelete} />
                      </div>
                    </div>
                  </div>
                ))}

              {activeTab === "posted" && myEvents && myEvents.length > postedVisibleCount && (
                <div className="col-span-full flex justify-center pt-4">
                  <button
                    onClick={() => setPostedVisibleCount((c) => c + 8)}
                    className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all text-sm"
                  >
                    Load More
                  </button>
                </div>
              )}

              {activeTab === "posted" && (!myEvents || myEvents.length === 0) && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                  <div className="relative w-full max-w-[280px] sm:max-w-[420px] aspect-video mb-8">
                    <Image
                      src="/empty-profile.webp"
                      alt="Empty Profile"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <h3 className="text-slate-900 font-bold text-xl">Ready to Make an Impact?</h3>
                  <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed max-w-[380px] mx-auto mb-8">
                    You haven't posted any events yet. Share your first event with the community!
                  </p>
                  <Link
                    href="/events/new"
                    className="inline-flex items-center gap-2 bg-brand-primary hover:bg-[#5535E0] text-white px-7 py-3.5 rounded-full text-sm font-bold transition-all shadow-md active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> Create Your First Event
                  </Link>
                </div>
              )}

              {/* SAVED EVENTS GRID */}
              {activeTab === "saved" &&
                savedEvents.length > 0 &&
                savedEvents.slice(0, savedVisibleCount).map((event) => (
                  <div
                    key={event.id}
                    className="group bg-white rounded-2xl border border-slate-200/60 p-2 flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <Link href={`/events/${event.slug}`} className="flex flex-col h-full">
                      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-50">
                        <Image
                          src={
                            event.poster_url ||
                            getCategoryConfig(event.category).backgroundImage
                          }
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                      </div>
                      <div className="px-2 pt-3.5 pb-1 flex flex-col grow">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight mb-2 line-clamp-2 h-9">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mt-auto mb-3">
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>
                            {event.date_string
                              ? format(parseISO(event.date_string), "MMM d, yyyy")
                              : "TBA"}
                          </span>
                        </div>

                        <div className="mt-auto border-t border-slate-100 pt-3">
                          <div className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 group-hover:bg-slate-900 group-hover:text-white py-2.5 rounded-lg transition-all">
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}

              {activeTab === "saved" && savedEvents.length > savedVisibleCount && (
                <div className="col-span-full flex justify-center pt-4">
                  <button
                    onClick={() => setSavedVisibleCount((c) => c + 8)}
                    className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all text-sm"
                  >
                    Load More
                  </button>
                </div>
              )}

              {activeTab === "saved" && savedEvents.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                  <div className="relative w-full max-w-[280px] sm:max-w-[420px] aspect-video mb-6">
                    <Image
                      src="/Empty_saved.webp"
                      alt="No Saved Events"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <h3 className="text-slate-900 font-bold text-xl">No Saved Events</h3>
                  <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed max-w-[380px] mx-auto">
                    Bookmark events you're interested in attending to keep track of deadlines and
                    updates.
                  </p>
                  <Link
                    href="/"
                    className="mt-6 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-[#5835e5] transition-all text-sm shadow-sm active:scale-95"
                  >
                    Explore Events
                  </Link>
                </div>
              )}

              {/* REGISTERED EVENTS GRID */}
              {activeTab === "registered" &&
                registeredEvents.length > 0 &&
                registeredEvents.slice(0, registeredVisibleCount).map((event) => (
                  <div
                    key={event.id}
                    className="group bg-white rounded-2xl border border-slate-200/60 p-2 flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <Link href={`/events/${event.slug || event.id}`} className="flex flex-col h-full">
                      <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-50">
                        <Image
                          src={
                            event.poster_url ||
                            getCategoryConfig(event.category)?.backgroundImage ||
                            "/card-backgrounds/default-event.webp"
                          }
                          alt={event.title}
                          fill
                          unoptimized={true}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                        <div className="absolute top-2.5 right-2.5">
                          <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                            <Check className="w-2.5 h-2.5 stroke-[2.5]" /> Registered
                          </span>
                        </div>
                      </div>
                      <div className="px-2 pt-3.5 pb-1 flex flex-col grow">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight mb-2 line-clamp-2 h-9">
                          {event.title}
                        </h3>
                        <div className="flex items-center justify-between mt-auto mb-3">
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>
                              {event.date_string
                                ? format(parseISO(event.date_string), "MMM d, yyyy")
                                : "TBA"}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-slate-500">
                            {event.city || (event.is_virtual ? "Online" : "Venue TBA")}
                          </span>
                        </div>

                        <div className="mt-auto border-t border-slate-100 pt-3 flex gap-2">
                          <div className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 group-hover:bg-slate-900 group-hover:text-white py-2.5 rounded-lg transition-all">
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}

              {activeTab === "registered" && registeredEvents.length > registeredVisibleCount && (
                <div className="col-span-full flex justify-center pt-4">
                  <button
                    onClick={() => setRegisteredVisibleCount((c) => c + 8)}
                    className="px-6 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all text-sm cursor-pointer"
                  >
                    Load More
                  </button>
                </div>
              )}

              {activeTab === "registered" && registeredEvents.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-slate-900 font-bold text-xl">No Registered Events Yet</h3>
                  <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed max-w-[380px] mx-auto">
                    When you click "Mark as Registered" on events you apply for, they will appear here so you never lose track.
                  </p>
                  <Link
                    href="/"
                    className="mt-6 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-[#5835e5] transition-all text-sm shadow-sm active:scale-95"
                  >
                    Explore Events
                  </Link>
                </div>
              )}

              {/* ALERTS SECTION */}
              {activeTab === "alerts" &&
                (myReports && myReports.length > 0 ? (
                  myReports.map((report) => {
                    const eventData = report.events;
                    return (
                      <div
                        key={report.id}
                        className="col-span-full bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-3.5 items-start">
                          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-red-100|0">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          </div>
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-bold uppercase tracking-wider rounded border border-red-100 mb-1.5">
                              Action Required: {report.reason}
                            </span>
                            <h4 className="font-bold text-slate-900 text-base">
                              {eventData?.title || "Unknown Event"}
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">
                              A community member reported an accuracy problem. Please review
                              updates immediately.
                            </p>
                          </div>
                        </div>
                        {eventData?.slug && (
                          <Link
                            href={`/events/${eventData.slug}/edit`}
                            className="bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all text-center whitespace-nowrap active:scale-98 shadow-sm"
                          >
                            Fix Issue
                          </Link>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
                    <div className="relative w-full max-w-[280px] sm:max-w-[420px] aspect-video mb-8">
                      <Image
                        src="/Empty_alerts.webp"
                        alt="No Alerts"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                    <h3 className="text-slate-900 font-bold text-xl">No Active Alerts</h3>
                    <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed max-w-[380px] mx-auto">
                      Your curated events look stellar and community approved!
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
