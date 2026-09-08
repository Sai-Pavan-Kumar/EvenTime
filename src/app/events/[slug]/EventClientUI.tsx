"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  ArrowLeft,
  Flag,
  X,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Clock,
  MapPin,
  Globe,
  Download,
  Copy,
  ExternalLink,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Award,
  Tag,
  Hourglass,
  GraduationCap,
  Building,
  MessageCircle,
  UserCheck,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { parseEventDateString } from "@/lib/utils/date";
import { submitReportAction } from "../report-actions";
import { getCategoryConfig } from "@/lib/category-config";
import { EventCard } from "@/app/events/EventCard";
import type { EventRow } from "@/types";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { toast } from "sonner";

export interface EventUIProps {
  event: any;
  similarEvents?: any[];
  curatorUsername?: string | null;
  same_college_interested_count?: number;
  interestedAvatars?: { avatar_url: string | null; username: string | null }[];
  collegeName?: string | null;
}

export default function EventClientUI({
  event,
  similarEvents = [],
  curatorUsername = null,
  interestedAvatars = [],
  collegeName = null,
}: EventUIProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");

  const handleBackNavigation = () => {
    if (fromParam === "admin") {
      router.push("/et98");
    } else if (fromParam === "curator") {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else if (curatorUsername) {
        router.push(`/${curatorUsername}`);
      } else {
        router.push("/");
      }
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const supabase = createClient();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReported, setIsReported] = useState(false);
  const [isReportedByMe, setIsReportedByMe] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<"interested" | "report" | "bookmark">("interested");

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isInterested, setIsInterested] = useState(false);
  const [isLoadingInterest, setIsLoadingInterest] = useState(true);
  const totalInterested = event.interested_events?.[0]?.count || 0;
  const [localInterestCount, setLocalInterestCount] = useState(totalInterested);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isCuratorOrAdmin, setIsCuratorOrAdmin] = useState(false);

  const safeTitle = event.title ?? "Event Details";
  const safeCategory = event.category ?? "General";
  const safeOrganizer = curatorUsername || event.organizer_name || "EvenTime Community";
  const rawRegistrationLink = (event.registration_link || (event as any).website || (event as any).external_link || "").trim();
  const hasRegistrationLink = Boolean(rawRegistrationLink && rawRegistrationLink !== "#");
  const safeRegistrationLink = hasRegistrationLink ? rawRegistrationLink : "#";
  const safeId = event.id ?? "";
  const safeCreatorId = event.creator_id ?? "";

  const isOwner = Boolean(currentUser && safeCreatorId && currentUser.id === safeCreatorId);
  const isStudent = userProfile?.user_type === "student";

  const imageUrl = event.poster_url || event.banner_url || getCategoryConfig(safeCategory)?.backgroundImage || "";

  const formatDetailedDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Date TBA";
    try {
      const d = parseISO(dateStr);
      return format(d, "EEEE, MMMM do, yyyy");
    } catch {
      return dateStr;
    }
  };

  const displayDateRange = useMemo(() => {
    if (!event.date_string) return "Date TBA";
    const start = formatDetailedDate(event.date_string);
    if (event.end_date_string && event.end_date_string !== event.date_string) {
      const end = formatDetailedDate(event.end_date_string);
      return `${start} – ${end}`;
    }
    return start;
  }, [event.date_string, event.end_date_string]);

  const displayTimeRange = useMemo(() => {
    if (!event.start_time && !event.end_time) return "Time TBA";
    if (event.start_time && event.end_time) return `${event.start_time} – ${event.end_time}`;
    return event.start_time || event.end_time;
  }, [event.start_time, event.end_time]);

  const eventUrl = typeof window !== "undefined" ? window.location.href : "";
  const isPastEvent = useMemo(() => {
    if (!event.date_string) return false;
    const parsed = parseEventDateString(event.date_string);
    if (!parsed) return false;
    const endOfDay = new Date(parsed);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.getTime() < Date.now();
  }, [event.date_string]);
  const storyImageUrl = `/api/og/story?title=${encodeURIComponent(safeTitle)}&category=${encodeURIComponent(safeCategory)}&date=${encodeURIComponent(displayDateRange)}&organizer=${encodeURIComponent(safeOrganizer)}`;

  const venueLocation = useMemo(() => {
    if (!event || event.is_virtual || !event.location) return null;
    const loc = event.location.trim();
    const city = (event.city || "").trim();
    if (!loc || loc.toLowerCase() === city.toLowerCase() || loc.toLowerCase() === "virtual event") {
      return null;
    }
    return loc;
  }, [event?.location, event?.city, event?.is_virtual]);

  const googleCalendarUrl = (() => {
    const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const title = encodeURIComponent(`${safeTitle} · via EvenTime`);
    const dateStr = event.date_string?.replace(/-/g, "") ?? "";
    const dates = dateStr ? `${dateStr}/${dateStr}` : "";
    const details = encodeURIComponent(event.description ?? "");
    const location = encodeURIComponent(event.is_virtual ? "Online" : (event.location ?? ""));
    return `${base}&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  })();

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoadingInterest(false);
          return;
        }
        setCurrentUser(user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, user_type, college")
          .eq("id", user.id)
          .maybeSingle();

        setUserProfile(profile);

        const isAdmin = profile?.role === "admin";
        if (user.id === safeCreatorId || isAdmin) {
          setIsCuratorOrAdmin(true);
        }

        if (safeId) {
          try {
            const cached = localStorage.getItem("eventime_saved_ids");
            if (cached) {
              const ids: string[] = JSON.parse(cached);
              if (ids.includes(safeId)) setIsSaved(true);
            }
          } catch {}

          const [{ data: savedRows }, { data: interestRow }, { data: reportRow }] = await Promise.all([
            supabase
              .from("saved_events")
              .select("id")
              .eq("event_id", safeId)
              .eq("user_id", user.id)
              .limit(1),
            supabase
              .from("interested_events")
              .select("id")
              .eq("event_id", safeId)
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("event_reports")
              .select("id")
              .eq("event_id", safeId)
              .eq("reporter_id", user.id)
              .eq("status", "pending")
              .maybeSingle(),
          ]);

          if (savedRows && savedRows.length > 0) setIsSaved(true);
          if (interestRow) setIsInterested(true);
          if (reportRow) setIsReportedByMe(true);
        }
      } catch (err) {
        console.error("Error fetching event interaction state:", err);
      } finally {
        setIsLoadingInterest(false);
      }
    };
    fetchInitialState();
  }, [safeId, safeCreatorId, supabase]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(eventUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `🎉 *${safeTitle}*\n📅 ${displayDateRange} · ${displayTimeRange}\n📍 ${event.is_virtual ? "Online Event" : (event.location || event.city || "Venue TBA")}\n\nExplore details & register on EvenTime:\n${eventUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const downloadStory = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(storyImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeTitle.replace(/\s+/g, "-")}-Story.webp`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Failed to download image", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (isOwner) {
      toast.info("Already in My Events");
      return;
    }
    if (!currentUser) {
      setAuthModalReason("bookmark");
      setIsAuthModalOpen(true);
      return;
    }
    if (!safeId || (isPastEvent && !isSaved)) return;

    const nextState = !isSaved;
    setIsSaved(nextState);
    setIsSaving(true);

    // Sync localStorage
    try {
      const cached = localStorage.getItem("eventime_saved_ids");
      let idList: string[] = cached ? JSON.parse(cached) : [];
      if (nextState) {
        if (!idList.includes(safeId)) idList.push(safeId);
      } else {
        idList = idList.filter((x) => x !== safeId);
      }
      localStorage.setItem("eventime_saved_ids", JSON.stringify(idList));
    } catch {}

    try {
      if (nextState) {
        // Delete any existing rows first to prevent duplicates in DB
        await supabase.from("saved_events").delete().eq("event_id", safeId).eq("user_id", currentUser.id);
        const { error } = await supabase.from("saved_events").insert({
          event_id: safeId,
          user_id: currentUser.id,
        });
        if (error) throw error;
        toast.success("Event saved to your profile!");
      } else {
        const { error } = await supabase
          .from("saved_events")
          .delete()
          .eq("event_id", safeId)
          .eq("user_id", currentUser.id);
        if (error) throw error;
        toast.success("Event removed from saved.");
      }
    } catch (err: any) {
      console.error("Bookmark error:", err);
      setIsSaved(!nextState);
      toast.error("Could not update saved events.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInterestedClick = async () => {
    if (isLoadingInterest) return;
    if (isOwner) {
      toast.info("Host can't mark interest");
      return;
    }
    if (isPastEvent) return;
    if (!currentUser) {
      setAuthModalReason("interested");
      setIsAuthModalOpen(true);
      return;
    }

    const previousState = isInterested;
    const nextState = !previousState;
    setIsInterested(nextState);
    setLocalInterestCount((prev: number) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (nextState) {
        const { data: inserted, error } = await supabase
          .from("interested_events")
          .upsert(
            { event_id: safeId, user_id: currentUser.id },
            { onConflict: "event_id,user_id", ignoreDuplicates: true }
          )
          .select();
        if (error) throw new Error(error.message || JSON.stringify(error));

        if (safeCreatorId && inserted && inserted.length > 0) {
          await supabase.rpc("increment_et_score", { user_id: safeCreatorId, delta: 10 });
        }
        toast.success("Marked as interested!");
      } else {
        const { error } = await supabase
          .from("interested_events")
          .delete()
          .eq("event_id", safeId)
          .eq("user_id", currentUser.id);
        if (error) throw new Error(error.message || JSON.stringify(error));
        toast.info("Removed from interested.");
      }
    } catch (error: any) {
      console.error("Failed to update interest status:", error.message || error);
      setIsInterested(previousState);
      setLocalInterestCount((prev: number) => (previousState ? prev + 1 : Math.max(0, prev - 1)));
      toast.error("Could not update interest status.");
    }
  };

  const handleWithdrawReport = async () => {
    if (!currentUser || !safeId) return;
    setIsWithdrawing(true);
    try {
      const { error } = await supabase
        .from("event_reports")
        .delete()
        .eq("event_id", safeId)
        .eq("reporter_id", currentUser.id)
        .eq("status", "pending");
      if (error) throw error;
      setIsReportedByMe(false);
      toast.success("Report withdrawn successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Could not withdraw report.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-white pb-24 md:pb-12 overflow-x-hidden">
      <Navbar />

      {event.status === "pending" && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-amber-800 font-medium text-sm">
            This event is pending admin approval. It is currently only visible to you.
          </p>
        </div>
      )}

      {/* Mobile App Handoff Banner */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm border-b border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center shrink-0 shadow-sm">
            <span className="font-heading font-black text-white text-xs">ET</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white leading-tight truncate">Open in EvenTime App</p>
            <p className="text-[11px] text-slate-400 leading-tight">Faster & smoother experience</p>
          </div>
        </div>
        <a
          href={`intent://events/${event.slug || safeId}#Intent;scheme=eventime;package=com.eventime.app;end`}
          onClick={(e) => {
            const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
            if (!isAndroid) {
              e.preventDefault();
              window.location.href = `eventime://events/${event.slug || safeId}`;
            }
          }}
          className="shrink-0 bg-brand-primary hover:bg-[#5835e5] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
        >
          Open App
        </a>
      </div>

      <div className="max-w-6xl mx-auto w-full px-6 py-8 md:py-10 space-y-8">
        {/* Top Header Bar with Bookmark, Share, Report, Edit */}
        <div className="flex justify-between items-center w-full">
          <button
            onClick={handleBackNavigation}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-900"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {currentUser?.id === safeCreatorId && (
              <Link
                href={`/events/${event.slug || safeId}/edit`}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-brand-primary border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                Edit Event
              </Link>
            )}

            {/* Bookmark / Save Event Button */}
            {(!isPastEvent || isSaved || isOwner) && (
              <button
                onClick={handleBookmarkToggle}
                disabled={isSaving}
                title={isOwner ? "Your Event" : isSaved ? "Remove from Saved" : "Save Event"}
                className={`p-2.5 rounded-full transition-all ${
                  isOwner
                    ? "bg-slate-100 text-slate-400 cursor-default opacity-70"
                    : isSaved
                    ? "bg-brand-primary text-white shadow-sm hover:bg-[#5835e5]"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved && !isOwner ? "fill-white" : ""}`} />
              </button>
            )}

            {/* Report Event */}
            {!isPastEvent && (
              <button
                onClick={() => {
                  if (!currentUser) {
                    setAuthModalReason("report");
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setIsReportModalOpen(true);
                }}
                title="Report inaccurate info or spam"
                className="p-2.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full border border-slate-200 transition-colors"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}

            {/* Share Event */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              title="Share Event"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-full border border-slate-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Full-width Title & Goal Tags */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-5xl font-extrabold text-brand-primary font-heading leading-[1.15] max-w-4xl mx-auto">
            {safeTitle}
          </h1>

          {/* Goal Tags */}
          {event.goal_tags && event.goal_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              {event.goal_tags.map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-50 text-brand-primary border border-purple-100 text-xs font-bold rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="space-y-10 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">
          {/* LEFT COLUMN — Media & Action Buttons */}
          <div className="lg:sticky lg:top-8 space-y-6">
            {imageUrl ? (
              <div className="relative w-full rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                <Image
                  src={imageUrl}
                  alt={safeTitle}
                  width={1200}
                  height={675}
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute bottom-3 left-3 px-3 py-1 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-extrabold uppercase tracking-wider rounded-lg">
                  {safeCategory}
                </div>
              </div>
            ) : null}

            {/* Role-Gated Social Proof Attendance Bar (Only upcoming) */}
            {!isPastEvent && (
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isInterested
                    ? "bg-purple-50/70 border-purple-200"
                    : "bg-slate-50/80 border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isOwner
                          ? "bg-slate-100 text-slate-400"
                          : isInterested
                          ? "bg-purple-100 text-brand-primary"
                          : "bg-white text-slate-600 shadow-xs border border-slate-100"
                      }`}
                    >
                      {isOwner ? (
                        <Users className="w-5 h-5 text-slate-400" />
                      ) : isStudent ? (
                        <GraduationCap
                          className={`w-5 h-5 ${isInterested ? "text-brand-primary" : "text-slate-600"}`}
                        />
                      ) : (
                        <Users
                          className={`w-5 h-5 ${isInterested ? "text-brand-primary" : "text-slate-600"}`}
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">
                        {isStudent
                          ? localInterestCount > 0
                            ? isInterested
                              ? localInterestCount === 1
                                ? "You're going"
                                : `You & ${localInterestCount - 1} ${localInterestCount - 1 === 1 ? "other" : "others"} are going`
                              : `${localInterestCount} ${localInterestCount === 1 ? "student is" : "students are"} going`
                            : "Be the first to show interest"
                          : localInterestCount > 0
                          ? isInterested
                            ? localInterestCount === 1
                              ? "You're going"
                              : `You & ${localInterestCount - 1} ${localInterestCount - 1 === 1 ? "other" : "others"} are going`
                            : `${localInterestCount} ${localInterestCount === 1 ? "person is" : "people are"} interested`
                          : "Be the first to show interest"}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {isOwner
                          ? "You are the creator of this event"
                          : isPastEvent
                          ? "This event has already concluded"
                          : isInterested
                          ? "You are marked as interested · Click to remove"
                          : "Click to show you're interested"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleInterestedClick}
                    disabled={isLoadingInterest || isCuratorOrAdmin || isPastEvent}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      isPastEvent
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                        : isOwner
                        ? "bg-slate-100 text-slate-400 cursor-default"
                        : isInterested
                        ? "bg-brand-primary text-white shadow-sm hover:bg-[#5835e5]"
                        : "bg-white hover:bg-slate-100 text-slate-800 border border-slate-200"
                    }`}
                  >
                    {isPastEvent ? "Event Concluded" : isOwner ? "Host" : isInterested ? "✓ Interested" : "I'm Interested"}
                  </button>
                </div>
              </div>
            )}

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-4">
              {!isPastEvent ? (
                hasRegistrationLink ? (
                  <Link
                    href={`/redirect?to=${encodeURIComponent(safeRegistrationLink)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-bold text-center hover:bg-[#5835e5] transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    Register for Event <ExternalLink className="w-4 h-4" />
                  </Link>
                ) : (
                  <div className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-700 py-4 px-3 rounded-2xl font-bold text-center flex items-center justify-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Walk-in Event (No Registration Needed)
                  </div>
                )
              ) : (
                <div className="flex-1 bg-slate-100 text-slate-400 py-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2">
                  Event Concluded
                </div>
              )}

              {currentUser?.id === safeCreatorId && (
                <Link
                  href={`/events/${event.slug || safeId}/edit`}
                  className="px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 bg-purple-50 text-brand-primary border border-purple-200 hover:bg-purple-100"
                >
                  Edit Event
                </Link>
              )}
            </div>

            {/* Active Report Notice & Withdraw Button */}
            {isReportedByMe && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-amber-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Report Submitted (Pending Review)</span>
                </div>
                <button
                  onClick={handleWithdrawReport}
                  disabled={isWithdrawing}
                  className="text-xs font-bold text-red-600 hover:text-red-700 underline shrink-0"
                >
                  {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — Meta Details & About */}
          <div className="space-y-8">
            {/* About Event */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 font-heading">About This Event</h2>
              <div className="prose prose-slate max-w-none text-slate-700 font-sans text-[15px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {event.description || "No specific description provided for this event."}
              </div>
            </div>

            {/* Event Details Card */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4">
              {/* Curated by with profile link */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                    Curated by
                  </p>
                  <Link
                    href={`/${curatorUsername || safeCreatorId}`}
                    className="text-[14px] font-bold text-brand-primary hover:underline"
                  >
                    {safeOrganizer}
                  </Link>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                    Date
                  </p>
                  <p className="text-[14px] font-bold text-slate-900">{displayDateRange}</p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                    Time
                  </p>
                  <p className="text-[14px] font-bold text-slate-900">{displayTimeRange}</p>
                </div>
              </div>

              {/* Venue Location (If distinct) */}
              {venueLocation && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                      Venue / Landmark
                    </p>
                    <p className="text-[14px] font-bold text-slate-900">{venueLocation}</p>
                  </div>
                </div>
              )}

              {/* Mode or City */}
              {event.is_virtual ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                      Event Mode
                    </p>
                    <p className="text-[14px] font-bold text-slate-900">Virtual / Online Event</p>
                  </div>
                </div>
              ) : (
                event.city && (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                        City
                      </p>
                      <Link
                        href={`/cities/${encodeURIComponent(event.city)}`}
                        className="text-[14px] font-bold text-brand-primary hover:underline"
                      >
                        {event.city}
                      </Link>
                    </div>
                  </div>
                )
              )}

              {/* Registration Fee / Price */}
              {(event.is_free === false || Boolean(event.price)) && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                      Registration Fee
                    </p>
                    <p className="text-[14px] font-extrabold text-amber-700">
                      {event.price ? `₹${event.price}` : "Paid Event"}
                    </p>
                  </div>
                </div>
              )}

              {/* Registration Deadline */}
              {event.registration_deadline && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                    <Hourglass className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                      Registration Deadline
                    </p>
                    <p className="text-[14px] font-bold text-rose-700">{event.registration_deadline}</p>
                  </div>
                </div>
              )}

              {/* Prizes / Pool */}
              {event.prizes && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                      Prizes / Rewards
                    </p>
                    <p className="text-[14px] font-bold text-slate-900">{event.prizes}</p>
                  </div>
                </div>
              )}

              {/* Team Size (Featured Events Only) */}
              {event.is_featured && event.team_size && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                      Team Size
                    </p>
                    <p className="text-[14px] font-bold text-slate-900">{event.team_size}</p>
                  </div>
                </div>
              )}

              {/* College Specific */}
              {(collegeName || event.colleges?.name || event.college_only) && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                      College Hosted
                    </p>
                    <p className="text-[14px] font-bold text-slate-900">
                      {collegeName || event.colleges?.name || "College Event"}
                      {event.college_only ? " (Students Only)" : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Eligible Branches */}
              {(event.college_branch || (event.branch_tags && event.branch_tags.length > 0)) && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                      Eligible Branches
                    </p>
                    <p className="text-[14px] font-bold text-indigo-950">
                      {event.college_branch || event.branch_tags?.join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Add to Calendar (Upcoming only) */}
              {!isPastEvent && googleCalendarUrl && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                      Add to Calendar
                    </p>
                    <a
                      href={googleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] font-bold text-brand-primary hover:underline"
                    >
                      Add to Google Calendar &rarr;
                    </a>
                  </div>
                </div>
              )}

              {/* Interested community avatars */}
              {localInterestCount > 0 && (
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  {interestedAvatars.length > 0 && (
                    <div className="flex -space-x-2">
                      {interestedAvatars.map((u, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shrink-0"
                        >
                          {u.avatar_url ? (
                            <Image
                              src={u.avatar_url}
                              alt={u.username || ""}
                              width={32}
                              height={32}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-brand-primary/20 flex items-center justify-center text-[10px] font-bold text-brand-primary">
                              {(u.username || "?")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-slate-700">
                    {localInterestCount} {localInterestCount === 1 ? "person" : "people"} interested
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Events */}
      {similarEvents && similarEvents.length > 0 && (
        <div className="max-w-6xl mx-auto w-full px-6 py-8 border-t border-slate-100 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 font-heading">Similar Events</h2>
              <p className="text-sm text-slate-500 font-medium">Events in the same category you might like</p>
            </div>
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => scroll("left")}
                className="p-2 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="p-2 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {similarEvents.map((simEvent) => (
              <div key={simEvent.id} className="w-[300px] shrink-0">
                <EventCard
                  id={simEvent.id}
                  slug={simEvent.slug || simEvent.id}
                  title={simEvent.title}
                  category={simEvent.category}
                  date={
                    simEvent.start_time
                      ? `${simEvent.date_string} · ${simEvent.start_time}${
                          simEvent.end_time ? ` - ${simEvent.end_time}` : ""
                        }`
                      : simEvent.date_string
                  }
                  city={simEvent.is_virtual ? "Online" : (simEvent.location || simEvent.city || "Venue TBA")}
                  imageUrl={
                    simEvent.poster_url ||
                    getCategoryConfig(simEvent.category)?.backgroundImage ||
                    ""
                  }
                  organizerName={
                    (simEvent as any).profiles?.username ||
                    simEvent.organizer_name ||
                    "EvenTime Community"
                  }
                  organizerUsername={(simEvent as any).profiles?.username}
                  creatorId={simEvent.creator_id || undefined}
                  isFree={simEvent.is_free ?? true}
                  isFeatured={simEvent.is_featured ?? false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 px-4 flex items-center gap-3 shadow-lg">
        {!isPastEvent ? (
          hasRegistrationLink ? (
            <Link
              href={`/redirect?to=${encodeURIComponent(safeRegistrationLink)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-brand-primary text-white py-3 px-4 rounded-xl font-bold text-center text-sm hover:bg-[#5835e5] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              Register for Event <ExternalLink className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-700 py-3 px-4 rounded-xl font-bold text-center text-xs flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Walk-in Event (No Registration Needed)
            </div>
          )
        ) : (
          <div className="flex-1 bg-slate-100 text-slate-400 py-3 px-4 rounded-xl font-bold text-center text-sm">
            Event Concluded
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsAuthModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 text-center border border-slate-100"
            >
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
                <Users className="w-7 h-7 text-brand-primary" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900 leading-tight">Wait a second!</h3>
              <p className="text-sm text-slate-500 mt-2 mb-6 font-medium">
                {authModalReason === "report"
                  ? "Please sign in to report this event."
                  : authModalReason === "bookmark"
                  ? "Please sign in to bookmark and save events to your profile."
                  : "Please sign in to mark interest and build your community schedule."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    router.push(`/login?next=${encodeURIComponent(new URL(window.location.href).pathname)}`)
                  }
                  className="flex-1 bg-brand-primary text-white font-bold py-3.5 rounded-xl hover:bg-[#5835e5] transition-colors text-sm"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsShareModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-5 border-b border-slate-100">
                <h3 className="font-heading font-bold text-lg text-slate-900">Share Event</h3>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col items-center">
                <div className="relative w-full aspect-9/16 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner mb-6">
                  <Image src={storyImageUrl} alt="Story Invite" fill className="object-cover" unoptimized />
                </div>
                <div className="flex flex-col gap-2.5 w-full">
                  <button
                    onClick={handleWhatsAppShare}
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    Share on WhatsApp
                  </button>
                  <button
                    onClick={downloadStory}
                    disabled={isDownloading}
                    className="w-full bg-slate-900 hover:bg-black text-white px-5 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                  >
                    {isDownloading ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isDownloading ? "Generating HQ Poster..." : "Download Story Poster"}
                  </button>
                  <button
                    onClick={copyLink}
                    className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-5 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {isCopied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {isCopied ? "Link Copied!" : "Copy Event Link"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setIsReportModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 text-center border-b border-slate-100 relative">
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-heading font-bold text-xl text-slate-900">Report Event</h3>
                <p className="text-sm text-slate-500 mt-1">Help us keep the community accurate and safe.</p>
              </div>
              <div className="p-6">
                {isReported ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-bold text-slate-900">Report Submitted</p>
                    <p className="text-sm text-slate-500 mt-1">Our moderation team will review this shortly.</p>
                    <button
                      onClick={() => {
                        setIsReportModalOpen(false);
                        setIsReportedByMe(true);
                      }}
                      className="mt-6 w-full bg-slate-100 text-slate-900 font-bold py-3 rounded-xl text-sm"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form
                    action={async (formData) => {
                      await submitReportAction(formData);
                      setIsReported(true);
                    }}
                    className="flex flex-col gap-3"
                  >
                    <input type="hidden" name="eventId" value={safeId} />
                    <input type="hidden" name="curatorId" value={safeCreatorId} />
                    {["Broken Link", "Incorrect Location", "Fake/Spam Event", "Wrong Date/Time"].map((reason) => (
                      <label
                        key={reason}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          reportReason === reason ? "border-red-500 bg-red-50" : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={reason}
                          className="hidden"
                          onChange={() => setReportReason(reason)}
                          required
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            reportReason === reason ? "border-red-500" : "border-slate-300"
                          }`}
                        >
                          {reportReason === reason && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                        </div>
                        <span
                          className={`text-sm font-bold ${
                            reportReason === reason ? "text-red-700" : "text-slate-700"
                          }`}
                        >
                          {reason}
                        </span>
                      </label>
                    ))}
                    <button
                      type="submit"
                      disabled={!reportReason}
                      className="mt-4 w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-bold text-sm transition-all"
                    >
                      Submit Report
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
