"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Crown, ArrowRight, MapPin } from "@/components/icons";
import { motion, useReducedMotion } from "framer-motion";
import { ScoreInfoButton } from "@/components/leaderboard/ScoreInfoButton";
import { CITIES } from "@/lib/constants/cities";
import { useAuth } from "@/context/AuthContext";
import { LeaderboardPodium } from "./LeaderboardPodium";
import { LeaderboardDock } from "./LeaderboardDock";
import { LeaderboardHowTo, LeaderboardList } from "./LeaderboardList";
import { useLeaderboardCohorts } from "./useLeaderboardCohorts";

// Below this a board still looks empty, so the page explains how to join it
const FEW_CURATORS = 10;
const HIGHLIGHT_MS = 1600;

export type CohortType = "campus" | "city" | "all_time";

export interface LeaderboardCurator {
  user_id: string | null;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  college?: string | null;
  et_score?: number | null;
  events_posted?: number | null;
  impact_saves?: number | null;
  rank?: number;
}

interface LeaderboardClientProps {
  initialCohortData?: Record<CohortType, LeaderboardCurator[]>;
}

export function LeaderboardClient({ initialCohortData }: LeaderboardClientProps) {
  const { user, profile, isAdmin, isLoading: isAuthLoading } = useAuth();
  const reduceMotion = useReducedMotion();

  const [activeCohort, setActiveCohort] = useState<CohortType>("all_time");
  const [selectedLeaderboardCity, setSelectedLeaderboardCity] = useState<string>("Hyderabad");
  const [isHighlighted, setIsHighlighted] = useState(false);
  // The winner's reveal is for arriving on the page, not for every tab change
  const [hasRevealed, setHasRevealed] = useState(false);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync cohort and city when profile is available
  useEffect(() => {
    if (profile) {
      const userCity = profile.preferred_cities?.[0] || "Hyderabad";
      if (userCity !== "Hyderabad") {
        setSelectedLeaderboardCity(userCity);
      }
      if (profile.user_type === "student" && profile.college) {
        setActiveCohort("campus");
      }
    }
  }, [profile]);

  const isStudent = profile?.user_type === "student";
  const preferredCities = useMemo(() => {
    return profile?.preferred_cities?.length ? profile.preferred_cities : ["Hyderabad"];
  }, [profile?.preferred_cities]);

  // Members compete in the cities they chose. Guests and members with no city have
  // nothing chosen yet, and admins need to inspect every board.
  const canBrowseAllCities = !isAuthLoading && (!user || isAdmin || !profile?.preferred_cities?.length);
  const hasCityChoice = canBrowseAllCities || preferredCities.length > 1;

  const { currentList, isLoading, loadFailed, retry } = useLeaderboardCohorts({
    initialCohortData,
    activeCohort,
    city: selectedLeaderboardCity,
    isAuthLoading,
    isStudent,
    userCollege: profile?.college || "",
  });

  useEffect(() => {
    if (!isLoading && currentList.length > 0) setHasRevealed(true);
  }, [isLoading, currentList.length]);

  useEffect(() => () => {
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
  }, []);

  // Role-gated cohort tabs (matching app 100%)
  const cohortTabs = useMemo(() => {
    if (isStudent) {
      return [
        { id: "campus" as CohortType, label: "Your College" },
        { id: "city" as CohortType, label: "City" },
        { id: "all_time" as CohortType, label: "All-Time" },
      ];
    }
    return [
      { id: "city" as CohortType, label: "City" },
      { id: "all_time" as CohortType, label: "All-Time" },
    ];
  }, [isStudent]);

  const topThree = currentList.slice(0, 3);
  const restList = currentList.slice(3);

  const myIndex = user ? currentList.findIndex((item) => item.user_id === user.id) : -1;
  const myRank = myIndex !== -1 ? myIndex + 1 : null;
  const myListScore = myIndex !== -1 ? currentList[myIndex].et_score ?? 0 : null;
  const rival = myIndex > 0 ? currentList[myIndex - 1] : null;

  const jumpToMyRank = () => {
    const target = document.getElementById("my-rank") ?? document.getElementById("leaderboard-podium");
    target?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    setIsHighlighted(true);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setIsHighlighted(false), HIGHLIGHT_MS);
  };

  const listSectionTitle = activeCohort === "campus"
    ? "College Leaderboard"
    : activeCohort === "city"
    ? `Top in ${selectedLeaderboardCity}`
    : "Top Ranked";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-8">
      {/* Title & Header */}
      <div className="text-center mb-8 space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="relative shrink-0 w-12 h-12 rounded-[16px] bg-gradient-to-b from-white to-brand-primary/10 border border-brand-primary/20 shadow-lg shadow-brand-primary/20 flex items-center justify-center rotate-3">
            <Crown className="w-6 h-6 text-brand-primary drop-shadow-md" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-slate-900 tracking-tight">
            Top Curators
          </h1>
        </div>
        <p className="text-slate-500 font-medium text-sm sm:text-base max-w-xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span>Ranked by trust, impact, and consistency.</span>
          <ScoreInfoButton />
        </p>
      </div>

      {/* Role-Gated Cohort Tabs (Matching app cohortTrack) */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center bg-[#F1F5F9] rounded-[14px] p-1 border border-slate-200/70 shadow-xs max-w-md w-full sm:w-auto">
          {cohortTabs.map((tab) => {
            const isActive = tab.id === activeCohort;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCohort(tab.id)}
                className={`relative flex-1 sm:flex-initial sm:px-6 min-h-11 rounded-xl text-xs sm:text-sm font-bold font-sans text-center active:scale-95 transition-[color,transform] ${
                  isActive ? "text-slate-900 font-black" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="leaderboard-active-tab"
                    className="absolute inset-0 rounded-xl bg-white shadow-xs"
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <span className="relative">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* City Selector (When City Cohort is active) */}
      {activeCohort === "city" && (
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-2 px-2">
            {hasCityChoice && (
              <span className="text-xs font-bold text-slate-500 mr-1 shrink-0 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" /> Cities:
              </span>
            )}
            {preferredCities.map((city) => {
              const isSelected = city.toLowerCase() === selectedLeaderboardCity.toLowerCase();
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedLeaderboardCity(city)}
                  className={`px-4 min-h-11 rounded-full text-xs font-bold transition-all shrink-0 active:scale-95 ${
                    isSelected
                      ? "bg-brand-primary text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {city}
                </button>
              );
            })}
            {canBrowseAllCities && (
              <select
                aria-label="Choose another city"
                value={preferredCities.includes(selectedLeaderboardCity) ? "" : selectedLeaderboardCity}
                onChange={(e) => e.target.value && setSelectedLeaderboardCity(e.target.value)}
                className="min-h-11 rounded-full border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600"
              >
                <option value="">More cities</option>
                {CITIES.filter((c) => !preferredCities.includes(c)).map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loadFailed ? (
        <div role="alert" className="bg-white rounded-3xl p-10 border border-slate-200 max-w-xl mx-auto text-center mb-16">
          <h3 className="text-xl font-black text-slate-900 font-heading mb-2">Could not load the rankings</h3>
          <p className="text-slate-500 text-sm font-medium mb-6">Check your connection and try again.</p>
          <button
            type="button"
            onClick={retry}
            className="bg-slate-900 hover:bg-black text-white px-6 min-h-11 rounded-full text-sm font-bold transition-all active:scale-95"
          >
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : currentList.length === 0 ? (
        /* Empty State matching app */
        <div className="flex flex-col items-center justify-center bg-white rounded-3xl p-10 md:p-16 border border-slate-200 shadow-sm max-w-xl mx-auto text-center mb-16">
          <div className="w-36 h-36 relative mb-4">
            <Image src="/Throne_empty.webp" alt="Empty throne" fill className="object-contain" priority />
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-heading mb-2">
            {activeCohort === "campus"
              ? "No one from your college is ranked yet"
              : activeCohort === "city"
              ? `No rankings in ${selectedLeaderboardCity} yet`
              : "Leaderboard is empty"}
          </h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md mx-auto mb-6">
            {activeCohort === "campus"
              ? "Post an event and get it approved to be the first from your college."
              : activeCohort === "city"
              ? `Post an event and get it approved to be the first from ${selectedLeaderboardCity}.`
              : "Post an event and get it approved to join the board."}
          </p>
          <Link
            href="/events/new"
            className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-full text-sm font-bold transition-all active:scale-95 flex items-center gap-2 shadow-md"
          >
            Start Curating <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <motion.div
          key={`${activeCohort}-${selectedLeaderboardCity}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
        >
          <LeaderboardPodium topThree={topThree} reveal={!hasRevealed} />

          {restList.length > 0 && (
            <LeaderboardList
              title={listSectionTitle}
              total={currentList.length}
              curators={restList}
              userId={user?.id}
              isHighlighted={isHighlighted}
            />
          )}

          {currentList.length < FEW_CURATORS && <LeaderboardHowTo />}
        </motion.div>
      )}

      {/* Sticky Bottom Proximal Rival Dock (Matching mobile app gamification loop) */}
      {user && (
        <LeaderboardDock
          userId={user.id}
          isOnboarded={Boolean(profile?.is_onboarded)}
          myRank={myRank}
          myListScore={myListScore}
          rival={rival}
          viewingOtherCity={activeCohort === "city" && selectedLeaderboardCity !== preferredCities[0] ? selectedLeaderboardCity : null}
          homeCity={preferredCities[0]}
          onJump={jumpToMyRank}
        />
      )}
    </div>
  );
}
