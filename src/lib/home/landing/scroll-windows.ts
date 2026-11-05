// SurfBoard house timings, identical to Vedhika and Boltools so every product scrolls with
// the same rhythm. Values are shares of the pinned hero's scroll travel (0..1).
export const HERO_WINDOWS = {
  reveal: [0.0, 0.26],
  beat1Out: [0.32, 0.46],
  beat2In: [0.38, 0.52],
  cta: [0.44, 0.58],
  // EvenTime's own beat, between the button and the exit: real events pop in around the words.
  cards: [0.5, 0.74],
  exitFeather: [0.82, 1.0],
} as const;

// Each card gets this share of the cards window, starting a step after the one before.
export const CARD_STAGGER = 0.1;
export const CARD_SPAN = 0.5;

export const BEAT_SHIFT_PX = 20;
export const CTA_SHIFT_PX = 24;
// Ink flips to white only once the light fully covers the words, so a parked scroll never leaves grey text.
export const INK_LIGHT_FROM_REVEAL = 0.6;

const smoothstep = (x: number) => x * x * (3 - 2 * x);
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function windowProgress(p: number, [start, end]: readonly [number, number]) {
  return smoothstep(clamp01((p - start) / (end - start)));
}

// Same exponential ease and multipliers as the sister sites.
export const LENIS_OPTIONS = {
  duration: 1.1,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 0.95,
  touchMultiplier: 1.5,
  anchors: true,
};
