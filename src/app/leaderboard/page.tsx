import { Navbar } from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Crown, Medal, Award, Info, ArrowRight, Share2 } from "lucide-react";
import { redirect } from "next/navigation";
import { generateHMAC } from "@/lib/hmac";

export const revalidate = 0;

async function getSignedOgUrl(name: string, score: number, rank: number, image: string) {
  const query = `name=${encodeURIComponent(name)}&score=${score}&rank=${rank}&image=${encodeURIComponent(image)}`;
  const sig = await generateHMAC(query);
  return `/api/og/leaderboard?${query}&sig=${sig}`;
}

const getTierInfo = (score: number) => {
  if (score >= 901) return { name: "Elite Legend", bg: "bg-amber-100", text: "text-amber-600", border: "border-amber-400" };
  if (score >= 501) return { name: "Expert Curator", bg: "bg-purple-100", text: "text-purple-600", border: "border-purple-400" };
  if (score >= 201) return { name: "Rising Star", bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-400" };
  return { name: "Rookie", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300" };
};

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("app_settings")
    .select("leaderboard_enabled")
    .eq("id", 1)
    .maybeSingle();

  if (settings && settings.leaderboard_enabled === false) {
    redirect("/");
  }

  const { data: leaders } = await supabase
    .from("leaderboard_view")
    .select("user_id, full_name, username, avatar_url, college, et_score, events_posted, impact_saves")
    .order("et_score", { ascending: false })
    .limit(50);

  const topThree = leaders?.slice(0, 3) || [];
  const restOfLeaders = leaders?.slice(3) || [];

  const topThreeUrls = [
    topThree[0] ? await getSignedOgUrl(topThree[0].full_name || 'Curator', topThree[0].et_score || 0, 1, topThree[0].avatar_url || '') : '',
    topThree[1] ? await getSignedOgUrl(topThree[1].full_name || 'Curator', topThree[1].et_score || 0, 2, topThree[1].avatar_url || '') : '',
    topThree[2] ? await getSignedOgUrl(topThree[2].full_name || 'Curator', topThree[2].et_score || 0, 3, topThree[2].avatar_url || '') : ''
  ];

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-16 space-y-4">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-2">
            <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-[24px] bg-gradient-to-b from-white to-amber-50 border border-amber-100 shadow-xl shadow-amber-500/20 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
              <Crown className="w-8 h-8 text-amber-500 drop-shadow-md" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-[#1D1D1F] tracking-tight">
            Top Curators
          </h1>
          <p className="text-[#86868B] font-medium text-lg max-w-xl mx-auto flex items-center justify-center gap-2">
            Ranked by trust, impact, and consistency. 
            <span className="inline-flex items-center gap-1 text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600 cursor-help" title="Base Score (100) + Profile Completion (25) + Events (50) + Saves (5)">
              <Info className="w-3 h-3" /> How ET Score works
            </span>
          </p>
        </div>

        {/* THE CELEBRATED PODIUM OR EMPTY STATE */}
        {topThree.length > 0 ? (
          <div className={`relative items-end gap-2 md:gap-4 mb-24 px-2 min-h-[380px] md:min-h-[420px] max-w-3xl mx-auto mt-10 ${topThree.length === 1 ? "flex justify-center" : "grid grid-cols-3"}`}>
            {/* Ambient Celebratory Glow */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[120%] h-[200px] bg-gradient-to-t from-amber-500/10 to-transparent blur-[60px] -z-10 rounded-full pointer-events-none" />

            {/* RANK 2 */}
            <div className="flex flex-col items-center justify-self-end w-full max-w-[160px] animate-in slide-in-from-bottom-8 duration-700">
              {topThree[1] && (
                <>
                  <Link href={`/${topThree[1].username || topThree[1].user_id}`} className="relative mb-4 hover:scale-105 transition-transform">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-br from-slate-300 to-slate-400 shadow-lg">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-white">
                        <Image src={topThree[1].avatar_url || "/window.svg"} alt="Rank 2" width={96} height={96} className="object-cover" />
                      </div>
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md border-2 border-white flex items-center gap-1">
                      <Medal className="w-3 h-3" /> #2
                    </div>
                  </Link>
                  <Link href={`/${topThree[1].username || topThree[1].user_id}`} className="hover:text-[#6C47FF] transition-colors">
                    <h3 className="font-bold text-[#1D1D1F] text-sm md:text-base line-clamp-1 max-w-[100px] text-center hover:underline">{topThree[1].full_name}</h3>
                  </Link>
                  <p className="text-slate-500 text-xs font-semibold mb-1">{topThree[1].college || "Curator"}</p>
                  <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 shadow-sm mb-3">
                    <span className="font-heading font-extrabold text-slate-700">{topThree[1].et_score}</span> <span className="text-[10px] text-slate-400">ET</span>
                  </div>
                  <a href={topThreeUrls[1]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors shadow-sm z-10 mb-[-12px]">
                    <Share2 className="w-3 h-3" /> Share
                  </a>
                  {/* Podium Block */}
                  <div className="w-full h-24 md:h-32 bg-gradient-to-t from-slate-200 to-slate-50 rounded-t-2xl border-t-2 border-x-2 border-white flex items-end justify-center pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent h-4" />
                    <span className="text-4xl md:text-5xl font-black text-slate-300/60 drop-shadow-sm">2</span>
                  </div>
                </>
              )}
            </div>

            {/* RANK 1 (ALWAYS ABSOLUTE CENTER) */}
            <div className="flex flex-col items-center justify-self-center w-full max-w-[180px] z-10 animate-in slide-in-from-bottom-12 duration-1000 delay-150 relative">
              {topThree[0] && (
                <>
                  {/* Subtle Winner Glow */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-400/30 blur-2xl rounded-full -z-10" />
                  <Crown className="w-8 h-8 text-amber-500 mb-2 drop-shadow-md" />
                  <Link href={`/${topThree[0].username || topThree[0].user_id}`} className="relative mb-4 hover:scale-105 transition-transform">
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-full p-1.5 bg-gradient-to-b from-amber-300 via-amber-500 to-orange-500 shadow-xl shadow-amber-500/30">
                      <div className="w-full h-full rounded-full overflow-hidden border-4 border-white bg-white">
                        <Image src={topThree[0].avatar_url || "/window.svg"} alt="Rank 1" width={144} height={144} className="object-cover" />
                      </div>
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs md:text-sm font-extrabold px-4 py-1.5 rounded-full shadow-lg border-2 border-white flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" /> #1
                    </div>
                  </Link>
                  <Link href={`/${topThree[0].username || topThree[0].user_id}`} className="hover:text-amber-600 transition-colors">
                    <h3 className="font-heading font-extrabold text-[#1D1D1F] text-lg md:text-xl mt-2 line-clamp-1 max-w-[140px] text-center hover:underline">{topThree[0].full_name}</h3>
                  </Link>
                  <p className="text-slate-500 text-xs font-semibold mb-2">{topThree[0].college || "Curator"}</p>
                  <div className="bg-white border-2 border-amber-200 rounded-xl px-4 py-1.5 shadow-md shadow-amber-100 mb-3">
                    <span className="font-heading font-black text-amber-600 text-lg">{topThree[0].et_score}</span> <span className="text-xs font-bold text-amber-600/60">ET</span>
                  </div>
                  <a href={topThreeUrls[0]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-bold px-4 py-2 rounded-full transition-colors shadow-md shadow-[#0A66C2]/20 z-10 mb-[-16px]">
                    <Share2 className="w-3.5 h-3.5" /> Share Victory
                  </a>
                  {/* Podium Block */}
                  <div className="w-full h-36 md:h-48 bg-gradient-to-t from-amber-200 to-[#FFF7D6] rounded-t-[20px] border-t-2 border-x-2 border-white flex items-end justify-center pb-4 shadow-[0_-8px_30px_rgba(245,158,11,0.15)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-transparent h-6" />
                    <span className="text-5xl md:text-6xl font-black text-amber-400/50 drop-shadow-sm">1</span>
                  </div>
                </>
              )}
            </div>

            {/* RANK 3 */}
            <div className="flex flex-col items-center justify-self-start w-full max-w-[160px] animate-in slide-in-from-bottom-8 duration-700 delay-300">
              {topThree[2] && (
                <>
                  <Link href={`/${topThree[2].username || topThree[2].user_id}`} className="relative mb-4 hover:scale-105 transition-transform">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-br from-amber-700 to-amber-900 shadow-lg">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-white">
                        <Image src={topThree[2].avatar_url || "/window.svg"} alt="Rank 3" width={96} height={96} className="object-cover" />
                      </div>
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-800 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md border-2 border-white flex items-center gap-1">
                      <Award className="w-3 h-3" /> #3
                    </div>
                  </Link>
                  <Link href={`/${topThree[2].username || topThree[2].user_id}`} className="hover:text-[#6C47FF] transition-colors">
                    <h3 className="font-bold text-[#1D1D1F] text-sm md:text-base line-clamp-1 max-w-[100px] text-center hover:underline">{topThree[2].full_name}</h3>
                  </Link>
                  <p className="text-slate-500 text-xs font-semibold mb-1">{topThree[2].college || "Curator"}</p>
                  <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 shadow-sm mb-3">
                    <span className="font-heading font-extrabold text-slate-700">{topThree[2].et_score}</span> <span className="text-[10px] text-slate-400">ET</span>
                  </div>
                  <a href={topThreeUrls[2]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors shadow-sm z-10 mb-[-12px]">
                    <Share2 className="w-3 h-3" /> Share
                  </a>
                  {/* Podium Block */}
                  <div className="w-full h-16 md:h-20 bg-gradient-to-t from-[#E2B78D]/40 to-[#FCEFDA]/50 rounded-t-2xl border-t-2 border-x-2 border-white flex items-end justify-center pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent h-4" />
                    <span className="text-4xl md:text-5xl font-black text-[#D49A6A]/50 drop-shadow-sm">3</span>
                  </div>
                </>
              )}
            </div>  
          </div>
        ) : (
          /* EMPTY STATE - NO CURATORS YET */
          <div className="flex flex-col items-center justify-center bg-white rounded-[40px] p-10 md:p-16 border border-slate-200 shadow-xl shadow-slate-200/40 max-w-2xl mx-auto relative overflow-hidden mb-20">
             <div className="absolute top-[-50%] left-[-10%] w-96 h-96 bg-amber-400/10 rounded-full blur-3xl animate-pulse" />
             <div className="absolute bottom-[-50%] right-[-10%] w-96 h-96 bg-[#6C47FF]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
             
             <div className="relative z-10 flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-1000">
               <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-[24px] flex items-center justify-center mb-6 shadow-inner rotate-3 hover:rotate-0 transition-transform duration-500">
                 <Trophy className="w-10 h-10 text-amber-500" />
               </div>
               <h3 className="text-3xl font-black text-slate-900 font-heading mb-3 tracking-tight">
                 The Throne is Empty
               </h3>
               <p className="text-slate-500 font-medium max-w-md mx-auto mb-8 text-sm md:text-base leading-relaxed">
                 There are currently no events posted on the platform. Be the first to start curating and claim the #1 spot on the leaderboard.
               </p>
               <Link href="/events/new" className="bg-[#1D1D1F] hover:bg-black text-white px-8 py-4 rounded-full font-bold transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-black/10">
                 Start Curating <ArrowRight className="w-4 h-4" />
               </Link>
             </div>
          </div>
        )}

        {/* LIST VIEW FOR RANKS 4+ */}
        {restOfLeaders.length > 0 && (
          <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <div className="w-12 text-center">Rank</div>
              <div>Curator</div>
              <div className="w-32 text-right pr-4">ET Score</div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {restOfLeaders.map((user, index) => {
                const rank = index + 4;
                const tier = getTierInfo(user.et_score || 0);

                return (
                  <div key={user.user_id} className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 items-center hover:bg-surface-base transition-colors">
                    <div className="w-12 text-center font-heading font-bold text-lg text-slate-400">
                      #{rank}
                    </div>

                    <div className="flex items-center gap-4">
                      <Link href={`/${user.username || user.user_id}`} className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-white hover:opacity-80 transition-opacity">
                        <Image src={user.avatar_url || "/window.svg"} alt={user.full_name || "Curator"} width={48} height={48} className="object-cover" />
                      </Link>
                      <div>
                        <Link href={`/${user.username || user.user_id}`} className="hover:underline decoration-[#6C47FF]">
                          <h4 className="font-bold text-[#1D1D1F] text-sm md:text-base hover:text-[#6C47FF] transition-colors">{user.full_name}</h4>
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${tier.bg} ${tier.text} ${tier.border} border`}>
                            {tier.name}
                          </span>
                          <span className="text-xs text-slate-500 hidden sm:inline-block">• {user.events_posted} Events • {user.impact_saves} Saves</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-32 text-right pr-4">
                      <span className="font-heading font-black text-[#1D1D1F] text-xl">{user.et_score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}