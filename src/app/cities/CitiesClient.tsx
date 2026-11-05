"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Plus, MapPin } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { CITIES } from "@/lib/constants/cities";
import { getCityConfig } from "@/lib/city-config";
import { useAuth } from "@/context/AuthContext";
import { ONLINE_CITY, cityLabel } from "./cityEvents";

const ABOVE_FOLD_TILES = 4;

interface CitiesClientProps {
  initialCityCounts: Record<string, number> | null;
}

export function CitiesClient({ initialCityCounts }: CitiesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { profile } = useAuth();
  const cityCounts = useMemo(() => initialCityCounts ?? {}, [initialCityCounts]);
  const myCities = useMemo(
    () => new Set((profile?.preferred_cities ?? []).map((city) => city.toLowerCase())),
    [profile?.preferred_cities]
  );

  // Construct active cities list matching mobile app logic
  const activeCityList = useMemo(() => {
    // 1. Gather all unique cities that appear in either CITIES constant or initialCityCounts
    const allKnownCities = Array.from(
      new Set([...CITIES, ...Object.keys(cityCounts)])
    );

    return allKnownCities
      .map((name) => ({
        name,
        count: cityCounts[name] || 0,
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => {
        // The cities someone chose come first; they are why this person is here
        const mineOrder = Number(myCities.has(b.name.toLowerCase())) - Number(myCities.has(a.name.toLowerCase()));
        if (mineOrder !== 0) return mineOrder;

        // Then Online, since it is open to everyone
        if (a.name.toLowerCase() === ONLINE_CITY) return -1;
        if (b.name.toLowerCase() === ONLINE_CITY) return 1;

        // Higher count first
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
  }, [cityCounts, myCities]);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return activeCityList;
    return activeCityList.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [activeCityList, searchQuery]);

  const totalEvents = activeCityList.reduce((sum, city) => sum + city.count, 0);

  return (
    <main className="min-h-screen bg-surface-base pb-24 md:pb-16">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 font-heading tracking-tight">
              Pick a city
            </h1>
            <p className="text-slate-600 font-medium text-sm md:text-base">
              {totalEvents > 0
                ? `${totalEvents} upcoming ${totalEvents === 1 ? "event" : "events"} across ${activeCityList.length} ${activeCityList.length === 1 ? "city" : "cities"}`
                : "Conferences, hackathons and meetups near you"}
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              aria-label="Search active city"
              placeholder="Search active city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              maxLength={50}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 min-h-11 text-base md:text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            />
          </div>
        </div>

        {/* Cities Grid */}
        {initialCityCounts === null ? (
          <div role="alert" className="py-16 text-center max-w-md mx-auto">
            <h3 className="text-slate-900 font-bold text-xl font-heading">Could not load cities</h3>
            <p className="text-slate-500 font-medium text-sm mt-2">Check your connection and try again.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-6 inline-flex items-center min-h-11 px-6 bg-brand-primary text-white font-bold rounded-xl text-sm active:scale-95 transition-transform">
              Try again
            </button>
          </div>
        ) : filteredCities.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {filteredCities.map((item, index) => {
              const config = getCityConfig(item.name);
              // Grid tiles are ~200px wide on phones, so they use the 640px /covers/sm/ copies;
              // the full 1600px covers stay for the city page banner.
              const imageSrc = (config.coverImage || config.backgroundImage || "/cities/covers/default1.webp")
                .replace("/cities/covers/", "/cities/covers/sm/");

              return (
                <Link
                  key={item.name}
                  href={`/cities/${encodeURIComponent(item.name.toLowerCase().replace(/\s+/g, "-"))}`}
                  className="group relative aspect-4/3 overflow-hidden rounded-2xl bg-slate-800 active:scale-[0.98] transition-transform"
                >
                  <Image
                    src={imageSrc}
                    alt=""
                    fill
                    className="object-cover motion-safe:group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    // The first row is what people see first; the rest wait so they don't steal bandwidth.
                    priority={index < ABOVE_FOLD_TILES}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  {myCities.has(item.name.toLowerCase()) && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-brand-primary text-white text-xs font-bold">
                      Your city
                    </span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-3.5 md:p-4">
                    <h2 className="text-white font-black font-heading tracking-tight truncate text-lg md:text-xl">
                      {cityLabel(item.name)}
                    </h2>
                    <p className="text-white/90 text-xs md:text-sm font-bold mt-0.5">
                      {item.count} upcoming {item.count === 1 ? "event" : "events"}
                    </p>
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
              className="mt-6 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-all text-sm shadow-sm active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Host An Event in Your City
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
