"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BrandAvatar } from "@/components/ui/BrandAvatar";
import type { LeaderboardCurator } from "./LeaderboardClient";

// Past this many rows the stagger only delays content the visitor is waiting to read
const MAX_STAGGERED_ROWS = 8;

interface ListProps {
  title: string;
  total: number;
  curators: LeaderboardCurator[];
  userId?: string;
  isHighlighted: boolean;
}

export function LeaderboardList({ title, total, curators, userId, isHighlighted }: ListProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-slate-900 font-heading">{title}</h2>
        <span className="text-xs font-bold text-slate-500">{total} Curators</span>
      </div>

      <div className="divide-y divide-slate-100">
        {curators.map((curator, index) => {
          const rank = curator.rank ?? index + 4;
          const isMe = userId === curator.user_id;
          const profileHref = `/${curator.username || curator.user_id}`;
          const name = curator.full_name || curator.username || "Curator";

          return (
            <motion.div
              key={curator.user_id}
              id={isMe ? "my-rank" : undefined}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut", delay: Math.min(index, MAX_STAGGERED_ROWS) * 0.03 }}
              className={`grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 p-3.5 sm:p-4 items-center transition-colors ${
                isMe ? "bg-purple-50/70 border-l-4 border-brand-primary" : "hover:bg-slate-50"
              } ${isMe && isHighlighted ? "ring-2 ring-inset ring-brand-primary" : ""}`}
            >
              <div className="w-8 sm:w-10 text-center font-heading font-bold text-base sm:text-lg text-slate-500">#{rank}</div>

              <div className="flex items-center gap-3 min-w-0">
                <Link href={profileHref} aria-label={name} className="w-11 h-11 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-white hover:opacity-80 transition-opacity">
                  <BrandAvatar seed={curator.username || curator.user_id} title={name} className="h-full w-full" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={profileHref} className="font-bold text-slate-900 text-sm hover:text-brand-primary transition-colors truncate">
                      {name}
                    </Link>
                    {isMe && <span className="bg-brand-primary text-white text-[9px] font-black px-1.5 rounded-md shrink-0">YOU</span>}
                  </div>
                  {curator.college && <p className="text-xs text-slate-500 truncate mt-0.5">{curator.college}</p>}
                </div>
              </div>

              <div className="text-right pr-2">
                <span className="font-heading font-black text-slate-900 text-lg sm:text-xl">{curator.et_score}</span>
                <span className="text-[10px] font-bold text-slate-500 block -mt-1">ET</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const HOW_TO_STEPS = [
  { title: "Post an event", detail: "Share an event people near you should know about." },
  { title: "Get it approved", detail: "Each approved event earns +20 ET." },
  { title: "Get people interested", detail: "Each unique save or interest earns +10 ET." },
];

export function LeaderboardHowTo() {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-extrabold text-slate-900 font-heading mb-4 text-center">How to get on the board</h2>
      <ol className="grid gap-4 sm:grid-cols-3">
        {HOW_TO_STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-black flex items-center justify-center shrink-0">{index + 1}</span>
            <div>
              <p className="text-sm font-bold text-slate-900">{step.title}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
