"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { ArrowRight } from "lucide-react";
import { createStageLight } from "./stage-light";
import type { EventRow } from "@/types";
import { EventGrid } from "@/lib/home/EventGrid";
import { BEAT_SHIFT_PX, CARD_SPAN, CARD_STAGGER, CTA_SHIFT_PX, HERO_WINDOWS, INK_LIGHT_FROM_REVEAL, LENIS_OPTIONS, clamp01, windowProgress } from "./scroll-windows";

const BUTTON =
  "inline-flex min-h-12 sm:min-h-14 items-center justify-center gap-2 rounded-full px-6 sm:px-8 text-base sm:text-lg font-bold spring-press hover:-translate-y-0.5 active:scale-95";

const CARDS_SHOWN = 4;
// The real card holds its layout at this width, so the row is scaled rather than reflowed.
const CARD_SIZE_PX = 300;
const CARD_GAP_PX = 20;
const WORDS_TO_CARDS_GAP_PX = 40;
const STAGE_EDGE_PX = 20;
const FOUR_CARDS_FROM_PX = 1100;
const PHONE_BELOW_PX = 640;
// A phone shows one card large with its neighbours running off the edges.
const PHONE_CARD_WIDTH_SHARE = 0.72;
// Below this the card's text is too small to read, so the row stays away.
const MIN_CARD_SCALE = 0.6;

function fitCards(track: HTMLElement, ink: HTMLElement, words: HTMLElement) {
  const screenWidth = window.innerWidth;
  const columns = screenWidth >= FOUR_CARDS_FROM_PX ? 4 : 3;
  const rowWidth = columns * CARD_SIZE_PX + (columns - 1) * CARD_GAP_PX;
  const widthScale = screenWidth < PHONE_BELOW_PX ? (screenWidth * PHONE_CARD_WIDTH_SHARE) / CARD_SIZE_PX : (screenWidth - 2 * STAGE_EDGE_PX) / rowWidth;

  const inkBottom = ink.clientHeight - parseFloat(getComputedStyle(ink).paddingBottom);
  const wordsHeight = words.offsetHeight;
  const heightLeft = inkBottom - wordsHeight - WORDS_TO_CARDS_GAP_PX - 2 * STAGE_EDGE_PX;
  const scale = Math.min(1, widthScale, heightLeft / CARD_SIZE_PX);

  const hasCards = scale >= MIN_CARD_SCALE;
  const blockHeight = wordsHeight + WORDS_TO_CARDS_GAP_PX + CARD_SIZE_PX * scale;
  const wordsTop = (inkBottom - blockHeight) / 2;
  track.classList.toggle("no-cards", !hasCards);
  track.style.setProperty("--card-columns", String(columns));
  track.style.setProperty("--card-scale", String(scale));
  track.style.setProperty("--cards-top", `${wordsTop + wordsHeight + WORDS_TO_CARDS_GAP_PX}px`);
  track.style.setProperty("--words-lift", hasCards ? `${words.offsetTop - wordsTop}px` : "0px");
}

// One card per category first, so the row shows the range of events instead of the same poster twice.
function pickHeroCards(events: Partial<EventRow>[]) {
  const listed = events.filter((e) => e.slug && e.title);
  const firstOfEachCategory = listed.filter((e, i) => listed.findIndex((other) => other.category === e.category) === i);
  const others = listed.filter((e) => !firstOfEachCategory.includes(e));
  return [...firstOfEachCategory, ...others].slice(0, CARDS_SHOWN);
}

function heroProgress(track: HTMLElement, pin: HTMLElement) {
  // The pin's height, not innerHeight: a phone's browser bars change innerHeight mid-scroll.
  const travel = track.offsetHeight - pin.offsetHeight;
  return travel > 0 ? clamp01((window.scrollY - track.offsetTop) / travel) : 1;
}

// The SurfBoard stage: the headline holds still while the page scrolls, a ticket of light
// opens behind it, and the second line, the button and real events arrive once it has taken the screen.
export function StageHero({ events }: { events: Partial<EventRow>[] }) {
  const cards = pickHeroCards(events);
  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current!;
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let light = null as ReturnType<typeof createStageLight>;
    try {
      light = createStageLight(canvasRef.current!);
    } catch (error) {
      console.error("Stage light failed, using CSS fallback.", error);
    }
    track.classList.toggle("no-webgl", !light);
    root.classList.add("stage-active");

    const frameAt = (p: number) => {
      const reveal = windowProgress(p, HERO_WINDOWS.reveal);
      const beat1 = windowProgress(p, HERO_WINDOWS.beat1Out);
      const beat2 = windowProgress(p, HERO_WINDOWS.beat2In);
      const cta = windowProgress(p, HERO_WINDOWS.cta);
      light?.setReveal(reveal);
      track.style.setProperty("--reveal", String(reveal));
      track.style.setProperty("--beat1-opacity", String(1 - beat1));
      track.style.setProperty("--beat1-shift", `${-BEAT_SHIFT_PX * beat1}px`);
      track.style.setProperty("--beat2-opacity", String(beat2));
      track.style.setProperty("--beat2-shift", `${BEAT_SHIFT_PX * (1 - beat2)}px`);
      track.style.setProperty("--cta-opacity", String(cta));
      track.style.setProperty("--cta-shift", `${CTA_SHIFT_PX * (1 - cta)}px`);
      const cardsP = clamp01((p - HERO_WINDOWS.cards[0]) / (HERO_WINDOWS.cards[1] - HERO_WINDOWS.cards[0]));
      track.style.setProperty("--words-up", String(windowProgress(cardsP, [0, CARD_SPAN])));
      for (let i = 0; i < CARDS_SHOWN; i++) {
        const start = i * CARD_STAGGER;
        track.style.setProperty(`--card-${i}`, String(windowProgress(cardsP, [start, start + CARD_SPAN])));
      }
      if (cardsRef.current) cardsRef.current.inert = cardsP < CARD_SPAN;
      track.style.setProperty("--exit-opacity", String(windowProgress(p, HERO_WINDOWS.exitFeather)));
      track.classList.toggle("is-lit", reveal >= INK_LIGHT_FROM_REVEAL);
      // The navbar stays out of the poster and arrives with the event list.
      const navShown = windowProgress(p, HERO_WINDOWS.exitFeather);
      root.style.setProperty("--stage-nav", String(navShown));
      root.classList.toggle("stage-nav-live", navShown > 0.5);
      if (ctaRef.current) ctaRef.current.inert = cta < 0.5;
    };

    if (reduceMotion) {
      // No pinning, no smooth scroll: the stage simply shows its finished state.
      track.classList.add("is-static");
      frameAt(0.75);
      track.style.setProperty("--beat1-opacity", "1");
      track.style.setProperty("--beat1-shift", "0px");
      return () => {
        light?.destroy();
        root.classList.remove("stage-active", "stage-nav-live");
      };
    }

    const lenis = new Lenis(LENIS_OPTIONS);
    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });
    const update = () => frameAt(heroProgress(track, pinRef.current!));
    // A returning user's feed replaces this hero right after hydration, so a queued call can outlive it.
    const fit = () => {
      if (inkRef.current && wordsRef.current) fitCards(track, inkRef.current, wordsRef.current);
    };
    const onResize = () => {
      fit();
      update();
    };
    lenis.on("scroll", update);
    window.addEventListener("resize", onResize);
    onResize();
    // The display font changes how the words wrap, so measure again once it arrives.
    document.fonts.ready.then(fit);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.removeEventListener("resize", onResize);
      light?.destroy();
      root.classList.remove("stage-active", "stage-nav-live");
      root.style.removeProperty("--stage-nav");
    };
  }, []);

  return (
    <section ref={trackRef} className="stage-track relative h-[240vh] bg-white" aria-label="EvenTime">
      {/* lvh: the stage stays as tall as the screen with the browser bars hidden, so hiding them
          on scroll never uncovers a gap. The content keeps to svh, the part always visible. */}
      <div ref={pinRef} className="stage-pin sticky top-0 h-[100lvh] overflow-hidden">
        <canvas ref={canvasRef} className="stage-canvas absolute inset-0 h-full w-full" aria-hidden />
        <div className="stage-fallback absolute inset-0" aria-hidden />

        <div className="stage-safe absolute inset-x-0 top-0 z-20 h-[100svh]">
        {/* The bottom padding keeps the words clear of the phone's tab bar. */}
        <div ref={inkRef} className="stage-ink relative z-20 grid h-full place-items-center px-4 pb-16 sm:px-6 sm:pb-0 text-center">
          <h1 className="col-start-1 row-start-1 stage-beat1 font-heading font-black tracking-[-0.04em] leading-[0.88] text-[clamp(52px,min(11vw,17svh),168px)]">
            The directory
            <span className="block">for events.</span>
          </h1>

          <div ref={wordsRef} className="col-start-1 row-start-1 stage-beat2 max-w-5xl">
            <p className="font-heading font-black tracking-[-0.04em] leading-[0.9] text-[clamp(44px,min(8.4vw,13svh),128px)]">
              Every event in your city. <span className="whitespace-nowrap">One list.</span>
            </p>
            <p className="mx-auto mt-4 sm:mt-5 max-w-xl text-balance text-base sm:text-lg md:text-xl font-medium opacity-90">Hackathons, meetups, conferences and college fests. Free to browse.</p>
            <div ref={ctaRef} className="stage-cta mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-3">
              <a href="#events" className={`${BUTTON} bg-white text-[#0D0B1A]`}>
                Browse events <ArrowRight className="w-5 h-5" />
              </a>
              <Link href="/events/new" className="min-h-11 inline-flex items-center text-base sm:text-lg font-bold underline underline-offset-[6px] decoration-2 hover:decoration-white/60">
                Post an event
              </Link>
            </div>
          </div>
        </div>

        <div ref={cardsRef} className="pointer-events-none absolute inset-0 z-30">
          <EventGrid events={cards} profile={null} user={null} gridClass="stage-cards" />
        </div>
        </div>

        <div className="stage-exit pointer-events-none absolute inset-0 z-30 bg-white" aria-hidden />
      </div>
    </section>
  );
}
