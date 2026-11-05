import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { CuratorEventsTabs } from "@/components/shared/CuratorEventsTabs";
import Image from "next/image";
import type { Metadata } from "next";
import NotFound from "../not-found";
import { BrandAvatar } from "@/components/ui/BrandAvatar";
import { CuratorLevelBadge } from "@/components/ui/CuratorLevelBadge";
import { getCuratorLevel } from "@/lib/profile/curatorLevel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const decodedUsername = decodeURIComponent(username);
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuid = UUID_REGEX.test(decodedUsername);

  const curatorQuery = supabase.from("profiles").select("id, full_name, username, avatar_url, et_score");
  // Only a regex-checked UUID is spliced into the .or() string; free-text usernames go through
  // .eq() so a URL like /x,role.eq.admin cannot add its own filter clauses.
  const { data: curator } = await (isUuid
    ? curatorQuery.or(`username.eq.${decodedUsername},id.eq.${decodedUsername}`)
    : curatorQuery.eq("username", decodedUsername)
  ).maybeSingle();

  if (!curator) return { title: "Page Not Found | EvenTime", robots: { index: false, follow: true } };

  const { data: scoreRow } = await supabase
    .from("leaderboard_view")
    .select("et_score")
    .eq("user_id", curator.id)
    .maybeSingle();

  const score = scoreRow?.et_score ?? curator.et_score ?? 100;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventime.thesurfboard.in";
  const ogUrl = new URL(`${baseUrl}/api/og/leaderboard`);
  ogUrl.searchParams.set("name", curator.full_name || "Curator");
  ogUrl.searchParams.set("score", String(score));
  ogUrl.searchParams.set("rank", "1");
  ogUrl.searchParams.set("image", curator.avatar_url || "");

  const title = `${curator.full_name} | Curator on EvenTime`;
  const description = `${curator.full_name} has ${score} ET Score on EvenTime. Check out their curated events.`;

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/${curator.username || curator.id}` },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${curator.username || curator.id}`,
      type: "profile",
      images: [{ url: ogUrl.toString(), width: 1200, height: 630, alt: curator.full_name || "Curator" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogUrl.toString()] },
  };
}

export const dynamic = "force-dynamic";

export default async function CuratorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  // NEW: Get current logged-in user to handle follow logic
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const PROFILE_FIELDS = "id, full_name, username, college, avatar_url, et_score";
  // AFTER - one query (Checks username or ID in a single round trip)
  const decodedUsername = decodeURIComponent(username);
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuid = UUID_REGEX.test(decodedUsername);

  const curatorQuery = supabase.from("profiles").select(PROFILE_FIELDS);
  // Only a regex-checked UUID is spliced into the .or() string; free-text usernames go through
  // .eq() so a URL like /x,role.eq.admin cannot add its own filter clauses.
  const { data: curator } = await (isUuid
    ? curatorQuery.or(`username.eq.${decodedUsername},id.eq.${decodedUsername}`)
    : curatorQuery.eq("username", decodedUsername)
  ).maybeSingle();

  // notFound() here reached the browser as an empty shell that only drew the 404 after all JS
  // loaded (~10s on Slow 3G). Rendering the same 404 UI directly keeps it server-rendered;
  // generateMetadata marks it noindex so Google still drops the URL.
  if (!curator) {
    return <NotFound />;
  }

  // Fix: Running the remaining dependent queries in parallel using Promise.all
   const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().substring(0, 10);

   const [
    { count: totalEventCount },
    { data: allTimeSavesData },
    { data: events },
    { data: appSettings },
    { data: leaderboardRow }
  ] = await Promise.all([
    // 1a. True lifetime count — never filtered by date
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", curator.id)
      .eq("status", "approved"),

    // 1a2. Lifetime saves — never filtered by date
    supabase
      .from("events")
      .select("saved_count")
      .eq("creator_id", curator.id)
      .eq("status", "approved"),

    // 1b. Fetch Curator's Approved Events from the last 6 months only (for display)
    supabase
      .from("events")
      .select("id, slug, title, category, date_string, end_date_string, location, city, poster_url, organizer_name, is_free, target_audience, saved_count")
      .eq("creator_id", curator.id)
      .eq("status", "approved")
      .gte("date_string", sixMonthsAgoStr)
      .or("college_only.is.null,college_only.eq.false")
      .order("created_at", { ascending: true }),

    // 2. Check if leaderboard / ET Score is enabled platform-wide
    supabase.from("app_settings").select("leaderboard_enabled").eq("id", 1).maybeSingle(),

    // 3. Live ET Score — same source the leaderboard page uses, so numbers always match
    supabase.from("leaderboard_view").select("et_score").eq("user_id", curator.id).maybeSingle()
  ]);
  // Dynamic ga events anni thirigi saves count ni sum chesthundi
  const impactSaves = allTimeSavesData?.reduce((acc, ev) => acc + ((ev as any).saved_count || 0), 0) || 0;
  const leaderboardEnabled = appSettings?.leaderboard_enabled ?? true;
  const etScore = leaderboardRow?.et_score ?? curator.et_score ?? 100;
  const eventCount = totalEventCount || 0;
  const level = getCuratorLevel(eventCount);

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="relative overflow-hidden bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className={`absolute inset-x-0 top-0 h-20 ${level.bandClass}`} />
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <div className={`w-32 h-32 rounded-full overflow-hidden bg-slate-100 ring-4 ring-offset-4 ring-offset-white ${level.ringClass}`}>
              <BrandAvatar seed={curator.username || curator.id} title={curator.full_name || "Curator"} className="h-full w-full" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left md:pt-14">
            <h1 className="text-3xl font-heading font-black text-text-primary">{curator.full_name}</h1>
            <p className="text-brand-primary font-bold mt-1">@{curator.username}</p>
            <p className="text-slate-500 font-medium mt-1">{curator.college || "Curator on EvenTime"}</p>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
              <CuratorLevelBadge level={level} />
            </div>
            
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4 items-center w-full">
              <div className="bg-surface-base px-5 py-3 rounded-2xl flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Events</span>
                <span className="text-xl font-black text-slate-900">{eventCount}</span>
              </div>
              
              {appSettings?.leaderboard_enabled && (
                <div className="bg-surface-base px-5 py-3 rounded-2xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saves</span>
                  <span className="text-xl font-black text-slate-900">{impactSaves}</span>
                </div>
              )}
              {leaderboardEnabled && (
                <div className={`px-5 py-3 rounded-2xl flex flex-col min-w-[120px] ${level.scorePanelClass}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${level.scoreClass}`}>ET Score</span>
                  <span className={`text-xl font-black ${level.scoreClass}`}>{etScore}</span>
                </div>
              )}

            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-black text-slate-900">Events by {curator.full_name}</h2>
          {events && events.length > 0 ? (
            <CuratorEventsTabs events={events} />
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-[#E5E5EA]">
              <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">
                {eventCount > 0 ? "No events in the last 6 months" : "No active events posted"}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}