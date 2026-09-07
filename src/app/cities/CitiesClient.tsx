"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, CalendarDays, Plus, MapPin } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { CITIES } from "@/lib/constants/cities";
import { getCityConfig } from "@/lib/city-config";

interface CitiesClientProps {
  initialCityCounts: Record<string, number>;
}

export function CitiesClient({ initialCityCounts }: CitiesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Construct active cities list matching mobile app logic
  const activeCityList = useMemo(() => {
    // 1. Gather all unique cities that appear in either CITIES constant or initialCityCounts
    const allKnownCities = Array.from(
      new Set([...CITIES, ...Object.keys(initialCityCounts)])
    );

    return allKnownCities
      .map((name) => ({
        name,
        count: initialCityCounts[name] || 0,
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => {
        // Online first if it has events
        if (a.name.toLowerCase() === "online" && a.count > 0) return -1;
        if (b.name.toLowerCase() === "online" && b.count > 0) return 1;

        // Higher count first
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
  }, [initialCityCounts]);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return activeCityList;
    return activeCityList.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [activeCityList, searchQuery]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-16">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8 md:py-12 space-y-8">
        {/* Header matching mobile app verbatim */}
        <div className="space-y-4 max-w-2xl">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-heading tracking-tight">
              Explore by City
            </h1>
            <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed">
              Discover upcoming conferences, hackathons & meetups happening in active cities
            </p>
          </div>

          {/* Search input matching mobile app */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search active city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              maxLength={50}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Cities Grid */}
        {filteredCities.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredCities.map((item) => {
              const config = getCityConfig(item.name);
              const imageSrc = config.coverImage || config.backgroundImage || "/cities/covers/default1.webp";

              return (
                <Link
                  key={item.name}
                  href={`/cities/${encodeURIComponent(item.name.toLowerCase().replace(/\s+/g, "-"))}`}
                  className="group relative aspect-4/3 rounded-2xl md:rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 border border-slate-100 hover:-translate-y-1"
                >
                  <Image
                    src={imageSrc}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-3.5 md:p-4 flex flex-col justify-end space-y-1.5">
                    <h3 className="text-white font-extrabold text-base md:text-lg font-heading drop-shadow-sm truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 backdrop-blur-xs rounded-lg text-brand-primary text-xs font-bold w-fit shadow-xs">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>
                        {item.count} {item.count === 1 ? "Event" : "Events"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty State matching mobile app verbatim */
          <div className="py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="relative w-48 h-48 mb-4">
              <Image
                src="/illustrations/search_state.webp"
                alt="No active events"
                fill
                className="object-contain"
              />
            </div>
            <h3 className="text-slate-900 font-bold text-xl font-heading">
              No active events in this city
            </h3>
            <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed">
              {searchQuery
                ? `No upcoming events found for "${searchQuery}". Check upcoming events on the home page.`
                : "No cities currently have upcoming events scheduled. Be the first to host one!"}
            </p>
            <Link
              href="/events/new"
              className="mt-6 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-[#5835e5] transition-all text-sm shadow-sm active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Host An Event in Your City
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
