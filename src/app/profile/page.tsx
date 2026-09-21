import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";
import ProfileLoading from "./loading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile | EvenTime",
  description: "Manage your posted events, bookmarks, and EvenTime score.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !currentUser) {
    redirect("/login?next=/profile");
  }

  const [
    { data: profileData },
    { data: myEventsRaw },
    { data: savedEventsData },
    { data: myReportsRaw },
    { data: appSettingsData },
    { data: leaderboardRow },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, username, avatar_url, et_score, college, branch, goals, preferred_cities, user_type, graduation_year, role")
      .eq("id", currentUser.id)
      .maybeSingle(),
    supabase
      .from("events")
      .select("id, slug, title, category, date_string, status, poster_url, is_featured, saved_events(count), interested_events(count)")
      .eq("creator_id", currentUser.id)
      .neq("status", "deleted")
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_events")
      .select("events(id, slug, title, category, date_string, location, city, poster_url, is_free, organizer_name, is_featured, target_audience)")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_reports")
      .select("id, reason, status, created_at, events(title, slug)")
      .eq("curator_id", currentUser.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("app_settings")
      .select("leaderboard_enabled")
      .eq("id", 1)
      .maybeSingle(),
    supabase
      .from("leaderboard_view")
      .select("et_score")
      .eq("user_id", currentUser.id)
      .maybeSingle(),
  ]);

  if (!profileData) {
    redirect("/profile/settings");
  }

  // Sync with leaderboard_view if curator has earned event/save points
  if (leaderboardRow?.et_score && leaderboardRow.et_score > (profileData.et_score ?? 100)) {
    profileData.et_score = leaderboardRow.et_score;
  }

  // Auto-heal: Award +50 ET Complete Profile bonus if user has set up preferences but score is stuck at <= 100
  const hasCompletedPreferences =
    (profileData.preferred_cities?.length ?? 0) > 0 && (profileData.goals?.length ?? 0) > 0;
  if (hasCompletedPreferences && (profileData.et_score == null || profileData.et_score <= 100)) {
    const bonusScore = Math.max((profileData.et_score ?? 100) + 50, 150);
    try {
      await supabase.rpc("increment_et_score", { user_id: currentUser.id, delta: 50 });
      profileData.et_score = bonusScore;
    } catch {
      await supabase.from("profiles").update({ et_score: bonusScore }).eq("id", currentUser.id);
      profileData.et_score = bonusScore;
    }
  }

  const formattedSavedEvents =
    savedEventsData?.flatMap((item) => (item.events ? [item.events] : [])) ?? [];

  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileClient
        initialUser={currentUser}
        initialProfile={profileData}
        initialMyEvents={(myEventsRaw as any[]) || []}
        initialSavedEvents={formattedSavedEvents}
        initialMyReports={(myReportsRaw as any[]) || []}
        initialAppSettings={appSettingsData}
      />
    </Suspense>
  );
}