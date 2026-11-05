import Link from "next/link";
import type { EventRow } from "@/types";

const TICKER_LENGTH = 12;

// A running board of real upcoming events between the poster and the list: it moves,
// and every word on it is something you can actually go to.
export function EventTicker({ events }: { events: Partial<EventRow>[] }) {
  const items = events.filter((e) => e.slug && e.title).slice(0, TICKER_LENGTH);
  if (items.length < 3) return null;

  // Two copies back to back, so sliding by exactly half loops with no visible seam.
  const loop = [...items, ...items];

  return (
    <div className="ticker group overflow-hidden bg-[#0D0B1A] py-5 md:py-6">
      <ul className="ticker-track flex w-max items-center gap-8 md:gap-12 group-hover:[animation-play-state:paused]">
        {loop.map((e, i) => (
          <li key={`${e.slug}-${i}`} aria-hidden={i >= items.length} className="flex items-center gap-8 md:gap-12">
            <Link
              href={`/events/${e.slug}`}
              tabIndex={i >= items.length ? -1 : 0}
              className="whitespace-nowrap font-heading text-2xl md:text-4xl font-black tracking-[-0.02em] text-white transition-colors hover:text-white/70"
            >
              {e.title}
            </Link>
            <span className="h-3 w-3 md:h-4 md:w-4 shrink-0 rounded-full bg-white" aria-hidden />
          </li>
        ))}
      </ul>
    </div>
  );
}
