"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EventRow } from "@/types";
import { parseEventDateString } from "@/lib/utils/date";
import { EventTicket } from "./EventTicket";

const ROWS_SHOWN = 8;
const OTHER_CITIES_SHOWN = 3;
const TILE_COLOURS = ["bg-brand-primary text-white", "bg-[#FFC83D] text-[#0D0B1A]", "bg-[#0D0B1A] text-white"];

type LineupEvent = Partial<EventRow>;

function citySlug(city: string) {
  return encodeURIComponent(city.toLowerCase().replace(/\s+/g, "-"));
}

function shortDate(dateString?: string | null) {
  const parsed = dateString ? parseEventDateString(dateString) : null;
  return parsed ? parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Date soon";
}

// The programme of a festival, not a card wall: every upcoming event is one row at one size,
// and the ticket beside it shows the row you point at exactly as the app would.
export function GuestLineup({ events }: { events: LineupEvent[] }) {
  const cityCounts = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((e) => e.city && counts.set(e.city, (counts.get(e.city) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [events]);

  const [activeCity, setActiveCity] = useState<string | null>(cityCounts[0]?.[0] ?? null);
  const [focusIndex, setFocusIndex] = useState(0);
  const rows = (activeCity ? events.filter((e) => e.city === activeCity) : events).slice(0, ROWS_SHOWN);
  const activeCount = cityCounts.find(([name]) => name === activeCity)?.[1] ?? events.length;
  const otherCities = cityCounts.filter(([name]) => name !== activeCity).slice(0, OTHER_CITIES_SHOWN);
  const focused = rows[focusIndex] ?? rows[0];

  const chooseCity = (name: string) => {
    setActiveCity(name);
    setFocusIndex(0);
  };

  return (
    <section id="events" className="scroll-mt-16 bg-white px-4 sm:px-6 lg:px-10 py-24 md:py-36">
      <div className="max-w-7xl mx-auto">
        <h2 className="reveal font-heading font-black lowercase tracking-[-0.03em] leading-[0.9] text-[clamp(44px,7vw,104px)] text-[#0D0B1A]">
          what&apos;s on in {activeCity ? activeCity.toLowerCase() : "india"}
        </h2>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Choose a city">
          {cityCounts.map(([name, count]) => (
            <button
              key={name}
              type="button"
              onClick={() => chooseCity(name)}
              aria-pressed={name === activeCity}
              className={`min-h-11 rounded-full px-5 text-base font-bold transition-colors active:scale-95 ${
                name === activeCity ? "bg-[#0D0B1A] text-white" : "bg-[#F1EDFF] text-[#0D0B1A] hover:bg-[#E3DBFF]"
              }`}
            >
              {name} <span className="font-medium opacity-70">{count}</span>
            </button>
          ))}
        </div>

        <div className="mt-14 grid lg:grid-cols-12 gap-10 lg:gap-12">
          <ol key={activeCity} className="lg:col-span-8" aria-live="polite">
            {rows.map((e, i) => (
              <li
                key={e.id}
                className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both"
                style={{ animationDelay: `${i * 45}ms` }}
                onMouseEnter={() => setFocusIndex(i)}
                onFocus={() => setFocusIndex(i)}
              >
                <Link
                  href={`/events/${e.slug}`}
                  className={`group grid grid-cols-[1fr_auto] md:grid-cols-[1fr_9rem_6rem] gap-x-6 items-baseline py-4 transition-colors hover:text-brand-primary ${
                    i === focusIndex ? "lg:text-brand-primary" : "text-[#0D0B1A]"
                  }`}
                >
                  <span className="text-xl md:text-[26px] font-bold leading-snug transition-transform group-hover:translate-x-2">{e.title}</span>
                  <span className="hidden md:block text-base text-slate-600">{e.category}</span>
                  <span className="text-base md:text-lg font-bold tabular-nums text-right">{shortDate(e.date_string)}</span>
                </Link>
              </li>
            ))}
          </ol>

          {activeCity && focused && (
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-28">
                <div key={focused.id} className="h-80 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300">
                  <EventTicket event={focused} tone={focusIndex} className="-rotate-2" />
                </div>
                <p className="mt-8 text-base text-slate-700">
                  {activeCount} upcoming {activeCount === 1 ? "event" : "events"} in {activeCity}.{" "}
                  <Link href={`/cities/${citySlug(activeCity)}`} className="font-bold text-brand-primary underline-offset-4 hover:underline">
                    See them all
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {otherCities.length > 0 && (
          <div className="mt-24">
            <h3 className="reveal text-2xl md:text-3xl font-heading font-black text-[#0D0B1A]">Busy elsewhere too</h3>
            <div className={`mt-8 grid grid-cols-1 gap-4 ${otherCities.length === 1 ? "" : otherCities.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              {otherCities.map(([name, count], i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    chooseCity(name);
                    document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`reveal group flex min-h-44 flex-col justify-between rounded-[32px] p-6 text-left transition-transform hover:-translate-y-1 active:scale-[0.98] ${TILE_COLOURS[i % TILE_COLOURS.length]}`}
                >
                  <span className="font-heading text-[clamp(40px,5vw,64px)] font-black lowercase leading-[0.9] tracking-[-0.03em]">{name}</span>
                  <span className="flex items-center gap-1.5 text-base font-bold">
                    {count} {count === 1 ? "event" : "events"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
