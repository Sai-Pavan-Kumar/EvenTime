import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { LeaderboardClient, LeaderboardCurator, CohortType } from "./LeaderboardClient";
import type { Metadata } from "next";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Top Curators Leaderboard | EvenTime",
  description: "See the top-ranked event curators on EvenTime, ranked by trust, impact, and consistency across college, city, and all-time cohorts.",
};

const DEFAULT_EXCLUDED_EMAILS = ["p.pavansiri@gmail.com", "eventime.admin@gmail.com"];
const DEFAULT_EXCLUDED_USERNAMES = ["eventime.admin", "eventimeadmin", "admin"];

const getCachedLeaderboardData = unstable_cache(
  async () => {
    const supabaseAnon = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const [settingsRes, excludedEmailRes, excludedUserRes, allTimeRes, hydCityProfsRes] = await Promise.all([
      supabaseAnon.from("app_settings").select("leaderboard_enabled").eq("id", 1).maybeSingle(),
      supabaseAnon.from("profiles").select("id").in("email", DEFAULT_EXCLUDED_EMAILS),
      supabaseAnon.from("profiles").select("id").in("username", DEFAULT_EXCLUDED_USERNAMES),
      supabaseAnon
        .from("leaderboard_view")
        .select("user_id, username, full_name, avatar_url, et_score, college, events_posted, impact_saves, base_score")
        .gt("et_score", 150)
        .order("et_score", { ascending: false })
        .limit(100),
      supabaseAnon
        .from("profiles")
        .select("id")
        .contains("preferred_cities", ["Hyderabad"])
    ]);

    const leaderboardEnabled = settingsRes.data?.leaderboard_enabled ?? true;

    const excludedIds = new Set<string>([
      ...(excludedEmailRes.data || []).map((p) => p.id),
      ...(excludedUserRes.data || []).map((p) => p.id)
    ]);

    const allTimeCurators: LeaderboardCurator[] = (allTimeRes.data || [])
      .filter((r) => r.user_id && !excludedIds.has(r.user_id) && (r.et_score ?? 0) > 150)
      .map((r, idx) => ({ ...r, rank: idx + 1 }));

    // Fetch Hyderabad city curators
    let cityCurators: LeaderboardCurator[] = [];
    const hydUserIds = (hydCityProfsRes.data || []).map((p) => p.id);
    if (hydUserIds.length > 0) {
      const { data: hydViewProfs } = await supabaseAnon
        .from("leaderboard_view")
        .select("user_id, username, full_name, avatar_url, et_score, college, events_posted, impact_saves, base_score")
        .in("user_id", hydUserIds)
        .gt("et_score", 150)
        .order("et_score", { ascending: false })
        .limit(50);

      if (hydViewProfs) {
        cityCurators = hydViewProfs
          .filter((p) => p.user_id && !excludedIds.has(p.user_id) && (p.et_score ?? 0) > 150)
          .map((p, idx) => ({ ...p, rank: idx + 1 }));
      }
    }

    return {
      leaderboardEnabled,
      initialCohortData: {
        all_time: allTimeCurators,
        city: cityCurators,
        campus: [] as LeaderboardCurator[]
      }
    };
  },
  ['leaderboard_cached_data'],
  { tags: ['leaderboard'], revalidate: 600 }
);

export default async function LeaderboardPage() {
  const { leaderboardEnabled, initialCohortData } = await getCachedLeaderboardData();

  if (leaderboardEnabled === false) {
    redirect("/");
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-base" />}>
      <main className="min-h-screen bg-surface-base">
        <Navbar leaderboardEnabled={leaderboardEnabled} />
        <LeaderboardClient initialCohortData={initialCohortData} />
      </main>
    </Suspense>
  );
}
