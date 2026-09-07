"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Calendar, MapPin, Grid, Users, ArrowLeft, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CITIES } from "@/lib/constants/cities";
import { categoriesList } from "@/features/create-event/constants";

interface PlatformStatsData {
  eventCount: number;
  totalCitiesCount: number;
  totalCategoryCount: number;
  userCount: number;
}

export default function PlatformStatsPage() {
  const [stats, setStats] = useState<PlatformStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const supabase = createClient();
      const [
        { count: eventCount },
        { count: userCount },
      ] = await Promise.all([
        supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved"),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true }),
      ]);

      setStats({
        eventCount: eventCount || 0,
        totalCitiesCount: CITIES.length,
        totalCategoryCount: categoriesList.length,
        userCount: userCount || 0,
      });
    } catch (err) {
      console.warn("[PlatformStats] Failed to load live stats:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-primary bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Metrics
          </button>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 tracking-tight mb-3">
            EvenTime at a Glance
          </h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium leading-relaxed">
            Real-time platform metrics across events, supported cities, and our community.
          </p>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-3 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Active Events */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-5">
                  <Calendar className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="text-3xl font-black text-slate-900 font-heading mb-1">
                  {stats?.eventCount ?? 0}
                </div>
                <div className="text-sm font-bold text-slate-800 mb-2">Active Events</div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Curated public and campus events live on the platform right now.
                </p>
              </div>

              {/* Card 2: Cities Supported */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-3xl font-black text-slate-900 font-heading mb-1">
                  {stats?.totalCitiesCount ?? CITIES.length}
                </div>
                <div className="text-sm font-bold text-slate-800 mb-2">Cities Supported</div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Major university hubs, metros, and tech centers active across India.
                </p>
              </div>

              {/* Card 3: Curated Categories */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
                  <Grid className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-3xl font-black text-slate-900 font-heading mb-1">
                  {stats?.totalCategoryCount ?? categoriesList.length}
                </div>
                <div className="text-sm font-bold text-slate-800 mb-2">Curated Categories</div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  From developer hackathons and summits to cultural fests and networking meetups.
                </p>
              </div>

              {/* Card 4: Community Members */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-5">
                  <Users className="w-6 h-6 text-violet-600" />
                </div>
                <div className="text-3xl font-black text-slate-900 font-heading mb-1">
                  {stats?.userCount ?? 0}
                </div>
                <div className="text-sm font-bold text-slate-800 mb-2">Community Members</div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Students, builders, and event curators discovering and connecting on EvenTime.
                </p>
              </div>
            </div>

            {/* Live Supported Cities Section */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900 font-heading">
                  Live Supported Cities ({CITIES.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Active regions and metros currently supported on EvenTime.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((city) => (
                  <Link
                    key={city}
                    href={`/?location=${encodeURIComponent(city.toLowerCase())}`}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-brand-primary border border-slate-200/70 transition-colors"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer Note matching app */}
            <div className="text-center pt-4 pb-2">
              <p className="text-xs text-slate-400 font-medium font-['Switzer']">
                Updated in real-time. Click refresh to view live figures.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
