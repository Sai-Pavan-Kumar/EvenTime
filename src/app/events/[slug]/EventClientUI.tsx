  "use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Share2, ArrowLeft, Flag, X, CheckCircle2, AlertTriangle, 
  CalendarDays, MapPin, Globe, Download, Copy, ExternalLink, Users, Loader2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { submitReportAction } from "../report-actions";
import { getCategoryConfig } from "@/lib/category-config";
import { EventCard } from "@/app/events/EventCard";
import type { EventRow } from "@/types";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client"; 
import { Navbar } from "@/components/layout/Navbar";

export interface EventUIProps {
  event: Partial<EventRow> & { 
    same_college_interested_count?: number; 
  };
  similarEvents?: Partial<EventRow>[];
  curatorUsername?: string | null;
}

export default function EventClientUI({ event, similarEvents = [], curatorUsername = null }: EventUIProps) {
  const router = useRouter();
  const supabase = createClient(); 
  
  // Share Modal States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Report Modal States
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReported, setIsReported] = useState(false);

  // Auth & Interested States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [isLoadingInterest, setIsLoadingInterest] = useState(true); 
  const [localInterestCount, setLocalInterestCount] = useState(event.same_college_interested_count || 0); 
  const [currentUser, setCurrentUser] = useState<any>(null); // Added state to track user
  const [isCuratorOrAdmin, setIsCuratorOrAdmin] = useState(false); // Added state to block curators/admins

  // Safe variables to prevent TypeScript 'undefined' errors
  const safeTitle = event.title ?? "Event Details";
  const safeCategory = event.category ?? "General";
  const safeOrganizer = curatorUsername || event.organizer_name || "Unknown Organizer";
  const safeRegistrationLink = event.registration_link ?? "#";
  const safeId = event.id ?? "";
  const safeCreatorId = event.creator_id ?? "";

  // Compute the cover photo URL once
  const imageUrl = event.poster_url || event.banner_url || getCategoryConfig(safeCategory)?.backgroundImage || "";

  const displayDate = event.date_string ? format(parseISO(event.date_string), "EEEE, MMMM do") : "";

  const eventUrl = typeof window !== 'undefined' ? window.location.href : "";
  const storyImageUrl = `/api/og/story?title=${encodeURIComponent(safeTitle)}&category=${encodeURIComponent(safeCategory)}&date=${encodeURIComponent(displayDate)}&organizer=${encodeURIComponent(safeOrganizer)}`;

  // --- RECTIFIED: Fetch initial state & Check Role using strictly Supabase Auth ---
  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoadingInterest(false);
          return;
        }

        setCurrentUser(user);

        // 1. Check if user is the Curator OR an Admin
        let isAdmin = false;
        if (user.id !== safeCreatorId) {
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
          isAdmin = profile?.role === 'admin';
        }

        if (user.id === safeCreatorId || isAdmin) {
          setIsCuratorOrAdmin(true);
          setIsLoadingInterest(false);
          return; // Stop here, no need to query interested_events for them
        }

        // 2. Fetch the interest state for normal users
        if (safeId) {
          const { data, error } = await supabase
            .from("interested_events" as any)
            .select("id")
            .eq("event_id", safeId)
            .eq("user_id", user.id)
            .maybeSingle();

          if (data && !error) {
            setIsInterested(true);
          }
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
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeTitle.replace(/\s+/g, '-')}-Story.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Failed to download image", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // --- RECTIFIED: Removed document.cookie check. Relies on the fetched currentUser. ---
  const handleInterestedClick = async () => {
    if (isLoadingInterest) return;

    // Check robust auth state rather than fragile cookies
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    // Do nothing if they are the creator or admin
    if (isCuratorOrAdmin) return;

    // Optimistic UI Update
    const previousState = isInterested;
    setIsInterested(!previousState);
    setLocalInterestCount(prev => !previousState ? prev + 1 : Math.max(0, prev - 1));

    try {
      if (!previousState) {
        // Was false, now true -> Insert
        const { error } = await supabase
          .from("interested_events" as any)
          .insert({ event_id: safeId, user_id: currentUser.id })
          .select(); // Appended .select() to forcefully surface hidden RLS errors
        
        if (error) throw new Error(error.message || JSON.stringify(error));
      } else {
        // Was true, now false -> Delete
        const { error } = await supabase
          .from("interested_events" as any)
          .delete()
          .eq("event_id", safeId)
          .eq("user_id", currentUser.id);
          
        if (error) throw new Error(error.message || JSON.stringify(error));
      }
    } catch (error: any) {
      console.error("Failed to update interest status:", error.message || error);
      
      // Revert Optimistic UI on failure
      setIsInterested(previousState);
      setLocalInterestCount(prev => previousState ? prev + 1 : Math.max(0, prev - 1));
      
      // Explicitly alert the exact DB error so you know what is failing in Supabase
      alert(`Database Error: ${error.message || "Failed to update"}. Please check your Supabase table and RLS policies!`);
    }
  };

  return (
    <main className="min-h-screen bg-white pb-8">
      {/* Shared Navbar */}
      <Navbar />

      {/* Unified Layout Container */}
      <div className="max-w-6xl mx-auto w-full px-6 py-8 md:py-10 space-y-10">
        
        {/* Sub-header Actions */}
        <div className="flex justify-between items-center w-full">
          <button onClick={() => router.push('/')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
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

         {/* Full-width title */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 font-heading leading-[1.1]">
          {safeTitle}
        </h1>

        {/* TWO-COLUMN LAYOUT on lg+: left = image/actions, right = about/similar */}
        <div className="space-y-10 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">

         {/* LEFT COLUMN */}
          <div className="space-y-8">
            {/* 2. Cover Image — natural size, no fixed box, no border/crop */}
            {imageUrl ? (
              <div className="relative w-full rounded-[24px] overflow-hidden">
                <Image 
                  src={imageUrl} 
                  alt={safeTitle} 
                  width={1200}
                  height={675}
                  className="w-full h-auto object-contain" 
                  priority 
                />
              </div>
            ) : null}

            {/* Curator name + interest label */}
            <div className="flex items-start justify-between gap-4">
              <p className="text-slate-500 font-medium text-base">by {safeOrganizer}</p>

              {/* Global Interest Label */}
            {localInterestCount > 0 ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-full animate-in fade-in duration-300">
              <span className="text-orange-500 text-lg">🔥</span>
             <p className="text-orange-700 font-bold text-sm">
              {localInterestCount} {localInterestCount === 1 ? "person is" : "people are"} interested in this event
            </p>
           </div>
           ) : null}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-4">
              <a href={safeRegistrationLink} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#6C47FF] text-white py-4 rounded-2xl font-bold text-center hover:bg-[#5835e5] transition-all flex items-center justify-center gap-2">
                Register <ExternalLink className="w-4 h-4" />
              </a>
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
                {isLoadingInterest ? <Loader2 className="w-5 h-5 animate-spin" /> : (isCuratorOrAdmin ? "Curated by you" : (isInterested ? "✓ Saved" : "Interested"))}
              </button>
            </div>

            {/* Logistics Card */}
            <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Date & Time */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Date & Time</p>
                  <p className="text-[14px] font-bold text-slate-900">{displayDate}</p>
                  <p className="text-xs text-slate-500 font-medium">{event.start_time || "TBA"}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                  {event.is_virtual ? <Globe className="w-5 h-5 text-slate-400" /> : <MapPin className="w-5 h-5 text-slate-400" />}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Location</p>
                  <p className="text-[14px] font-bold text-slate-900 truncate max-w-[200px]">
                    {event.is_virtual ? "Online Platform" : event.location}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-10">

            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">About Event</h2>
              <div className="prose prose-slate max-w-none text-slate-700 font-sans text-[16px] leading-relaxed whitespace-pre-wrap">
                {event.description}
              </div>
            </div>

           </div>

        </div>
      </div>

      {/* Similar Events — horizontal scroll, pinned above footer */}
      {similarEvents && similarEvents.length > 0 && (
        <div className="max-w-6xl mx-auto w-full px-6 pt-8 border-t border-slate-100 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Similar Events</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {similarEvents.map((simEvent) => (
              <div key={simEvent.id} className="min-w-[260px]">
                <EventCard 
                  id={simEvent.id!}
                  slug={simEvent.slug || simEvent.id!}
                  title={simEvent.title || "Untitled Event"}
                  category={simEvent.category || "General"}
                  date={simEvent.date_string || "TBA"}
                  city={simEvent.location || simEvent.city || "Online"}
                  imageUrl={simEvent.poster_url || "/window.svg"}
                  organizerName={simEvent.organizer_name || "Organizer"}
                  isFree={simEvent.is_free ?? false}
                  audience={simEvent.target_audience ?? []}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Floating Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-slate-200 z-[60] flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleInterestedClick}
          disabled={isLoadingInterest || isCuratorOrAdmin}
          className={`flex-1 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
            isCuratorOrAdmin 
              ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
              : isInterested 
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                : "bg-slate-100 text-slate-900"
          }`}
        >
          {isLoadingInterest ? <Loader2 className="w-5 h-5 animate-spin" /> : (isCuratorOrAdmin ? "Curated by you" : (isInterested ? "✓ Saved" : "Interested"))}
        </button>
        <a href={safeRegistrationLink} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#6C47FF] text-white py-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2">
          Register <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* --- THE AUTH MODAL --- */}
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
              <button 
                onClick={() => setIsAuthModalOpen(false)} 
                className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
                <Users className="w-7 h-7 text-slate-600" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900 leading-tight">Wait a second!</h3>
              <p className="text-sm text-slate-500 mt-2 mb-6 font-medium">Please sign in to save events and build your personal calendar.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsAuthModalOpen(false)} 
                  className="flex-1 bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => router.push(`/login?next=${encodeURIComponent(new URL(window.location.href).pathname)}`)} 
                  className="flex-1 bg-[#6C47FF] text-white font-bold py-3.5 rounded-xl hover:bg-[#5835e5] transition-colors"
                >
                  Sign In
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- THE SHARE MODAL --- */}
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
                <div className="relative w-full aspect-[9/16] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner mb-6">
                  <Image src={storyImageUrl} alt="Story Invite" fill className="object-cover" unoptimized />
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <button 
                    onClick={downloadStory}
                    disabled={isDownloading}
                    className="w-full bg-[#1D1D1F] hover:bg-black text-white px-6 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
                  >
                    {isDownloading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                    {isDownloading ? "Generating HQ Poster..." : "Download Story Poster"}
                  </button>

                  <button 
                    onClick={copyLink}
                    className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-6 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {isCopied ? "Link Copied!" : "Copy Event Link"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- THE REPORT MODAL --- */}
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
                  <form action={async (formData) => {
                    await submitReportAction(formData);
                    setIsReported(true);
                  }} className="flex flex-col gap-3">
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