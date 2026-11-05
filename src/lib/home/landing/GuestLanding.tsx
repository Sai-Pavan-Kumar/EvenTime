import Link from "next/link";
import type { EventRow } from "@/types";
import { StageHero } from "./StageHero";
import { EventTicker } from "./EventTicker";
import { GuestEvents } from "./GuestEvents";
import { GuestFeatures } from "./GuestFeatures";
import { TabHopping } from "./TabHopping";

const PRIMARY_BUTTON =
  "inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-8 text-lg font-bold spring-press hover:-translate-y-0.5 active:scale-95";

// Logged-out landing page. It opens on the SurfBoard stage shared with Vedhika and Boltools,
// then each chapter is one flat field of colour, set like a fest poster.
export function GuestLanding({ events }: { events: Partial<EventRow>[] }) {
  return (
    <div className="overflow-x-clip">
      <StageHero events={events} />

      <GuestEvents events={events} />

      <GuestFeatures />

      <EventTicker events={events} />

      <TabHopping />

      {/* Pale violet: sits apart from the white section above and the dark footer below. */}
      <section className="closing-band relative overflow-hidden bg-[#F1EDFF] px-4 sm:px-6 lg:px-10 py-28 md:py-40 text-center">
        <div className="closing-ink relative">
          <h2 className="font-heading font-black tracking-[-0.04em] leading-none text-[clamp(64px,11vw,168px)]">
            Going or
            <span className="closing-accent block">posting?</span>
          </h2>
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#events" className={`${PRIMARY_BUTTON} w-full max-w-xs sm:w-56 bg-brand-primary text-white`}>Browse events</a>
            <Link href="/events/new" className={`${PRIMARY_BUTTON} w-full max-w-xs sm:w-56 bg-[#0D0B1A] text-white`}>Post an event</Link>
          </div>
          <p className="mt-6 text-base">Browsing is free. Posting takes a 10-second Google sign-in.</p>
        </div>
      </section>
    </div>
  );
}
