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
    registeredEventsRes,
    { data: myReportsRaw },
    { data: appSettingsData },
    { data: leaderboardRow },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, username, avatar_url, college, branch, goals, preferred_cities, user_type, graduation_year, role")
      .eq("id", currentUser.id)
      .maybeSingle(),
    supabase
      .from("events")
      .select("id, slug, title, category, date_string, status, poster_url, is_featured, saved_count, interested_count, registered_count")
      .eq("creator_id", currentUser.id)
      .neq("status", "deleted")
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_events")
      .select("events(id, slug, title, category, date_string, location, city, poster_url, is_free, organizer_name, is_featured, target_audience)")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("registered_events")
      .select("id, status, created_at, events(id, slug, title, category, date_string, location, city, poster_url, is_free, organizer_name, is_featured, target_audience)")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .then((res) => (res.error ? { data: [] } : res)),
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

  // leaderboard_view is the only place the score is worked out, so the profile can never disagree with the board.
  const profileWithScore = { ...profileData, et_score: leaderboardRow?.et_score ?? 100 };

  const formattedSavedEvents =
    savedEventsData?.flatMap((item) => (item.events ? [item.events] : [])) ?? [];

  const formattedRegisteredEvents =
    ((registeredEventsRes?.data || []) as any[])
      .map((item) => (item.events ? { ...item.events, registration_status: item.status, registered_at: item.created_at } : null))
      .filter(Boolean);

  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileClient
        initialUser={currentUser}
        initialProfile={profileWithScore}
        initialMyEvents={(myEventsRaw as any[]) || []}
        initialSavedEvents={formattedSavedEvents}
        initialRegisteredEvents={formattedRegisteredEvents}
        initialMyReports={(myReportsRaw as any[]) || []}
        initialAppSettings={appSettingsData}
      />
    </Suspense>
  );
}