"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const supabase = createClient();

  const handleLogin = async (provider: 'google' | 'github') => {
    if (!hasConsented) {
      toast.error("Please agree to the Data Collection Policy to continue.");
      return;
    }
    setIsLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider: provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <main className="min-h-screen bg-surface-base flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1040px] bg-white rounded-[32px] sm:rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row md:items-stretch"
      >
        {/* LEFT SIDE: BRANDING (Takes exactly 60% on Desktop) */}
        <div className="hidden md:flex md:w-[60%] bg-brand-primary p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
          {/* Aesthetic Background Glows */}
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/10 blur-[80px]" />
          <div className="absolute bottom-[-10%] left-[-20%] w-[400px] h-[400px] rounded-full bg-black/10 blur-[60px]" />

          {/* Top Logo */}
          <div className="relative z-10 w-16 h-16">
            <Image src="/logo1.webp" alt="EvenTime" fill sizes="64px" className="object-contain" priority />
          </div>

          {/* Center Pitch */}
          <div className="relative z-10 mt-auto mb-16">
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight mb-6 font-heading">
              Stop Searching.<br />Start Attending.
            </h1>
            <p className="text-white/80 text-lg font-medium max-w-[340px] leading-relaxed font-sans">
              The ultimate stage for Gen-Z curators and seekers to discover the best events.
            </p>
          </div>

          {/* Bottom Footer Area */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-1 w-8 bg-white/30 rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">EvenTime Engine • Secure</span>
          </div>
        </div>

        {/* RIGHT SIDE: FAST 1-CLICK AUTH (Takes exactly 40% on Desktop) */}
        <div className="w-full md:w-[40%] p-8 sm:p-12 md:p-10 lg:p-12 flex flex-col justify-center bg-white relative z-20">
          {/* Mobile Logo */}
          <div className="md:hidden w-14 h-14 relative mb-8">
            <Image src="/logo1.webp" alt="EvenTime" fill sizes="56px" className="object-contain" priority />
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-brand-primary text-xs font-bold font-heading mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Fast 1-Click Access
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 font-heading">Sign In to EvenTime</h2>
            <p className="text-slate-500 text-sm font-medium">Continue with your preferred developer or social profile.</p>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-3 mb-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <input
              type="checkbox"
              id="consent-social"
              checked={hasConsented}
              onChange={(e) => setHasConsented(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-[#6C47FF] outline-none cursor-pointer"
            />
            <label htmlFor="consent-social" className="text-xs text-slate-500 font-medium leading-relaxed cursor-pointer select-none">
              I consent to the collection of my email and profile details as per EvenTime&apos;s <Link href="/privacy" className="text-brand-primary font-bold hover:underline">Privacy Policy</Link>.
            </label>
          </div>

          {/* 1-Click OAuth Buttons */}
          <div className="flex flex-col gap-3.5">
            <button 
              onClick={() => handleLogin('google')} 
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200/90 py-4 px-6 rounded-2xl font-bold text-sm transition-all active:scale-98 shadow-xs hover:shadow-md disabled:opacity-50"
            >
              {isLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <button 
              onClick={() => handleLogin('github')} 
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 bg-[#18181B] hover:bg-black text-white py-4 px-6 rounded-2xl font-bold text-sm transition-all active:scale-98 shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {isLoading === 'github' ? (
                <div className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                  <span>Continue with GitHub</span>
                </>
              )}
            </button>
          </div>

          {/* Security Subtext */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Zero password risk • Instant encrypted session</span>
          </div>
        </div>
      </motion.div>
    </main>
  );
}