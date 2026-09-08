import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/permissions";
import AdminConsoleClient from "./AdminConsoleClient";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminDashboard(props: PageProps) {
  const searchParams = await props.searchParams;
  const initialTab = searchParams.tab || "overview";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isAdmin = await requireAdmin(supabase, user.id);
  if (!isAdmin) redirect("/");

  // Prefetch all data in parallel
  const [
    { count: pendingCount, data: pendingEventsData },
    { count: activeCount },
    { count: totalUsersCount },
    { count: reportCount, data: reportsData },
    { count: feedbackCount, data: feedbackData },
    { count: collegesCount, data: collegesData },
    { data: appSettings },
    { data: allEventsData },
    { data: usersData },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id, slug, title, category, city, date_string, registration_link, poster_url, created_at, status, is_featured, profiles:creator_id ( full_name, username )", { count: "exact" })
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),

    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),

    supabase
      .from("event_reports")
      .select("id, reason, status, created_at, curator_id, event_id, events ( id, title, slug )", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("platform_feedback")
      .select("id, type, message, status, created_at, user_id", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("colleges")
      .select("id, name, state, website, slug", { count: "exact" })
      .order("name", { ascending: true }),

    supabase
      .from("app_settings")
      .select("leaderboard_enabled, featured_enabled")
      .eq("id", 1)
      .maybeSingle(),

    supabase
      .from("events")
      .select("id, slug, title, category, city, date_string, registration_link, poster_url, created_at, status, is_featured, profiles:creator_id ( full_name, username )")
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("profiles")
      .select("id, full_name, username, email, role, et_score, avatar_url")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(100),
  ]);

  // Fetch feedback user profiles
  const feedbackUserIds = (feedbackData || [])
    .map((f) => f.user_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  let feedbackProfilesMap = new Map<string, { full_name: string; email: string }>();
  if (feedbackUserIds.length > 0) {
    const { data: fbProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", feedbackUserIds);
    feedbackProfilesMap = new Map(
      (fbProfiles || []).map((p) => [p.id, { full_name: p.full_name || "User", email: p.email || "" }])
    );
  }

  const enrichedFeedback = (feedbackData || []).map((f) => ({
    ...f,
    profiles: f.user_id ? feedbackProfilesMap.get(f.user_id) : null,
  }));

  const initialStats = {
    pendingEvents: pendingCount || 0,
    activeEvents: activeCount || 0,
    totalUsers: totalUsersCount || 0,
    openReports: reportCount || 0,
    feedbackCount: feedbackCount || 0,
    collegesCount: collegesCount || 0,
  };

  const initialSettings = {
    leaderboardEnabled: appSettings?.leaderboard_enabled ?? true,
    featuredEnabled: appSettings?.featured_enabled ?? true,
  };

  return (
    <AdminConsoleClient
      initialStats={initialStats}
      initialSettings={initialSettings}
      initialTab={initialTab}
      initialPendingEvents={pendingEventsData || []}
      initialEvents={allEventsData || []}
      initialFeedbacks={enrichedFeedback}
      initialUsers={usersData || []}
      initialReports={reportsData || []}
      initialColleges={collegesData || []}
      currentUserId={user.id}
    />
  );
}