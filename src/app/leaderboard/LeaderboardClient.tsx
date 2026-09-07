"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Trophy, 
  Crown, 
  Medal, 
  Award, 
  ArrowRight, 
  MapPin, 
  GraduationCap, 
  Sparkles,
  Users,
  Compass
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ScoreInfoButton } from "@/components/leaderboard/ScoreInfoButton";
import { CITIES } from "@/lib/constants/cities";
import type { User } from "@supabase/supabase-js";
import type { ProfileRow } from "@/types";

const DEFAULT_EXCLUDED_EMAILS = ["p.pavansiri@gmail.com", "eventime.admin@gmail.com"];
const DEFAULT_EXCLUDED_USERNAMES = ["eventime.admin", "eventimeadmin", "admin"];

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

export function LeaderboardClient() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Partial<ProfileRow> | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [activeCohort, setActiveCohort] = useState<CohortType>("all_time");
  const [selectedLeaderboardCity, setSelectedLeaderboardCity] = useState<string>("Hyderabad");
  const [isLoadingCohort, setIsLoadingCohort] = useState(true);

  const [cohortData, setCohortData] = useState<Record<CohortType, LeaderboardCurator[]>>({
    campus: [],
    city: [],
    all_time: [],
  });

  // Fetch current user and profile on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        const { data: prof } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, user_type, college, branch, preferred_cities, et_score")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (prof) {
          setProfile(prof as any);
          const userCity = prof.preferred_cities?.[0] || "Hyderabad";
          setSelectedLeaderboardCity(userCity);
          if (prof.user_type === "student" && prof.college) {
            setActiveCohort("campus");
          } else {
            setActiveCohort("city");
          }
        }
      }
      setIsAuthLoading(false);
    };
    fetchUser();
  }, [supabase]);

  const isStudent = profile?.user_type === "student";
  const userCollege = profile?.college || "";
  const preferredCities = useMemo(() => {
    return profile?.preferred_cities?.length ? profile.preferred_cities : ["Hyderabad"];
  }, [profile?.preferred_cities]);

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

  // Fetch data for a specific cohort
  const fetchCohortData = useCallback(async (cohort: CohortType, cityTarget?: string) => {
    setIsLoadingCohort(true);
    const targetCity = cityTarget || selectedLeaderboardCity;

    try {
      // 1. Excluded user IDs
      const { data: excludedProfiles } = await supabase
        .from("profiles")
        .select("id")
        .in("email", DEFAULT_EXCLUDED_EMAILS);

      const excludedIds = new Set<string>((excludedProfiles || []).map((p) => p.id));

      const { data: excludedByUsername } = await supabase
        .from("profiles")
        .select("id")
        .in("username", DEFAULT_EXCLUDED_USERNAMES);

      (excludedByUsername || []).forEach((p) => excludedIds.add(p.id));

      let rows: LeaderboardCurator[] = [];

      if (cohort === "campus") {
        if (isStudent && userCollege) {
          const { data: collegeProfs } = await supabase
            .from("leaderboard_view").select("user_id, username, full_name, avatar_url, et_score, college, events_posted, impact_saves, base_score")
            .ilike("college", `%${userCollege.trim()}%`)
            .gt("et_score", 150)
            .order("et_score", { ascending: false })
            .limit(50);

          if (collegeProfs) {
            rows = collegeProfs
              .filter((p) => p.user_id && !excludedIds.has(p.user_id) && (p.et_score ?? 0) > 150)
              .map((p, idx) => ({ ...p, rank: idx + 1 }));
          }
        }
      } else if (cohort === "city") {
        if (targetCity) {
          const { data: cityProfs } = await supabase
            .from("profiles")
            .select("id")
            .contains("preferred_cities", [targetCity]);

          if (cityProfs && cityProfs.length > 0) {
            const cityUserIds = cityProfs.map((p) => p.id);
            const { data: viewProfs } = await supabase
              .from("leaderboard_view").select("user_id, username, full_name, avatar_url, et_score, college, events_posted, impact_saves, base_score")
              .in("user_id", cityUserIds)
              .gt("et_score", 150)
              .order("et_score", { ascending: false })
              .limit(50);

            if (viewProfs) {
              rows = viewProfs
                .filter((p) => p.user_id && !excludedIds.has(p.user_id) && (p.et_score ?? 0) > 150)
                .map((p, idx) => ({ ...p, rank: idx + 1 }));
            }
          }
        }
      } else if (cohort === "all_time") {
        const { data: allData } = await supabase
          .from("leaderboard_view").select("user_id, username, full_name, avatar_url, et_score, college, events_posted, impact_saves, base_score")
          .gt("et_score", 150)
          .order("et_score", { ascending: false })
          .limit(100);

        if (allData) {
          rows = allData
            .filter((r) => r.user_id && !excludedIds.has(r.user_id) && (r.et_score ?? 0) > 150)
            .map((r, idx) => ({ ...r, rank: idx + 1 }));
        }
      }

      setCohortData((prev) => ({ ...prev, [cohort]: rows }));
    } catch (err) {
      console.warn("[LeaderboardClient] Error fetching cohort:", err);
    } finally {
      setIsLoadingCohort(false);
    }
  }, [supabase, isStudent, userCollege, selectedLeaderboardCity]);

  // Initial fetch on cohort change or city change
  useEffect(() => {
    if (!isAuthLoading) {
      fetchCohortData(activeCohort, selectedLeaderboardCity);
    }
  }, [activeCohort, selectedLeaderboardCity, isAuthLoading, fetchCohortData]);

  const currentList = cohortData[activeCohort] || [];
  const topThree = currentList.slice(0, 3);
  const restList = currentList.slice(3);

  // Behavioral Rival & Rank calculation
  const userScore = profile?.et_score ?? 100;
  const myRank = useMemo(() => {
    if (!user) return null;
    const idx = currentList.findIndex((item) => item.user_id === user.id);
    return idx !== -1 ? idx + 1 : null;
  }, [currentList, user]);

  const prevRival = useMemo(() => {
    if (!myRank || myRank <= 1) return null;
    return currentList[myRank - 2] || null;
  }, [currentList, myRank]);

  const deltaToPass = useMemo(() => {
    if (!prevRival) return null;
    const rivalScore = prevRival.et_score ?? 100;
    return Math.max(1, rivalScore - userScore + 1);
  }, [prevRival, userScore]);

  // Simple, recognizable rank tiers matching app
  const getRankTierBadge = (rank: number) => {
    if (rank === 1) return { label: "Rank #1", color: "text-amber-800", bg: "bg-amber-100", border: "border-amber-300" };
    if (rank <= 3) return { label: "Top 3", color: "text-amber-700", bg: "bg-orange-100", border: "border-orange-300" };
    if (rank <= 10) return { label: "Top 10", color: "text-purple-700", bg: "bg-purple-100", border: "border-purple-300" };
    if (rank <= 25) return { label: "Top 25", color: "text-sky-700", bg: "bg-sky-100", border: "border-sky-300" };
    return { label: "Member", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" };
  };

  const myTierBadge = useMemo(() => {
    return myRank ? getRankTierBadge(myRank) : { label: "Member", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" };
  }, [myRank]);

  const listSectionTitle = useMemo(() => {
    if (activeCohort === "campus") {
      return isStudent ? "College Leaderboard" : "Top Curators";
    }
    if (activeCohort === "city") {
      return `Top in ${selectedLeaderboardCity}`;
    }
    return "Top Ranked";
  }, [activeCohort, isStudent, selectedLeaderboardCity]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      {/* Title & Header */}
      <div className="text-center mb-10 space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="relative shrink-0 w-12 h-12 rounded-[16px] bg-gradient-to-b from-white to-amber-50 border border-amber-100 shadow-lg shadow-amber-500/20 flex items-center justify-center rotate-3">
            <Crown className="w-6 h-6 text-amber-500 drop-shadow-md" />
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

      {/* Role-Gated Cohort Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center bg-slate-100/90 rounded-2xl p-1.5 border border-slate-200 shadow-xs max-w-md w-full sm:w-auto">
          {cohortTabs.map((tab) => {
            const isActive = tab.id === activeCohort;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCohort(tab.id)}
                className={`flex-1 sm:flex-initial sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm font-black"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* City Selector (When City Cohort is active) */}
      {activeCohort === "city" && (
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-2 no-scrollbar">
            <span className="text-xs font-bold text-slate-400 mr-1 shrink-0 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-primary" /> Cities:
            </span>
            {preferredCities.map((city) => {
              const isSelected = city.toLowerCase() === selectedLeaderboardCity.toLowerCase();
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedLeaderboardCity(city)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? "bg-brand-primary text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {city}
                </button>
              );
            })}
            {/* Extended cities dropdown / pills */}
            {CITIES.filter((c) => !preferredCities.includes(c)).slice(0, 5).map((city) => {
              const isSelected = city.toLowerCase() === selectedLeaderboardCity.toLowerCase();
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedLeaderboardCity(city)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                    isSelected
                      ? "bg-brand-primary text-white shadow-xs font-bold"
                      : "bg-slate-50 text-slate-500 border border-slate-200/60 hover:bg-slate-100"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoadingCohort ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : currentList.length === 0 ? (
        /* Empty State matching app */
        <div className="flex flex-col items-center justify-center bg-white rounded-3xl p-10 md:p-16 border border-slate-200 shadow-sm max-w-xl mx-auto text-center mb-16">
          <div className="w-36 h-36 relative mb-4">
            <Image src="/throne-empty.webp" alt="Empty throne" fill className="object-contain" priority />
          </div>
          <h3 className="text-2xl font-black text-slate-900 font-heading mb-2">
            {activeCohort === "campus"
              ? isStudent
                ? "No one from your college is ranked yet"
                : "No top curators ranked yet"
              : activeCohort === "city"
              ? `No rankings in ${selectedLeaderboardCity} yet`
              : "Leaderboard is empty"}
          </h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md mx-auto mb-6">
            {activeCohort === "campus"
              ? isStudent
                ? "Share or save an event to be the first one on your college leaderboard!"
                : "Be the first curator to rank on EvenTime by curating or saving events!"
              : activeCohort === "city"
              ? `Share or save an event in ${selectedLeaderboardCity} to get on the board!`
              : "Share or save events to climb up the ranks!"}
          </p>
          <Link
            href="/events/new"
            className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-full text-sm font-bold transition-all active:scale-95 flex items-center gap-2 shadow-md"
          >
            Start Curating <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* THE CELEBRATED PODIUM */}
          <div className="relative grid grid-cols-3 items-end gap-2 sm:gap-4 md:gap-6 mb-12 px-1 max-w-xl mx-auto mt-6">
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[120%] h-[180px] bg-gradient-to-t from-amber-500/10 to-transparent blur-[50px] -z-10 rounded-full pointer-events-none" />

            {/* RANK 2 */}
            <div className="flex flex-col items-center justify-self-end w-full">
              {topThree[1] ? (
                <>
                  <Link href={`/${topThree[1].username || topThree[1].user_id}`} className="relative mb-2 hover:scale-105 transition-transform">
                    <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full p-1 bg-gradient-to-br from-slate-300 to-slate-400 shadow-md">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-white">
                        <Image src={topThree[1].avatar_url || "/window.svg"} alt="Rank 2" width={72} height={72} className="object-cover" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-white border-2 border-slate-300 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                      {topThree[1].et_score} <span className="text-[8px] font-bold text-slate-400">ET</span>
                    </div>
                  </Link>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 max-w-[90px] text-center mb-1">
                    {topThree[1].full_name || topThree[1].username}
                  </h3>
                </>
              ) : (
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center mb-2">
                  <Medal className="w-5 h-5 text-slate-300" />
                </div>
              )}
              <div className="w-full h-16 sm:h-24 bg-gradient-to-t from-slate-200 to-slate-50 rounded-t-2xl border-t-2 border-x-2 border-white flex items-end justify-center pb-2 shadow-xs">
                <span className="text-2xl sm:text-3xl font-black text-slate-300">2</span>
              </div>
            </div>

            {/* RANK 1 */}
            <div className="flex flex-col items-center justify-self-center w-full z-10 relative">
              {topThree[0] ? (
                <>
                  <Link href={`/${topThree[0].username || topThree[0].user_id}`} className="relative mb-2 hover:scale-105 transition-transform">
                    <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full p-1 bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-white">
                        <Image src={topThree[0].avatar_url || "/window.svg"} alt="Rank 1" width={88} height={88} className="object-cover" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap">
                      {topThree[0].et_score} <span className="text-[8px] font-bold text-amber-100">ET</span>
                    </div>
                  </Link>
                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-base line-clamp-1 max-w-[110px] text-center mb-1">
                    {topThree[0].full_name || topThree[0].username}
                  </h3>
                </>
              ) : (
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center mb-2">
                  <Trophy className="w-6 h-6 text-slate-300" />
                </div>
              )}
              <div className="w-full h-24 sm:h-32 bg-gradient-to-t from-amber-200 to-[#FFF7D6] rounded-t-[20px] border-t-2 border-x-2 border-white flex items-end justify-center pb-2 shadow-xs">
                <span className="text-3xl sm:text-4xl font-black text-amber-500/60">1</span>
              </div>
            </div>

            {/* RANK 3 */}
            <div className="flex flex-col items-center justify-self-start w-full">
              {topThree[2] ? (
                <>
                  <Link href={`/${topThree[2].username || topThree[2].user_id}`} className="relative mb-2 hover:scale-105 transition-transform">
                    <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full p-1 bg-gradient-to-br from-amber-700 to-amber-900 shadow-md">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-white">
                        <Image src={topThree[2].avatar_url || "/window.svg"} alt="Rank 3" width={72} height={72} className="object-cover" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-white border-2 border-amber-700 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                      {topThree[2].et_score} <span className="text-[8px] font-bold text-amber-700/70">ET</span>
                    </div>
                  </Link>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 max-w-[90px] text-center mb-1">
                    {topThree[2].full_name || topThree[2].username}
                  </h3>
                </>
              ) : (
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center mb-2">
                  <Award className="w-5 h-5 text-slate-300" />
                </div>
              )}
              <div className="w-full h-12 sm:h-18 bg-gradient-to-t from-[#E2B78D]/40 to-[#FCEFDA]/50 rounded-t-2xl border-t-2 border-x-2 border-white flex items-end justify-center pb-2 shadow-xs">
                <span className="text-2xl sm:text-3xl font-black text-[#D49A6A]/60">3</span>
              </div>
            </div>

            <div className="col-span-3 h-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent rounded-full -mt-0.5" />
          </div>

          {/* LIST VIEW FOR RANKS 4+ */}
          {restList.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                  {listSectionTitle}
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  {currentList.length} Curators
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {restList.map((curator, index) => {
                  const rank = curator.rank ?? index + 4;
                  const isMe = user?.id === curator.user_id;
                  const tier = getRankTierBadge(rank);

                  return (
                    <div
                      key={curator.user_id}
                      className={`grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 p-3.5 sm:p-4 items-center transition-colors ${
                        isMe ? "bg-purple-50/70 border-l-4 border-brand-primary" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-8 sm:w-10 text-center font-heading font-bold text-base sm:text-lg text-slate-400">
                        #{rank}
                      </div>

                      <div className="flex items-center gap-3 min-w-0">
                        <Link
                          href={`/${curator.username || curator.user_id}`}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-white hover:opacity-80 transition-opacity"
                        >
                          <Image
                            src={curator.avatar_url || "/window.svg"}
                            alt={curator.full_name || "Curator"}
                            width={44}
                            height={44}
                            className="object-cover"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/${curator.username || curator.user_id}`}
                              className="font-bold text-slate-900 text-sm hover:text-brand-primary transition-colors truncate"
                            >
                              {curator.full_name || curator.username || "Curator"}
                            </Link>
                            {isMe && (
                              <span className="bg-brand-primary text-white text-[9px] font-black px-1.5 py-0.2 rounded-md shrink-0">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tier.bg} ${tier.color} ${tier.border}`}>
                              {tier.label}
                            </span>
                            {curator.college && (
                              <span className="text-xs text-slate-500 truncate hidden sm:inline-block">
                                • {curator.college}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right pr-2">
                        <span className="font-heading font-black text-slate-900 text-base sm:text-lg">
                          {curator.et_score}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 block -mt-1">
                          ET
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Sticky Bottom Proximal Rival Dock (Matching mobile app gamification loop) */}
      {user && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl bg-[#0F172A] text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl z-40 border border-slate-700/60 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                  myRank === 1
                    ? "bg-amber-400 text-slate-900 shadow-md shadow-amber-400/30"
                    : "bg-slate-800 text-white border border-slate-700"
                }`}
              >
                {myRank ? `#${myRank}` : "—"}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-white truncate">
                    {myRank === 1 ? "You · Rank #1" : myRank ? `You · #${myRank}` : "You · Unranked"}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full border ${myTierBadge.bg} ${myTierBadge.color} ${myTierBadge.border} shrink-0`}>
                    {myTierBadge.label}
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 font-medium leading-tight truncate">
                  {myRank === 1 ? (
                    "You're in 1st place! Keep sharing events to stay on top."
                  ) : prevRival && deltaToPass ? (
                    <span>
                      Just <span className="text-amber-400 font-bold">{deltaToPass} ET</span> more to pass @{prevRival.username || prevRival.full_name || "user"} for #{myRank! - 1}
                    </span>
                  ) : activeCohort === "city" && selectedLeaderboardCity !== preferredCities[0] ? (
                    `Viewing ${selectedLeaderboardCity}. Your Home Turf is ${preferredCities[0]}.`
                  ) : userScore <= 150 ? (
                    "Share an event (+100 ET) to earn points and claim your spot on the leaderboard."
                  ) : (
                    "Share or save events to climb up the leaderboard ranks."
                  )}
                </p>
              </div>
            </div>

            <Link
              href="/events/new"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-bold transition-all shrink-0 active:scale-95 shadow-sm"
            >
              Post Event <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
