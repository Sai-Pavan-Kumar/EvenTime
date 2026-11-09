"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Crown } from "@/components/icons";
import { animate, motion, useReducedMotion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { MIN_RANKED_SCORE } from "./useLeaderboardCohorts";
import type { LeaderboardCurator } from "./LeaderboardClient";

const POINTS_PER_EVENT = 20;
const BASE_SCORE = 100;
const ONBOARDING_BONUS = 50;

interface DockProps {
  userId: string;
  isOnboarded: boolean;
  myRank: number | null;
  myListScore: number | null;
  rival: LeaderboardCurator | null;
  viewingOtherCity: string | null;
  homeCity: string;
  onJump: () => void;
}

// The view has no row until a first approved event, so that score is worked out the same way the view does.
function useOwnScore(userId: string, isOnboarded: boolean) {
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => {
    let isCurrent = true;
    createClient()
      .from("leaderboard_view").select("et_score").eq("user_id", userId).maybeSingle()
      .then(({ data, error }) => {
        if (!isCurrent || error) return;
        setScore(data?.et_score ?? BASE_SCORE + (isOnboarded ? ONBOARDING_BONUS : 0));
      });
    return () => { isCurrent = false; };
  }, [userId, isOnboarded]);
  return score;
}

function useCountUp(target: number | null) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(0);
  const hasCounted = useRef(false);
  useEffect(() => {
    if (target === null) return;
    if (hasCounted.current || reduceMotion) {
      setShown(target);
      return;
    }
    hasCounted.current = true;
    const controls = animate(0, target, { duration: 0.5, ease: "easeOut", onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [target, reduceMotion]);
  return shown;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function LeaderboardDock({ userId, isOnboarded, myRank, myListScore, rival, viewingOtherCity, homeCity, onJump }: DockProps) {
  const ownScore = useOwnScore(userId, isOnboarded);
  const score = myListScore ?? ownScore;
  const shownScore = useCountUp(score);
  const reduceMotion = useReducedMotion();

  const needsFirstRank = !myRank && score !== null && score <= MIN_RANKED_SCORE;
  const eventsToRank = needsFirstRank ? Math.floor((MIN_RANKED_SCORE - score) / POINTS_PER_EVENT) + 1 : 0;
  const gap = rival && myListScore !== null ? Math.max(1, (rival.et_score ?? 0) - myListScore + 1) : null;

  let message = "Each approved event earns +20 ET.";
  if (myRank === 1) message = "You're in 1st place! Keep posting events to stay on top.";
  else if (rival && gap && myRank) message = `Just ${gap} ET to pass @${rival.username || rival.full_name || "user"} for #${myRank - 1}. That's ${plural(Math.ceil(gap / POINTS_PER_EVENT), "approved event")}.`;
  else if (viewingOtherCity) message = `Viewing ${viewingOtherCity}. Your home city is ${homeCity}.`;
  else if (needsFirstRank) message = `${plural(eventsToRank, "approved event")} puts you on the board.`;

  const summary = (
    <>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${myRank === 1 ? "bg-brand-primary text-white shadow-md" : "bg-slate-800 text-white border border-slate-700"}`}>
        {myRank ? `#${myRank}` : <Crown className="w-4 h-4 text-slate-400" />}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-xs sm:text-sm text-white truncate">
            {myRank ? `You · #${myRank}` : "You're not ranked yet"}
          </span>
          {score !== null && <span className="font-heading font-black text-sm text-white shrink-0 tabular-nums">{shownScore} ET</span>}
        </div>
        <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 font-medium leading-tight line-clamp-2">{message}</p>
        {needsFirstRank && (
          <div className="mt-1.5 h-1 rounded-full bg-slate-700 overflow-hidden" aria-hidden="true">
            <motion.div
              className="h-full w-full origin-left rounded-full bg-brand-primary"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: score / (score + eventsToRank * POINTS_PER_EVENT) }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }}
            />
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px)+8px)] sm:bottom-4 mt-8 mx-auto w-full max-w-2xl bg-[#0F172A] text-white rounded-2xl p-3 sm:p-4 shadow-2xl z-[105] border border-slate-700/60">
      <div className="flex items-center justify-between gap-3">
        {myRank ? (
          <button type="button" onClick={onJump} aria-label={`Jump to my rank, number ${myRank}`} className="flex items-center gap-3 min-w-0 flex-1 min-h-11 rounded-xl active:scale-[0.98] transition-transform">
            {summary}
          </button>
        ) : (
          <div className="flex items-center gap-3 min-w-0 flex-1">{summary}</div>
        )}
        <Link href="/events/new" className="hidden sm:flex items-center gap-1.5 px-3.5 min-h-11 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-bold transition-all shrink-0 active:scale-95 shadow-sm">
          Post Event <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
