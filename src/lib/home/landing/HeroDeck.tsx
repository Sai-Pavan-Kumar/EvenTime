"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { EventRow } from "@/types";
import { EventTicket } from "./EventTicket";

const DECK_SIZE = 4;
const DEAL_EVERY_MS = 3200;

// Resting pose of each card by its depth in the deck: the top card sits almost straight,
// the ones behind fan out so the visitor sees there is more than one thing on.
const POSES = [
  { rotate: -3, x: 0, y: 0, scale: 1 },
  { rotate: 4, x: 22, y: -14, scale: 0.94 },
  { rotate: 10, x: 42, y: -26, scale: 0.88 },
  { rotate: 15, x: 58, y: -36, scale: 0.82 },
];

// The real next few events, dealt as tickets off a pile, so the first screen is never still.
export function HeroDeck({ events }: { events: Partial<EventRow>[] }) {
  const reduceMotion = useReducedMotion();
  const deck = events.filter((e) => e.slug && e.title).slice(0, DECK_SIZE);

  const [top, setTop] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduceMotion || paused || deck.length < 2) return;
    const timer = setInterval(() => setTop((i) => (i + 1) % deck.length), DEAL_EVERY_MS);
    return () => clearInterval(timer);
  }, [reduceMotion, paused, deck.length]);

  if (deck.length === 0) return null;
  const current = deck[top];

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className="relative h-72 md:h-80">
        {deck.map((e, i) => {
          const depth = (i - top + deck.length) % deck.length;
          return (
            <motion.div
              key={e.id ?? e.slug}
              className="absolute inset-0"
              style={{ zIndex: deck.length - depth }}
              initial={false}
              animate={POSES[depth]}
              transition={{ type: "spring", stiffness: 220, damping: 26 }}
            >
              <Link href={`/events/${e.slug}`} tabIndex={depth === 0 ? 0 : -1} aria-hidden={depth !== 0} className="block h-full">
                <EventTicket event={e} tone={i} />
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 h-12" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p
            key={current.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-base font-bold text-white line-clamp-2"
          >
            Next up: {current.title}{current.city ? `, ${current.city}` : ""}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
