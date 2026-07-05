"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, ArrowLeft, Flag, X, CheckCircle2, AlertTriangle, CalendarDays, MapPin, Globe, Download, Copy, ExternalLink, Users, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { submitReportAction } from "../report-actions";
import { getCategoryConfig } from "@/lib/category-config";
import { EventCard } from "@/app/events/EventCard";
import type { EventRow } from "@/types";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";

export interface EventUIProps {
  event: any;
  similarEvents?: any[];
  curatorUsername?: string | null;
  same_college_interested_count?: number;
  interestedAvatars?: { avatar_url: string | null; username: string | null }[];
  collegeName?: string | null;
}

export default function EventClientUI({ event, similarEvents = [], curatorUsername = null, interestedAvatars = [], collegeName = null }: EventUIProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReported, setIsReported] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [isLoadingInterest, setIsLoadingInterest] = useState(true);
  const totalInterested = event.interested_events?.[0]?.count || 0;
  const [localInterestCount, setLocalInterestCount] = useState(totalInterested);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCuratorOrAdmin, setIsCuratorOrAdmin] = useState(false);

  const safeTitle = event.title ?? "Event Details";
  const safeCategory = event.category ?? "General";
  const safeOrganizer = curatorUsername || event.organizer_name || "Unknown Organizer";
  const safeRegistrationLink = event.registration_link ?? "#";
  const safeId = event.id ?? "";
  const safeCreatorId = event.creator_id ?? "";

  const imageUrl = event.poster_url || event.banner_url || getCategoryConfig(safeCategory)?.backgroundImage || "";
  const displayDate = event.date_string ? format(parseISO(event.date_string), "EEEE, MMMM do") : "";
  const eventUrl = typeof window !== "undefined" ? window.location.href : "";
  const isPastEvent = event.date_string ? new Date(event.date_string) < new Date(new Date().setHours(0, 0, 0, 0)) : false;
  const storyImageUrl = `/api/og/story?title=${encodeURIComponent(safeTitle)}&category=${encodeURIComponent(safeCategory)}&date=${encodeURIComponent(displayDate)}&organizer=${encodeURIComponent(safeOrganizer)}`;

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
        if (!user) { setIsLoadingInterest(false); return; }
        setCurrentUser(user);

        let isAdmin = false;
        if (user.id !== safeCreatorId) {
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
          isAdmin = profile?.role === "admin";
        }

        if (user.id === safeCreatorId || isAdmin) {
          setIsCuratorOrAdmin(true);
          setIsLoadingInterest(false);
          return;
        }

        if (safeId) {
          const { data, error } = await supabase
            .from("interested_events" as any)
            .select("id")
            .eq("event_id", safeId)
            .eq("user_id", user.id)
            .maybeSingle();
          if (data && !error) setIsInterested(true);
        }
      } catch (err) {
        console.error("Error fetching interest state:", err);
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

  const handleInterestedClick = async () => {
    if (isLoadingInterest) return;
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    if (isCuratorOrAdmin) return;

    const previousState = isInterested;
    setIsInterested(!previousState);
    setLocalInterestCount((prev: number) => !previousState ? prev + 1 : Math.max(0, prev - 1));

    try {
      if (!previousState) {
        const { error } = await supabase.from("interested_events" as any).insert({ event_id: safeId, user_id: currentUser.id }).select();
        if (error) throw new Error(error.message || JSON.stringify(error));
      } else {
        const { error } = await supabase.from("interested_events" as any).delete().eq("event_id", safeId).eq("user_id", currentUser.id);
        if (error) throw new Error(error.message || JSON.stringify(error));
      }
    } catch (error: any) {
      console.error("Failed to update interest status:", error.message || error);
      setIsInterested(previousState);
      setLocalInterestCount((prev: number) => previousState ? prev + 1 : Math.max(0, prev - 1));
      alert(`Database Error: ${error.message || "Failed to update"}. Please check your Supabase table and RLS policies!`);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-screen bg-white pb-8">
      <Navbar />
    {event.status === "pending" && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <p className="text-amber-800 font-medium text-sm">
            This event is pending admin approval. It is currently only visible to you.
          </p>
        </div>
      )}
    
      <div className="max-w-6xl mx-auto w-full px-6 py-8 md:py-10 space-y-10">

        {/* Back + Actions */}
        <div className="flex justify-between items-center w-full">
          <button onClick={() => router.push("/")} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-900" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsReportModalOpen(true)} className="p-2 text-slate-400 hover:text-red-500 rounded-full transition-colors">
              <Flag className="w-5 h-5" />
            </button>
            <button onClick={() => setIsShareModalOpen(true)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <Share2 className="w-5 h-5 text-slate-900" />
            </button>
          </div>
        </div>

        {/* Full-width centered title */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-brand-primary font-heading leading-[1.1] text-center">
          {safeTitle}
        </h1>

        {/* TWO-COLUMN LAYOUT */}
        <div className="space-y-10 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">

          {/* LEFT COLUMN — sticky */}
          <div className="lg:sticky lg:top-8 space-y-6">

            {imageUrl ? (
              <div className="relative w-full rounded-3x1 overflow-hidden">
                <Image src={imageUrl} alt={safeTitle} width={1200} height={675} className="w-full h-auto object-contain" priority />
              </div>
            ) : null}

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-4">
              {!isPastEvent && (
                <a
                  href={safeRegistrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-bold text-center hover:bg-[#5835e5] transition-all flex items-center justify-center gap-2"
                >
                  Register <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={handleInterestedClick}
                disabled={isLoadingInterest || isCuratorOrAdmin}
                className={`flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                  isCuratorOrAdmin
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : isInterested
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
              >
                {isLoadingInterest
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : (isCuratorOrAdmin ? "Curated by you" : (isInterested ? "✓ Saved" : "Interested"))
                }
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">

            {/* About Event */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">About Event</h2>
              <div className="prose prose-slate max-w-none text-slate-700 font-sans text-[16px] leading-relaxed whitespace-pre-wrap">
                {event.description}
              </div>
            </div>

            {/* Event Details Card */}
            <div className="bg-slate-50 rounded-3x1 p-6 border border-slate-100 space-y-5">

              {/* Curated by */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-base">✍️</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Curated by</p>
                  <p className="text-[14px] font-bold text-slate-900">{safeOrganizer}</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Date & Time</p>
                  <p className="text-[14px] font-bold text-slate-900">{displayDate} · {event.start_time || "TBA"}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                  {event.is_virtual ? <Globe className="w-5 h-5 text-slate-400" /> : <MapPin className="w-5 h-5 text-slate-400" />}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Location</p>
                  <p className="text-[14px] font-bold text-slate-900">{event.is_virtual ? "Online Platform" : event.location}</p>
                </div>
              </div>

              {/* College (if applicable) */}
              {collegeName && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-base">🏢</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Hosted by</p>
                    <p className="text-[14px] font-bold text-slate-900">{collegeName}</p>
                  </div>
                </div>
              )}

              {/* Add to Calendar */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-base">📅</span>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Add to Calendar</p>
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

              {/* Interested people with avatars */}
              {localInterestCount > 0 && (
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                  {interestedAvatars.length > 0 && (
                    <div className="flex -space-x-2">
                      {interestedAvatars.map((u, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shrink-0">
                          {u.avatar_url ? (
                            <Image src={u.avatar_url} alt={u.username || ""} width={32} height={32} className="object-cover w-full h-full" />
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

              {/* Mobile Action Buttons (Inline) */}
              <div className="md:hidden flex gap-3 pt-2 border-t border-slate-200 mt-2">
                <button
                  onClick={handleInterestedClick}
                  disabled={isLoadingInterest || isCuratorOrAdmin}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isCuratorOrAdmin ? "bg-slate-100 text-slate-400 cursor-not-allowed" : isInterested ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-200 text-slate-900"
                  }`}
                >
                  {isLoadingInterest ? <Loader2 className="w-5 h-5 animate-spin" /> : (isCuratorOrAdmin ? "Curated by you" : (isInterested ? " Saved" : "Interested"))}
                </button>
                {!isPastEvent && (
                  <a href={safeRegistrationLink} target="_blank" rel="noopener noreferrer" className="flex-1 bg-brand-primary text-white py-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2">
                    Register <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Similar Events - separate full-width section */}
      {similarEvents && similarEvents.length > 0 && (
        <div className="max-w-6xl mx-auto w-full px-6 py-8 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Similar Events</h2>
            <div className="hidden md:flex gap-2">
              <button onClick={() => scroll("left")} className="p-2 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button onClick={() => scroll("right")} className="p-2 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {similarEvents.filter((simEvent) => {
              // FIX: Filter out events that are today but whose time has already passed
              if (!simEvent.date_string) return true;
              const eventDate = new Date(simEvent.date_string);
              if (simEvent.start_time) {
                const [time, modifier] = simEvent.start_time.split(" ");
                let [hours, minutes] = time.split(":");
                if (hours === "12") hours = "00";
                if (modifier === "PM") hours = parseInt(hours, 10) + 12;
                eventDate.setHours(hours, minutes, 0, 0);
              }
              return eventDate.getTime() > new Date().getTime();
            }).map((simEvent) => (
              <div key={simEvent.id} className="w-70 shrink-0">
                <EventCard
                  id={simEvent.id!}
                  slug={simEvent.slug || simEvent.id!}
                  title={simEvent.title || "Untitled Event"}
                  category={simEvent.category || "General"}
                  date={simEvent.date_string || "TBA"}
                  city={simEvent.location || simEvent.city || "Online"}
                  imageUrl={simEvent.poster_url || "/window.svg"}
                  organizerName={simEvent.profiles?.username || simEvent.organizer_name || "Organizer"}
                  isFree={simEvent.is_free ?? false}
                  audience={simEvent.target_audience ?? []}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAuthModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col p-6 text-center border border-slate-100"
            >
              <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
                <Users className="w-7 h-7 text-slate-600" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900 leading-tight">Wait a second!</h3>
              <p className="text-sm text-slate-500 mt-2 mb-6 font-medium">Please sign in to save events and build your personal calendar.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsAuthModalOpen(false)} className="flex-1 bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={() => router.push(`/login?next=${encodeURIComponent(new URL(window.location.href).pathname)}`)} className="flex-1 bg-brand-primary text-white font-bold py-3.5 rounded-xl hover:bg-[#5835e5] transition-colors">Sign In</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-5 border-b border-slate-100">
                <h3 className="font-heading font-bold text-lg text-slate-900">Share Event</h3>
                <button onClick={() => setIsShareModalOpen(false)} className="p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 flex flex-col items-center">
                <div className="relative w-full aspect-9/16 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner mb-6">
                  <Image src={storyImageUrl} alt="Story Invite" fill className="object-cover" unoptimized />
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <button onClick={downloadStory} disabled={isDownloading} className="w-full bg-text-primary hover:bg-black text-white px-6 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70">
                    {isDownloading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                    {isDownloading ? "Generating HQ Poster..." : "Download Story Poster"}
                  </button>
                  <button onClick={copyLink} className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-6 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95">
                    {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
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
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsReportModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 text-center border-b border-slate-100 relative">
                <button onClick={() => setIsReportModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-heading font-bold text-xl text-slate-900">Report Event</h3>
                <p className="text-sm text-slate-500 mt-1">Help us keep the community safe.</p>
              </div>
              <div className="p-6">
                {isReported ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-bold text-slate-900">Report Submitted</p>
                    <p className="text-sm text-slate-500 mt-1">Our admin team will review this shortly.</p>
                    <button onClick={() => setIsReportModalOpen(false)} className="mt-6 w-full bg-slate-100 text-slate-900 font-bold py-3 rounded-xl">Close</button>
                  </div>
                ) : (
                  <form action={async (formData) => { await submitReportAction(formData); setIsReported(true); }} className="flex flex-col gap-3">
                    <input type="hidden" name="eventId" value={safeId} />
                    <input type="hidden" name="curatorId" value={safeCreatorId} />
                    {["Broken Link", "Incorrect Location", "Fake/Spam Event", "Wrong Date/Time"].map((reason) => (
                      <label key={reason} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${reportReason === reason ? "border-red-500 bg-red-50" : "border-slate-200 hover:bg-slate-50"}`}>
                        <input type="radio" name="reason" value={reason} className="hidden" onChange={() => setReportReason(reason)} required />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${reportReason === reason ? "border-red-500" : "border-slate-300"}`}>
                          {reportReason === reason && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                        </div>
                        <span className={`text-sm font-bold ${reportReason === reason ? "text-red-700" : "text-slate-700"}`}>{reason}</span>
                      </label>
                    ))}
                    <button type="submit" disabled={!reportReason} className="mt-4 w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-6 py-4 rounded-xl font-bold text-sm transition-all">
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