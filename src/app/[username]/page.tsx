import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { EventCard } from "@/app/events/EventCard";
import Image from "next/image";
import { FollowButton } from "@/components/profile/FollowButton";
import type { ProfileRow } from "@/types";

export const dynamic = "force-dynamic";

type ExtendedProfileRow = Partial<ProfileRow> & {
  preferred_cities?: string[] | null;
  user_type?: string | null;
  graduation_year?: string | null;
};
const calculateCompletion = (prof: ExtendedProfileRow | null) => {
  if (!prof) return 0;
  let score = 0;
  if (prof.username) score += 25;
  if (prof.preferred_cities && prof.preferred_cities.length > 0) score += 25;
  if (prof.goals && prof.goals.length > 0) score += 25;
  const isStudent = prof.user_type === "student";
  if (!isStudent) {
    score += 25;
  } else if (prof.graduation_year) {
    score += 25;
  }
  return score;
};

export default async function CuratorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  // NEW: Get current logged-in user to handle follow logic
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const PROFILE_FIELDS = "id, full_name, username, college, avatar_url, et_score, goals, preferred_cities, user_type, graduation_year";
  // AFTER - one query (Checks username or ID in a single round trip)
  const decodedUsername = decodeURIComponent(username);
  const { data: curator } = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .or(`username.eq.${decodedUsername},id.eq.${decodedUsername}`)
    .maybeSingle();

  if (!curator) {
    return (
      <div className="min-h-screen bg-surface-base">
        <Navbar />
        <div className="text-center py-20 font-bold text-xl text-slate-400">Curator not found or handle is incorrect.</div>
      </div>
    );
  }

  // Fix: Running the remaining dependent queries in parallel using Promise.all
   const [
    { data: events },
    followResult,
    { count: followerCount },
    { data: appSettings }
  ] = await Promise.all([
    // 1. Fetch Curator's Approved Events
    supabase
      .from("events")
      .select("id, slug, title, category, date_string, location, city, poster_url, organizer_name, is_free, target_audience, saved_events(count)")
      .eq("creator_id", curator.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
      
    // 2. Check if current user is following this curator
    currentUser
      ? supabase
          .from("followers")
          .select("id")
          .eq("follower_id", currentUser.id)
          .eq("curator_id", curator.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    // 3. Get total follower count for the UI
    supabase
      .from("followers")
      .select("*", { count: "exact", head: true })
      .eq("curator_id", curator.id),
    // 4. Check if leaderboard / ET Score is enabled platform-wide
    supabase.from("app_settings").select("leaderboard_enabled").eq("id", 1).maybeSingle()
  ]);
  const isFollowing = !!followResult.data;
  // Dynamic ga events anni thirigi saves count ni sum chesthundi
  const impactSaves = events?.reduce((acc, ev) => acc + ((ev as any).saved_events?.[0]?.count || 0), 0) || 0;
  const etScore = curator.et_score || 100;
  const leaderboardEnabled = appSettings?.leaderboard_enabled ?? true;
  const avatarUrl = curator.avatar_url || "/window.svg";
  const completionPercentage = calculateCompletion(curator);

  // NEW: Dynamic Profile Tiers Logic
  const eventCount = events?.length || 0;
  let strokeColor = "#6C47FF"; // Default Purple
  let isGold = false;

  if (eventCount >= 69) {
    strokeColor = "url(#goldGradient)";
    isGold = true;
  } else if (eventCount >= 30) {
    strokeColor = "#C0C0C0"; // Silver
  } else if (eventCount >= 10) {
    strokeColor = "#CD7F32"; // Bronze
  }

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 144 144">
              {isGold && (
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE047" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                </defs>
              )}
              <circle cx="72" cy="72" r="68" fill="none" stroke="#F5F5F7" strokeWidth="4" />
              <circle cx="72" cy="72" r="68" fill="none" stroke={strokeColor} strokeWidth="4" strokeDasharray="427.25" strokeDashoffset={427.25 - (completionPercentage / 100) * 427.25} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-slate-100 shadow-inner">
              <Image src={avatarUrl} alt={curator.full_name || "Curator"} fill unoptimized={true} sizes="128px" className="object-cover" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-heading font-black text-text-primary">{curator.full_name}</h1>
            <p className="text-brand-primary font-bold mt-1">@{curator.username}</p>
            <p className="text-slate-500 font-medium mt-1">{curator.college || "Curator on EvenTime"}</p>
            
            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4 items-center w-full">
              <div className="bg-surface-base px-5 py-3 rounded-2xl flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Events</span>
                <span className="text-xl font-black text-slate-900">{eventCount}</span>
              </div>
              
              {/* NEW: Followers Count */}
              <div className="bg-surface-base px-5 py-3 rounded-2xl flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Followers</span>
                <span className="text-xl font-black text-slate-900">{followerCount || 0}</span>
              </div>
              {appSettings?.leaderboard_enabled && (
                <div className="bg-surface-base px-5 py-3 rounded-2xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saves</span>
                  <span className="text-xl font-black text-slate-900">{impactSaves}</span>
                </div>
              )}
              {leaderboardEnabled && (
                <div className="bg-amber-50 border border-amber-100 px-5 py-3 rounded-2xl flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">ET Score</span>
                  <span className="text-xl font-black text-amber-600">{etScore}</span>
                </div>
              )}

              {/* NEW: Follow Button (Hidden if viewing own profile or logged out) */}
              {currentUser && currentUser.id !== curator.id && (
                <div className="ml-0 md:ml-auto mt-4 md:mt-0">
                  <FollowButton curatorId={curator.id} initialIsFollowing={isFollowing} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-heading font-black text-slate-900">Events by {curator.full_name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events && events.length > 0 ? (
              events.map((event) => (
                <EventCard 
               key={event.id}
              id={event.id}
              slug={event.slug || event.id}
              title={event.title || "Untitled Event"}
              category={event.category || "General"}
              date={event.date_string || "TBA"}
             city={event.location || event.city || "Online"}
             imageUrl={event.poster_url || "/window.svg"}
             organizerName={event.organizer_name || "Organizer"}
             organizerUsername={(event as any).profiles?.username}
             isFree={event.is_free ?? false} // boolean null check
             audience={event.target_audience ?? []} // array null check
              />
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-[#E5E5EA]">
                <p className="text-[#86868B] font-bold uppercase tracking-widest text-xs">No active events posted</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}