"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Plus, MapPin } from "@/components/icons";
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

    const cities = allKnownCities
      .filter((name) => name.toLowerCase() !== ONLINE_CITY)
      .map((name) => ({
        name,
        count: cityCounts[name] || 0,
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => {
        // The cities someone chose come first; they are why this person is here
        const mineOrder = Number(myCities.has(b.name.toLowerCase())) - Number(myCities.has(a.name.toLowerCase()));
        if (mineOrder !== 0) return mineOrder;

        // Higher count first
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });

    // Online is open to everyone wherever they live, so it leads whenever it has events.
    const onlineCount = Object.entries(cityCounts)
      .filter(([name]) => name.toLowerCase() === ONLINE_CITY)
      .reduce((sum, [, count]) => sum + count, 0);
    return onlineCount > 0 ? [{ name: ONLINE_CITY, count: onlineCount }, ...cities] : cities;
  }, [cityCounts, myCities]);

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return activeCityList;
    return activeCityList.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [activeCityList, searchQuery]);

  const totalEvents = activeCityList.reduce((sum, city) => sum + city.count, 0);
  const cityCount = activeCityList.filter((city) => city.name !== ONLINE_CITY).length;
  const searchTerm = searchQuery.trim();
  // The post form only accepts listed cities, so the empty state must not promise more than that.
  const supportedCity = searchTerm
    ? CITIES.find((city) => city.toLowerCase().includes(searchTerm.toLowerCase()))
    : undefined;

  return (
    <main className="min-h-screen bg-surface-base pb-24 md:pb-16">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 font-heading tracking-tight">
              Cities with events right now
            </h1>
            {/* People read a missing city as "not covered", so the rule for appearing here is stated up front. */}
            <p className="text-slate-600 font-medium text-sm md:text-base">
              A city shows up here once it has an upcoming event.
              {totalEvents > 0 && ` Now: ${totalEvents} ${totalEvents === 1 ? "event" : "events"} in ${cityCount} ${cityCount === 1 ? "city" : "cities"}.`}
            </p>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              aria-label="Search cities"
              placeholder="Search your city"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {filteredCities.map((item, index) => {
              const config = getCityConfig(item.name);

              return (
                <Link
                  key={item.name}
                  href={`/cities/${encodeURIComponent(item.name.toLowerCase().replace(/\s+/g, "-"))}`}
                  className="group flex flex-col bg-white p-2 md:p-3 rounded-[16px] md:rounded-[20px] shadow-sm active:scale-[0.98] transition-transform"
                >
                  {/* Image curve = card curve minus padding, so both corners stay parallel. */}
                  <div className="relative w-full aspect-video overflow-hidden rounded-[8px] bg-slate-100">
                    {config && <Image
                      src={config.backgroundImage}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      // The first row is what people see first; the rest wait so they don't steal bandwidth.
                      priority={index < ABOVE_FOLD_TILES}
                    />}
                    {myCities.has(item.name.toLowerCase()) && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-brand-primary text-white text-xs font-bold">
                        Your city
                      </span>
                    )}
                  </div>

                  <div className="px-1 pt-3 pb-1">
                    <h2 className="text-slate-900 font-black font-heading tracking-tight truncate text-lg md:text-xl">
                      {cityLabel(item.name)}
                    </h2>
                    <p className="text-slate-500 text-xs md:text-sm font-bold mt-0.5">
                      {item.count} upcoming {item.count === 1 ? "event" : "events"}
                    </p>
                  </div>
                </Link>
              );
            })}
            <Link
              href="/events/new"
              className="flex flex-col justify-center gap-2 bg-brand-primary/10 p-3 md:p-5 rounded-[16px] md:rounded-[20px] active:scale-[0.98] transition-transform"
            >
              <h2 className="text-slate-900 font-black font-heading tracking-tight text-lg md:text-xl">
                Don&apos;t see your city?
              </h2>
              <p className="text-slate-600 text-xs md:text-sm font-medium leading-snug">
                It just has no upcoming events yet. Post the first one and it shows up here.
              </p>
              <span className="inline-flex items-center gap-1.5 min-h-11 text-brand-primary text-sm font-bold">
                <Plus className="w-4 h-4" /> Post an event
              </span>
            </Link>
          </div>
        ) : (
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
              {supportedCity
                ? `No upcoming events in ${supportedCity} yet`
                : searchTerm
                  ? `We don't have "${searchTerm}" yet`
                  : "No upcoming events right now"}
            </h3>
            <p className="text-slate-500 font-medium text-sm mt-2 leading-relaxed">
              {searchTerm && !supportedCity
                ? "Events can only be posted for the cities we list, or as online events."
                : "Post the first one and it shows up here."}
            </p>
            <Link
              href="/events/new"
              className="mt-6 px-6 py-3 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 transition-all text-sm shadow-sm active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Post an event
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
