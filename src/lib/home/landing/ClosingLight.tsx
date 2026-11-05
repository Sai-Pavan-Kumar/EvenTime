"use client";

import { useEffect, useRef } from "react";
import { createStageLight } from "./stage-light";
import { clamp01, windowProgress } from "./scroll-windows";

// Fully lit once the band's top has travelled this share of the viewport, as on Boltools.
const REVEAL_TRAVEL = 0.6;
// Lit from this reveal on, the band's words switch to light ink, as in the hero.
const INK_LIGHT_FROM_REVEAL = 0.6;

// The page ends the way it begins: the same ticket of light opens behind the last call to action.
export function ClosingLight() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const band = canvas.parentElement!;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let light = null as ReturnType<typeof createStageLight>;
    try {
      light = createStageLight(canvas);
    } catch (error) {
      console.error("Closing light failed.", error);
    }
    const setReveal = (value: number) => {
      light?.setReveal(value);
      band.style.setProperty("--band-reveal", String(value));
      band.classList.toggle("is-lit", value >= INK_LIGHT_FROM_REVEAL);
    };
    band.classList.toggle("no-webgl", !light);
    if (reduceMotion) {
      setReveal(1);
      return () => light?.destroy();
    }

    const update = () => {
      const travelled = (window.innerHeight - band.getBoundingClientRect().top) / (window.innerHeight * REVEAL_TRAVEL);
      setReveal(windowProgress(clamp01(travelled), [0, 1]));
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", update);
      light?.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} className="closing-canvas absolute inset-0 h-full w-full" aria-hidden />;
}
