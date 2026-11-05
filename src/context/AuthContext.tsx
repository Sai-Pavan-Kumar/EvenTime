"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useState, useCallback, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface AuthProfile {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  user_type?: string | null;
  college?: string | null;
  college_id?: string | null;
  branch?: string | null;
  graduation_year?: string | number | null;
  goals?: string[] | null;
  preferred_cities?: string[] | null;
  is_onboarded?: boolean | null;
  et_score?: number | null;
}

interface AuthContextType {
  user: User | null;
  profile: AuthProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

const PROFILE_STORAGE_KEY = "et_cached_profile";

function getCachedProfile(): AuthProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedProfile(profile: AuthProfile | null) {
  if (typeof window === "undefined") return;
  try {
    if (profile) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem("et_cached_campus_events");
    }
  } catch {}
}

function hasAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("-auth-token") || document.cookie.includes("sb-");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Static pages are served as the guest version. Reading the cache in the first render made returning
  // users' browsers disagree with that HTML, and React rebuilt the whole page on every repeat visit.
  // A layout effect applies it right after hydration, before the browser paints.
  useLayoutEffect(() => {
    const cached = getCachedProfile();
    if (cached) setProfile(cached);
    else if (hasAuthCookie()) setIsLoading(true);
  }, []);

  const fetchProfile = useCallback(async (userId: string): Promise<AuthProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, role, user_type, college, college_id, branch, graduation_year, goals, preferred_cities, is_onboarded, et_score")
        .eq("id", userId)
        .maybeSingle();

      if (!error && data) {
        const fresh = data as AuthProfile;
        setProfile(fresh);
        setCachedProfile(fresh);
        return fresh;
      }
    } catch (err) {
      console.warn("[AuthContext] Error fetching profile:", err);
    }
    return null;
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[AuthContext] Sign out error:", err);
    } finally {
      setUser(null);
      setProfile(null);
      setCachedProfile(null);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(PROFILE_STORAGE_KEY);
          localStorage.removeItem("et_cached_campus_events");
          sessionStorage.clear();
        } catch {}
      }
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    // Fast-path: if no auth cookie exists, skip all network queries
    if (!hasAuthCookie()) {
      setUser(null);
      setProfile(null);
      setCachedProfile(null);
      setIsLoading(false);
    } else {
      // Auth cookie exists - verify session and fetch profile in one go
      supabase.auth.getUser()
        .then(async (res) => {
          if (!mounted) return;
          const currentUser = res?.data?.user ?? null;
          if (currentUser) {
            setUser(currentUser);
            await fetchProfile(currentUser.id);
          } else {
            setUser(null);
            setProfile(null);
            setCachedProfile(null);
          }
        })
        .catch((err) => {
          console.warn("[AuthContext] Error getting user:", err);
        })
        .finally(() => {
          if (mounted) setIsLoading(false);
        });
    }

    // Subscribe to auth state changes for real-time login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        // Supabase holds its auth lock while this callback runs, and a query needs that same lock.
        // Awaiting one here froze every Supabase call in the tab, so it runs after the lock is released.
        // The initial session is already covered by getUser() above.
        if (event !== "INITIAL_SESSION" && event !== "TOKEN_REFRESHED") {
          setTimeout(() => {
            if (mounted) void fetchProfile(currentUser.id);
          }, 0);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setCachedProfile(null);
      }

      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const isAdmin = useMemo(() => {
    return profile?.role === "admin" || profile?.user_type === "admin";
  }, [profile]);

  const value = useMemo(() => ({
    user,
    profile,
    isAdmin,
    isLoading,
    refreshProfile,
    signOut,
  }), [user, profile, isAdmin, isLoading, refreshProfile, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
