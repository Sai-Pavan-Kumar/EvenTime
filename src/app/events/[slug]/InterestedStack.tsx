"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { BrandAvatar } from "@/components/ui/BrandAvatar";

const MAX_FACES = 3;
const SPARK_ANGLES = [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
const SPARK_DISTANCE_NEAR = 34;
const SPARK_DISTANCE_FAR = 52;
const HAPTIC_TAP_MS = 15;

type InterestedAvatar = { username: string | null };

export function InterestedStack({
  avatars,
  selfSeed,
  isInterested,
}: {
  avatars: InterestedAvatar[];
  selfSeed: string | null | undefined;
  isInterested: boolean;
}) {
  const reduceMotion = useReducedMotion();
  // The cached list may already hold the viewer, and one person must never appear twice.
  const others = avatars.filter((avatar) => avatar.username !== selfSeed).map((avatar) => avatar.username);
  const faces = (isInterested ? [selfSeed, ...others] : others).slice(0, MAX_FACES);
  if (faces.length === 0) return null;

  return (
    <div className="flex shrink-0 -space-x-2" aria-hidden="true">
      <AnimatePresence initial={false} mode="popLayout">
        {faces.map((seed, index) => (
          <motion.div
            key={seed ?? `face-${index}`}
            layout={!reduceMotion}
            initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            // The third face drops on narrow phones, where the row has no room to spare.
            className={`h-8 w-8 overflow-hidden rounded-full ring-2 ring-white ${index === 2 ? "hidden min-[400px]:block" : ""}`}
          >
            <BrandAvatar seed={seed} className="h-full w-full" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Remounted through its key on every new interest, so it plays once per tap.
function InterestBurst() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <motion.span
        className="absolute inset-0 rounded-xl border-2 border-brand-primary"
        initial={{ scale: 1, opacity: 0.7 }}
        animate={{ scale: 1.18, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {SPARK_ANGLES.map((angle, index) => {
        const radians = (angle * Math.PI) / 180;
        const distance = index % 2 === 0 ? SPARK_DISTANCE_FAR : SPARK_DISTANCE_NEAR;
        return (
          <motion.span
            key={angle}
            className={`absolute h-1.5 w-1.5 rounded-full ${index % 2 === 0 ? "bg-brand-primary" : "bg-purple-300"}`}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{ x: Math.cos(radians) * distance, y: Math.sin(radians) * distance, scale: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        );
      })}
    </span>
  );
}

export function InterestButton({
  isOwner,
  isInterested,
  burstCount,
  onClick,
  disabled,
  className,
}: {
  isOwner: boolean;
  isInterested: boolean;
  burstCount: number;
  onClick: () => void;
  disabled: boolean;
  className: string;
}) {
  const reduceMotion = useReducedMotion();
  const controls = useAnimationControls();

  useEffect(() => {
    if (burstCount === 0 || reduceMotion) return;
    controls.start({ scale: [0.92, 1.08, 1], transition: { duration: 0.42, ease: "easeOut" } });
    navigator.vibrate?.(HAPTIC_TAP_MS);
  }, [burstCount, reduceMotion, controls]);

  return (
    <motion.button animate={controls} onClick={onClick} disabled={disabled} className={`relative ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={isInterested ? "interested" : "idle"}
          className="flex items-center gap-1.5"
          initial={reduceMotion ? false : { y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: -10, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {isOwner ? "Host" : isInterested ? <><Check className="h-4 w-4" strokeWidth={3} /> Interested</> : "I'm Interested"}
        </motion.span>
      </AnimatePresence>
      {burstCount > 0 && !reduceMotion && <InterestBurst key={burstCount} />}
    </motion.button>
  );
}
