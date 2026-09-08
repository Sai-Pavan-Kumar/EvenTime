import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeaderboardClient } from "./LeaderboardClient";
import type { Metadata } from "next";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Top Curators Leaderboard | EvenTime",
  description: "See the top-ranked event curators on EvenTime, ranked by trust, impact, and consistency across college, city, and all-time cohorts.",
};

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // Check if leaderboard is enabled globally
  const { data: settings } = await supabase
    .from("app_settings")
    .select("leaderboard_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (settings && settings.leaderboard_enabled === false) {
    redirect("/");
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-base" />}>
      <main className="min-h-screen bg-surface-base">
        <Navbar />
        <LeaderboardClient />
      </main>
    </Suspense>
  );
}
