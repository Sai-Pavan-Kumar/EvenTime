"use client";

import Link from "next/link";
import { Award, Medal, Trophy } from "@/components/icons";
import { motion, useReducedMotion } from "framer-motion";
import { BrandAvatar } from "@/components/ui/BrandAvatar";
import type { LeaderboardCurator } from "./LeaderboardClient";

// Tailwind only ships classes it can read in full, so each place spells out its own.
// Delays build suspense from third place up to the winner.
const PLACES = [
  {
    rank: 2,
    index: 1,
    delay: 0.1,
    Icon: Medal,
    avatar: "w-14 h-14 sm:w-16 sm:h-16",
    ring: "bg-slate-400 shadow-md",
    badge: "bg-slate-700",
    name: "font-bold text-xs sm:text-sm",
    score: "text-sm sm:text-base text-slate-700",
    block: "h-18 sm:h-24 from-slate-200 to-slate-100",
    number: "text-2xl sm:text-3xl text-slate-500",
  },
  {
    rank: 1,
    index: 0,
    delay: 0.2,
    Icon: Trophy,
    avatar: "w-20 h-20 sm:w-24 sm:h-24",
    ring: "bg-brand-primary shadow-lg shadow-brand-primary/25",
    badge: "bg-brand-primary",
    name: "font-extrabold text-sm sm:text-lg",
    score: "text-base sm:text-xl text-brand-primary",
    block: "h-28 sm:h-36 from-brand-primary to-brand-primary/85",
    number: "text-3xl sm:text-4xl text-white",
  },
  {
    rank: 3,
    index: 2,
    delay: 0,
    Icon: Award,
    avatar: "w-14 h-14 sm:w-16 sm:h-16",
    ring: "bg-slate-300 shadow-md",
    badge: "bg-slate-500",
    name: "font-bold text-xs sm:text-sm",
    score: "text-sm sm:text-base text-slate-700",
    block: "h-14 sm:h-18 from-slate-100 to-slate-50",
    number: "text-2xl sm:text-3xl text-slate-500",
  },
];

export function LeaderboardPodium({ topThree, reveal }: { topThree: LeaderboardCurator[]; reveal: boolean }) {
  const reduceMotion = useReducedMotion();
  const timing = (delay: number, duration: number) => (reduceMotion ? { duration: 0 } : { delay, duration, ease: "easeOut" as const });

  return (
    <div id="leaderboard-podium" className="grid grid-cols-3 items-end gap-2 sm:gap-4 md:gap-6 mb-12 px-1 max-w-xl mx-auto mt-6">
      {PLACES.map((place) => {
        const curator = topThree[place.index];
        return (
          <div key={place.rank} className="flex flex-col items-center w-full min-w-0">
            <motion.div
              className="flex flex-col items-center w-full min-w-0"
              initial={reveal ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={timing(place.delay + 0.2, 0.3)}
            >
              {curator ? (
                <>
                  <Link href={`/${curator.username || curator.user_id}`} className="relative mb-2 hover:scale-105 transition-transform">
                    <motion.div
                      className={`${place.avatar} ${place.ring} rounded-full p-0.5`}
                      initial={reveal && place.rank === 1 ? { scale: 0.7 } : false}
                      animate={{ scale: 1 }}
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 18, delay: place.delay + 0.2 }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-white">
                        <BrandAvatar seed={curator.username || curator.user_id} title={`Rank ${place.rank}`} className="h-full w-full" />
                      </div>
                    </motion.div>
                    <div className={`${place.badge} absolute -bottom-1 left-1/2 -translate-x-1/2 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs`}>
                      {place.rank}
                    </div>
                  </Link>
                  <h3 className={`${place.name} text-slate-900 truncate w-full px-1 text-center mb-0.5`}>
                    {curator.full_name || curator.username}
                  </h3>
                  <span className={`${place.score} font-heading font-black`}>{curator.et_score} ET</span>
                  <span className="text-[11px] font-medium text-slate-500 mb-2">
                    {curator.events_posted ?? 0} {curator.events_posted === 1 ? "event" : "events"}
                  </span>
                </>
              ) : (
                <Link href="/events/new" className="flex flex-col items-center w-full group">
                  <div className="relative mb-2">
                    <div className={`${place.avatar} rounded-full bg-white border-2 border-dashed border-brand-primary/40 group-hover:border-brand-primary flex items-center justify-center transition-colors`}>
                      <place.Icon className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {place.rank}
                    </div>
                  </div>
                  <h3 className={`${place.name} text-slate-900 text-center mb-0.5`}>Your spot?</h3>
                  <span className="text-[11px] font-bold text-brand-primary mb-2">Post an event</span>
                </Link>
              )}
            </motion.div>
            <motion.div
              className={`${place.block} w-full origin-bottom bg-gradient-to-t rounded-t-2xl border-t-2 border-x-2 border-white flex items-end justify-center pb-2 shadow-xs`}
              initial={reveal ? { scaleY: 0 } : false}
              animate={{ scaleY: 1 }}
              transition={timing(place.delay, 0.35)}
            >
              <span className={`${place.number} font-black`}>{place.rank}</span>
            </motion.div>
          </div>
        );
      })}
      <div className="col-span-3 h-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent rounded-full -mt-0.5" />
    </div>
  );
}
