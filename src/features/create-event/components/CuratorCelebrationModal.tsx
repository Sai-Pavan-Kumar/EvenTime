"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { format, parseISO, isValid } from "date-fns";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, Check, Copy, MapPin, Plus, Share2, X } from "@/components/icons";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getCategoryConfig } from "@/lib/category-config";

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
  onPostAnother?: () => void;
}

const CONFETTI_COUNT = 36;
const CONFETTI_COLORS = ["#6C47FF", "#A78BFA", "#38BDF8", "#EC4899", "#FFFFFF"];
const TICKET_LAND_DELAY_S = 0.32;
const STAMP_DELAY_S = 0.62;
const COPIED_RESET_MS = 2500;
const STAMP_HAPTIC_MS = 18;

function ordinal(count: number) {
  const lastTwo = count % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? "th" : ["th", "st", "nd", "rd"][count % 10] ?? "th";
  return `${count}${suffix}`;
}

function readableDate(dateString: string) {
  const parsed = parseISO(dateString);
  return isValid(parsed) ? format(parsed, "EEE, d MMM yyyy") : dateString;
}

// Fixed spread rather than random: server and client agree, and every poster gets the same crafted burst.
function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
      {Array.from({ length: CONFETTI_COUNT }, (_, i) => {
        const angle = (i / CONFETTI_COUNT) * Math.PI * 2;
        const reach = 170 + ((i * 53) % 230);
        return (
          <motion.span
            key={i}
            className="absolute rounded-[2px]"
            style={{ width: 6 + (i % 3) * 2, height: 10 + (i % 4) * 2, backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * reach,
              y: [0, Math.sin(angle) * reach, Math.sin(angle) * reach + 240],
              opacity: [0, 1, 1, 0],
              rotate: 180 + i * 47,
            }}
            transition={{ delay: STAMP_DELAY_S, duration: 1.5, ease: [0.12, 0.75, 0.35, 1] }}
          />
        );
      })}
    </div>
  );
}

export function CuratorCelebrationModal({ isOpen, event, onClose, onViewEvent, onPostAnother }: CuratorCelebrationModalProps) {
  const [copied, setCopied] = useState(false);
  const [postedCount, setPostedCount] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const viewButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    viewButtonRef.current?.focus({ preventScroll: true });
    const closeOnEscape = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    const stampHaptic = reduceMotion ? undefined : setTimeout(() => navigator.vibrate?.(STAMP_HAPTIC_MS), STAMP_DELAY_S * 1000);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      clearTimeout(stampHaptic);
    };
  }, [isOpen, onClose, reduceMotion]);

  // Seeing the number climb is the nudge to post again. It's only decoration, so a failed count just hides it.
  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { count } = await supabase.from("events").select("id", { count: "exact", head: true }).eq("creator_id", user.id).neq("status", "deleted");
      if (isCurrent && count) setPostedCount(count);
    });
    return () => {
      isCurrent = false;
    };
  }, [isOpen]);

  if (!isOpen || !event) return null;

  const isLive = event.status === "approved";
  const eventUrl = "https://eventime.thesurfboard.in/events/" + (event.slug || event.id || "");
  const place = event.city === "online" ? "Online" : event.city || "Online";
  const dateLabel = readableDate(event.dateString);

  const handleWhatsAppShare = () => {
    const message = `Check out "${event.title}" on EvenTime!\n\n${dateLabel}\n${place}\n\nView details & register here:\n${eventUrl}`;
    window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch {
      toast.error("Could not copy link.");
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={isLive ? "Your event is live" : "Your event was sent for review"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-[#1A1040] p-4"
    >
      {isLive && !reduceMotion && <ConfettiBurst />}

      <button type="button" aria-label="Close" onClick={onClose} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white">
        <X className="h-5 w-5" />
      </button>

      <div className="relative z-10 w-full max-w-sm py-4">
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="mb-1 text-center font-heading text-4xl font-bold tracking-[-0.03em] text-white"
        >
          {isLive ? "You're live." : "Sent for review."}
        </motion.h2>
        <motion.p
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mb-6 text-center text-sm text-white/70"
        >
          {isLive ? "People can find your event right now. Send it to one group and get your first interested people." : "We'll publish it as soon as an admin approves it."}
        </motion.p>

        {/* The ticket is the reward: the thing the poster just made, handed back to them and stamped. */}
        <motion.div
          initial={reduceMotion ? false : { y: 90, rotate: -5, scale: 0.86, opacity: 0 }}
          animate={{ y: 0, rotate: 0, scale: 1, opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : TICKET_LAND_DELAY_S - 0.2, type: "spring", stiffness: 240, damping: 20 }}
          className="relative rounded-lg bg-white"
        >
          <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg bg-brand-primary">
            <Image src={event.posterUrl || getCategoryConfig(event.category).backgroundImage} alt="" fill sizes="384px" className="object-cover" />
            <motion.span
              initial={reduceMotion ? false : { scale: 2.6, rotate: 6, opacity: 0 }}
              animate={{ scale: 1, rotate: -8, opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : STAMP_DELAY_S, type: "spring", stiffness: 520, damping: 22 }}
              className={`absolute right-4 top-4 rounded-md border-[3px] bg-white px-3 py-1 font-heading text-lg font-bold tracking-wide ${isLive ? "border-brand-primary text-brand-primary" : "border-slate-500 text-slate-600"}`}
            >
              {isLive ? "LIVE" : "IN REVIEW"}
            </motion.span>
          </div>

          <div className="relative border-t-2 border-dashed border-slate-200 p-4">
            {/* Punched notches sit on the tear line, in the colour of the scrim behind the ticket. */}
            <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-[#1A1040]" aria-hidden />
            <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-[#1A1040]" aria-hidden />
            <h3 className="line-clamp-2 font-heading text-lg font-bold leading-snug text-slate-900">{event.title}</h3>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-600">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" />{dateLabel}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{place}</span>
            </div>
            {postedCount !== null && (
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm font-bold text-brand-primary">
                {postedCount === 1 ? "Your first event on EvenTime" : `Your ${ordinal(postedCount)} event on EvenTime`}
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : STAMP_DELAY_S + 0.25, duration: 0.3 }}
          className="mt-5 space-y-2"
        >
          <button ref={viewButtonRef} type="button" onClick={handleWhatsAppShare} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-slate-900 transition-transform active:scale-[0.98]">
            <Share2 className="h-4 w-4" /> Share on WhatsApp
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onViewEvent?.(event.slug || event.id)} className="flex min-h-12 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white transition-colors hover:bg-white/15">
              View event
            </button>
            <button type="button" onClick={handleCopyLink} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-white/10 text-sm font-semibold text-white transition-colors hover:bg-white/15">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <button type="button" onClick={onPostAnother} className="flex min-h-12 w-full items-center justify-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white">
            <Plus className="h-4 w-4" /> Post another event
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
