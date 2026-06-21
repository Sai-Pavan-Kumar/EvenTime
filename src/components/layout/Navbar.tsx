"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image"; 
import { Search, Plus, User, LogOut, Trophy, Settings,SquarePlus, MapPin, Home, X, Bug } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FeedbackModal } from "./FeedbackModal";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { AuthUser } from "@/types";

const calculateCompletion = (profile: any) => {
  if (!profile) return 0;
  let score = 0;
  if (profile.avatar_url) score += 25;
  if (profile.college) score += 25;
  if (profile.goals) score += 50;
  return score;
};

function NavbarInner({ variant = 'default' }: { variant?: 'default' | 'centered' }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileDetails, setProfileDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [imgError, setImgError] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams(); const pathname = usePathname();

  const handleProtectedAction = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowAuthModal(true);
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, avatar_url, college, goals")
          .eq("id", userId)
          .single();
        
        if (mounted && !error && profile) {
          setIsAdmin(profile.role === "admin");
          setProfileDetails(profile);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      }
    };

    // NEW: Manually fetch initial user state just in case the listener misses the fast initial load
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      
      setUser(user);
      if (user) {
        fetchProfile(user.id);
      } else if (mounted) {
        setIsLoading(false);
      }
    };
    initUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setIsAdmin(false);
        setProfileDetails(null);
      }
      
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchQuery(q);
    else setSearchQuery("");
  }, [searchParams]);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("leaderboard_enabled")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setLeaderboardEnabled(data.leaderboard_enabled);
      });
  }, [supabase]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const completionPercent = calculateCompletion(profileDetails);

  return (
    <>
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-black/[0.05] shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4 relative">
          
          <div className={`${variant === 'centered' ? 'absolute left-1/2 -translate-x-1/2 flex items-center gap-2 shrink-0' : 'flex items-center gap-2 shrink-0'}`}>
            <Link href="/" className="shrink-0 flex items-center gap-2">
              <div className="w-9 h-9 relative shrink-0"> 
                <Image src="/logo.png" alt="logo" fill sizes="100px" className="object-contain" priority />
              </div>
              <span className="font-heading font-black text-xl tracking-tight block shrink-0 font-['Outfit']">
                <span className="text-[#6C47FF]">Even</span>
                <span className="text-[#1D1D1F]">Time</span>
              </span>
            </Link>
          </div>

          {variant !== 'centered' && (
            <>
              <form onSubmit={handleSearch} className="flex-1 max-w-lg relative hidden sm:block mx-5">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hackathons, meetups..."
                  className="w-full bg-white border border-[rgba(0,0,0,0.08)] shadow-sm rounded-full pl-10 pr-4 py-2.5 text-sm font-['Switzer',sans-serif] text-text-primary focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/15 outline-none placeholder:text-text-secondary transition-all"
                />
              </form>
              
              <div className="hidden sm:flex items-center gap-4 lg:gap-6 shrink-0">
            
            <Link href="/?view=map" className="flex items-center gap-2 text-sm font-bold font-['Outfit'] text-text-secondary hover:text-brand-primary transition-colors shrink-0">
              <MapPin className="w-4 h-4 shrink-0" /> Map
            </Link>

            {leaderboardEnabled && (
              <Link href="/leaderboard" className="flex items-center gap-2 text-sm font-bold font-['Outfit'] text-text-secondary hover:text-amber-500 transition-colors shrink-0">
                <Trophy className="w-4 h-4 shrink-0" /> Leaderboard
              </Link>
            )}

            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-2 text-sm font-bold font-['Outfit'] text-red-500 hover:text-red-600 transition-colors shrink-0">
                <Settings className="w-4 h-4 shrink-0" /> Admin
              </Link>
            )}

            <Link href="/events/new" onClick={handleProtectedAction} className="flex items-center gap-2 text-sm font-bold font-['Outfit'] bg-brand-primary text-white px-5 py-2.5 rounded-full border border-transparent hover:bg-white hover:text-brand-primary hover:border-brand-primary shadow-[0_4px_16px_rgba(108,71,255,0.15)] transition-all shrink-0 group">
              <Plus className="w-4 h-4 shrink-0 text-white group-hover:text-brand-primary transition-colors" /> Create Event
            </Link>

            <div className="flex items-center gap-2 pl-2 lg:pl-3 border-l border-slate-200/80">
              <button onClick={(e) => user ? setIsFeedbackOpen(true) : handleProtectedAction(e)} className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-100 hover:bg-brand-primary hover:border-brand-primary text-[#555570] hover:text-white shadow-sm transition-all shrink-0" title="Suggest Feature / Report Bug">
                <Bug className="w-4 h-4" />
              </button>

              {isLoading ? (
                <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-full p-1 shadow-sm shrink-0 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-slate-100" />
                  <div className="w-8 h-8 rounded-full bg-transparent mr-1" />
                </div>
              ) : user ? (
                <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-full p-1 shadow-sm shrink-0">
                  <Link href="/profile" className="relative w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shrink-0 group">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="19" fill="none" className="stroke-surface-elevated" strokeWidth="2" />
                      <circle cx="20" cy="20" r="19" fill="none" className="stroke-brand-primary" strokeWidth="2" strokeDasharray="119.38" strokeDashoffset={119.38 - (completionPercent / 100) * 119.38} strokeLinecap="round" style={{ transition: 'all 1000ms ease-out' }} />
                    </svg>
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white flex items-center justify-center bg-surface-elevated">
                      {avatarUrl && !imgError ? (
                        <img 
                          src={avatarUrl} 
                          alt="Profile" 
                          className="object-cover w-full h-full"
                          referrerPolicy="no-referrer"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <User className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0 mr-1" title="Log Out">
                    <LogOut className="w-4 h-4 shrink-0 ml-0.5" />
                  </button>
                </div>
              ) : (
                <Link href="/login" className="bg-text-primary hover:brightness-110 text-white px-5 py-2.5 rounded-full text-sm font-bold font-['Outfit'] transition-all shadow-[0_8px_20px_rgba(0,0,0,0.08)] active:scale-95 shrink-0">
                  Sign In
                </Link>
              )}
            </div>
          </div>
          </>
          )}

        </div>
      </div>
    </nav>

    <div id="mobile-bottom-nav" className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)] [will-change:transform] translate-z-0" style={{ transform: 'translateZ(0)' }}>
  <div className={`grid ${leaderboardEnabled ? 'grid-cols-5' : 'grid-cols-4'} items-center h-16 px-6 max-w-md mx-auto w-full`}>
    
    <Link href="/" className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform ${pathname === '/' && !searchParams.get('view') ? 'text-[#6C47FF]' : 'text-text-secondary hover:text-[#6C47FF]'}`}>
      <Home className="w-5 h-5" />
      <span className="text-[10px] font-bold font-['Outfit'] mt-1">Home</span>
    </Link>
    
    <Link href="/?view=map" className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform ${pathname === '/' && searchParams.get('view') === 'map' ? 'text-[#6C47FF]' : 'text-text-secondary hover:text-[#6C47FF]'}`}>
      <MapPin className="w-5 h-5" />
      <span className="text-[10px] font-bold font-['Outfit'] mt-1">Map</span>
    </Link>

    <Link href="/events/new" onClick={handleProtectedAction} className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform ${pathname === '/events/new' ? 'text-[#6C47FF]' : 'text-text-secondary hover:text-[#6C47FF]'}`}>
      <SquarePlus className="w-5 h-5" />
      <span className="text-[10px] font-bold font-['Outfit'] mt-1">Create</span>
    </Link>

    {leaderboardEnabled && (
      <Link href="/leaderboard" className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform ${pathname === '/leaderboard' ? 'text-[#6C47FF]' : 'text-text-secondary hover:text-[#6C47FF]'}`}>
        <Trophy className="w-5 h-5" />
        <span className="text-[10px] font-bold font-['Outfit'] mt-1">Rank</span>
      </Link>
    )}

    {isLoading ? (
     <div className="flex flex-col items-center justify-center w-full h-full animate-pulse">
       <div className="w-7 h-7 rounded-full bg-slate-200 mb-1" />
       <div className="w-6 h-2 bg-slate-200 rounded-full" />
     </div>
     ) : user ? (
      <Link href="/profile?tab=menu" className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform ${pathname.startsWith('/profile') ? 'text-[#6C47FF]' : 'text-text-secondary hover:text-[#6C47FF]'}`}>
        <div className="relative w-7 h-7 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="13" fill="none" className="stroke-surface-elevated" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="13" fill="none" className="stroke-[#6C47FF]" strokeWidth="1.5" strokeDasharray="81.68" strokeDashoffset={81.68 - (completionPercent / 100) * 81.68} strokeLinecap="round" style={{ transition: 'all 1000ms ease-out' }} />
          </svg>
          <div className={`w-5.5 h-5.5 rounded-full overflow-hidden border flex items-center justify-center bg-surface-elevated ${pathname.startsWith('/profile') ? 'border-[#6C47FF]' : 'border-white'}`}>
            {avatarUrl && !imgError ? (
              <img 
                src={avatarUrl} 
                alt="Profile" 
                className="object-cover w-full h-full"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
        <span className="text-[10px] font-bold font-['Outfit'] mt-1">Profile</span>
      </Link>
    ) : (
      <Link href="/login" className={`flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform ${pathname === '/login' ? 'text-[#6C47FF]' : 'text-text-secondary hover:text-[#6C47FF]'}`}>
        <User className="w-5 h-5" />
        <span className="text-[10px] font-bold font-['Outfit'] mt-1">Sign In</span>
      </Link>
    )}

  </div>
</div>

    {/* NEW: Auth Modal Overlay for Guest Users */}
    {showAuthModal && (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
        <div className="relative w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06)] flex flex-col p-8 text-center z-10">
          <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 p-2 bg-surface-base text-text-secondary hover:bg-[#E8E5FF] hover:text-brand-primary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-surface-base rounded-full flex items-center justify-center mx-auto mb-4 mt-2">
            <Plus className="w-6 h-6 text-text-primary" />
          </div>
          <h3 className="font-bold text-xl text-text-primary leading-tight font-['Outfit']">Wait a second!</h3>
          <p className="text-[15px] text-[#555570] mt-2 mb-6 font-normal font-['Switzer',sans-serif]">Please sign in to host your own events on the platform.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowAuthModal(false)} className="flex-1 bg-surface-base text-text-primary font-bold font-['Outfit'] py-3.5 rounded-full hover:bg-[#E8E5FF] transition-colors">
              Cancel
            </button>
            <Link href="/login?next=/events/new" onClick={() => setShowAuthModal(false)} className="flex-1 bg-brand-primary text-white font-bold font-['Outfit'] py-3.5 rounded-full hover:brightness-110 transition-colors flex items-center justify-center">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )}

    <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
}

export function Navbar({ variant = 'default' }: { variant?: 'default' | 'centered' }) {
  return (
    <Suspense fallback={null}>
      <NavbarInner variant={variant} />
    </Suspense>
  );
}