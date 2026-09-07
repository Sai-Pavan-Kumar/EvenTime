"use client";

import React, { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Calendar, MapPin, Share2, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export interface CelebrationEventData {
  id?: string;
  slug?: string;
  title: string;
  category: string;
  dateString: string;
  city: string;
  location?: string;
  posterUrl?: string | null;
  status: "approved" | "pending";
  isTrusted?: boolean;
}

interface CuratorCelebrationModalProps {
  isOpen: boolean;
  event: CelebrationEventData | null;
  onClose: () => void;
  onViewEvent?: (slug?: string) => void;
}

export function CuratorCelebrationModal({
  isOpen,
  event,
  onClose,
  onViewEvent,
}: CuratorCelebrationModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !event) return null;

  const isLive = event.status === "approved";
  const eventUrl = "https://eventime.thesurfboard.in/events/" + (event.slug || event.id || "");

  const handleWhatsAppShare = () => {
    const message = 'Check out "' + event.title + '" on EvenTime!\n\n📅 ' + event.dateString + '\n📍 ' + (event.city || "Online") + '\n\nView details & register here:\n' + eventUrl;
    const whatsappUrl = "https://api.whatsapp.com/send?text=" + encodeURIComponent(message);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      toast.success("Event link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy link.");
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Festive floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              top: (20 + (i * 13) % 60) + "%",
              left: (10 + (i * 17) % 80) + "%",
              width: (4 + (i % 4) * 2) + "px",
              height: (4 + (i % 4) * 2) + "px",
              backgroundColor: ["#6C47FF", "#10B981", "#38BDF8", "#F59E0B", "#EC4899"][i % 5],
            }}
          />
        ))}
      </div>

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 text-center z-10">
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
          <CheckCircle2 className="w-8 h-8" strokeWidth={2.4} />
        </div>

        {/* Headline & Subtitle matching app */}
        <h3 className="font-heading font-extrabold text-2xl text-slate-900 mb-1">
          {isLive ? "Your Event is Live!" : "Event Submitted!"}
        </h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6">
          {isLive
            ? "Your event has been published and is now live on EvenTime."
            : "Your event was submitted and will be reviewed shortly."}
        </p>

        {/* Event Ticket Preview Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex items-center gap-4 text-left mb-6 shadow-inner">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-purple-100 shrink-0 border border-slate-200">
            {event.posterUrl ? (
              <Image
                src={event.posterUrl}
                alt={event.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#6C47FF] font-black text-xl">
                ET
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-block text-[10px] font-bold text-[#6C47FF] bg-purple-50 px-2 py-0.5 rounded-md uppercase tracking-wider mb-1">
              {event.category || "Event"}
            </span>
            <h4 className="font-bold text-slate-900 text-sm truncate mb-1">
              {event.title}
            </h4>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {event.dateString}
              </span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-slate-400" />
                {event.city || "Online"}
              </span>
            </div>
          </div>
        </div>

        {/* 1-Click WhatsApp Share Button matching app */}
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="w-full py-3.5 px-4 mb-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-[#25D366]/25 transition-all active:scale-95"
        >
          <Share2 className="w-4 h-4" />
          Share on WhatsApp
        </button>

        {/* Copy Link Button */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full py-2.5 px-4 mb-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          {copied ? "Link Copied!" : "Copy Event Link"}
        </button>

        {/* Primary Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-full transition-colors"
          >
            Explore Feed
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onViewEvent) onViewEvent(event.slug || event.id);
            }}
            className="flex-1 py-3 bg-brand-primary hover:bg-brand-hover text-white font-bold text-sm rounded-full shadow-md shadow-brand-primary/20 transition-all active:scale-95"
          >
            View Live Event
          </button>
        </div>
      </div>
    </div>
  );
}
