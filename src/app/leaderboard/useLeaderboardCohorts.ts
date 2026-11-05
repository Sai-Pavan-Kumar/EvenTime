import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CohortType, LeaderboardCurator } from "./LeaderboardClient";

// Same cutoff the server page uses before anyone appears on the board
export const MIN_RANKED_SCORE = 150;

interface CohortOptions {
  initialCohortData?: Record<CohortType, LeaderboardCurator[]>;
  activeCohort: CohortType;
  city: string;
  isAuthLoading: boolean;
  isStudent: boolean;
  userCollege: string;
}

export function useLeaderboardCohorts({ initialCohortData, activeCohort, city, isAuthLoading, isStudent, userCollege }: CohortOptions) {
  const [supabase] = useState(() => createClient());
  const [loadedCity, setLoadedCity] = useState("Hyderabad");
  const [isLoadingCohort, setIsLoadingCohort] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const latestRequest = useRef(0);

  const [cohortData, setCohortData] = useState<Record<CohortType, LeaderboardCurator[]>>(() => ({
    campus: initialCohortData?.campus || [],
    city: initialCohortData?.city || [],
    all_time: initialCohortData?.all_time || [],
  }));

  const fetchCohortData = useCallback(async (cohort: CohortType, targetCity: string) => {
    // Quick tab or city taps can finish out of order; only the newest answer may show.
    const requestId = ++latestRequest.current;
    setIsLoadingCohort(true);
    setLoadFailed(false);

    try {
      const { data: excludedRows, error: excludedError } = await supabase.rpc("leaderboard_excluded_ids");
      if (excludedError) throw excludedError;
      const excludedIds = new Set<string>((excludedRows as string[] | null) || []);

      const rankedQuery = () => supabase
        .from("leaderboard_view").select("user_id, username, full_name, avatar_url, et_score, college, events_posted, impact_saves, base_score")
        .gt("et_score", MIN_RANKED_SCORE)
        .order("et_score", { ascending: false });

      let found: LeaderboardCurator[] = [];

      if (cohort === "campus") {
        if (isStudent && userCollege) {
          const { data, error } = await rankedQuery().ilike("college", `%${userCollege.trim()}%`).limit(50);
          if (error) throw error;
          found = data || [];
        }
      } else if (cohort === "city") {
        const { data: cityProfs, error: cityError } = await supabase
          .from("profiles")
          .select("id")
          .contains("preferred_cities", [targetCity]);
        if (cityError) throw cityError;

        if (cityProfs && cityProfs.length > 0) {
          const { data, error } = await rankedQuery().in("user_id", cityProfs.map((p) => p.id)).limit(50);
          if (error) throw error;
          found = data || [];
        }
      } else {
        const { data, error } = await rankedQuery().limit(100);
        if (error) throw error;
        found = data || [];
      }

      if (requestId !== latestRequest.current) return;
      const rows = found
        .filter((r) => r.user_id && !excludedIds.has(r.user_id))
        .map((r, idx) => ({ ...r, rank: idx + 1 }));
      setCohortData((prev) => ({ ...prev, [cohort]: rows }));
      if (cohort === "city") setLoadedCity(targetCity);
    } catch (err) {
      console.warn("[LeaderboardClient] Error fetching cohort:", err);
      if (requestId === latestRequest.current) setLoadFailed(true);
    } finally {
      if (requestId === latestRequest.current) setIsLoadingCohort(false);
    }
  }, [supabase, isStudent, userCollege]);

  // Fetch cohort data only when not already pre-populated from Edge cache
  useEffect(() => {
    if (isAuthLoading) return;
    setLoadFailed(false);
    // If all_time is already populated, no client DB query needed
    if (activeCohort === "all_time" && (cohortData.all_time?.length ?? 0) > 0) return;
    // The city list holds one city at a time, so it only counts if it is the one selected
    if (activeCohort === "city" && city === loadedCity && (cohortData.city?.length ?? 0) > 0) return;

    fetchCohortData(activeCohort, city);
  }, [activeCohort, city, isAuthLoading, fetchCohortData]);

  return {
    currentList: cohortData[activeCohort] || [],
    isLoading: isLoadingCohort || (activeCohort === "city" && city !== loadedCity),
    loadFailed,
    retry: () => fetchCohortData(activeCohort, city),
  };
}
