"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { EventRow } from "@/types";
import { getCityConfig } from "@/lib/city-config";

export interface CityGridProps {
  events: Partial<EventRow>[];
}


export function CityGrid({ events }: CityGridProps) {
  // Group events by city and count them
  const cityMap = new Map<string, number>();

  events.forEach((event) => {
    const city = event.city?.trim();
    if (!city) return;
    cityMap.set(city, (cityMap.get(city) || 0) + 1);
  });

  // Sort cities: most events first, then alphabetically
  const cities = Array.from(cityMap.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  if (cities.length === 0) {
    return (
      <div className="col-span-full py-16 flex flex-col items-center justify-center text-center">
        <h3 className="text-slate-900 font-bold text-xl">No Cities Found</h3>
        <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed max-w-[380px] mx-auto">
          We couldn't find any events with a city location right now.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
     {cities.map(([city, count]) => (
        <Link
          key={city}
          href={`/cities/${city.toLowerCase().replace(/\s+/g, '-')}`}
          className="group relative flex flex-col bg-white p-3 rounded-[24px] border-[0.2px] border-transparent shadow-sm hover:-translate-y-1 transition-transform duration-500"
        >
          <div className="relative w-full aspect-video rounded-[16px] overflow-hidden bg-slate-100 shrink-0">
            <img
              src={getCityConfig(city).backgroundImage}
              alt={city}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              onError={(e) => { (e.target as HTMLImageElement).src = '/cities/default.webp'; }}
            />
          </div>

          <div className="mt-3 pr-2 flex flex-col gap-1.5 flex-1 text-left">
            <h3 className="font-bold text-[18px] leading-snug truncate text-left text-slate-900">
              {city}
            </h3>
            <span className="text-slate-500 text-[12px] font-semibold flex items-center gap-1.5">
              <CalendarDays className="w-3 h-3 text-[#6C47FF]" />
              {count} {count === 1 ? "Event" : "Events"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}