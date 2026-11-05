"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BrandAvatar } from "@/components/ui/BrandAvatar";

const MAX_IDS_PER_REQUEST = 24;
const SUMMARY_ENDPOINT = "/api/events/interested-faces";

type FaceSeed = string | null;
export type InterestSummary = { count: number; faces: FaceSeed[] };

// Shared across cards: a feed of 20 cards must cost one request, not 20.
let queuedIds: string[] = [];
let queuedResolvers = new Map<string, (summary: InterestSummary | null) => void>();

function flushQueue() {
  const ids = queuedIds;
  const resolvers = queuedResolvers;
  queuedIds = [];
  queuedResolvers = new Map();

  for (let start = 0; start < ids.length; start += MAX_IDS_PER_REQUEST) {
    const batch = ids.slice(start, start + MAX_IDS_PER_REQUEST);
    fetch(`${SUMMARY_ENDPOINT}?ids=${batch.join(",")}`)
      .then((response) => (response.ok ? response.json() : {}))
      .catch(() => ({}))
      .then((summaries: Record<string, InterestSummary>) => {
        batch.forEach((id) => resolvers.get(id)?.(summaries[id] ?? null));
      });
  }
}

function loadSummary(eventId: string): Promise<InterestSummary | null> {
  return new Promise((resolve) => {
    if (queuedIds.length === 0) setTimeout(flushQueue, 0);
    if (!queuedResolvers.has(eventId)) queuedIds.push(eventId);
    const earlier = queuedResolvers.get(eventId);
    queuedResolvers.set(eventId, (summary) => {
      earlier?.(summary);
      resolve(summary);
    });
  });
}

// Null until loaded, and stays null on failure so the card keeps the count it already has.
export function useInterestSummary(eventId: string) {
  const [summary, setSummary] = useState<InterestSummary | null>(null);

  useEffect(() => {
    let isCurrent = true;
    loadSummary(eventId).then((loaded) => {
      if (isCurrent) setSummary(loaded);
    });
    return () => {
      isCurrent = false;
    };
  }, [eventId]);

  return summary;
}

export function CardInterestFaces({ faces }: { faces: FaceSeed[] }) {
  const reduceMotion = useReducedMotion();
  if (faces.length === 0) return null;

  return (
    <span className="flex -space-x-1.5" data-interest-faces aria-hidden="true">
      {faces.map((seed, index) => (
        <motion.span
          key={seed ?? `face-${index}`}
          initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22, delay: index * 0.05 }}
          // The third face drops on narrow phones, where the row shares its width with the save and share buttons.
          className={`h-5 w-5 overflow-hidden rounded-full ring-2 ring-white ${index === 2 ? "hidden min-[400px]:block" : "block"}`}
        >
          <BrandAvatar seed={seed} className="h-full w-full" />
        </motion.span>
      ))}
    </span>
  );
}
