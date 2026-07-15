"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const router = useRouter();
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

   const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!hasConsented) {
      toast.error("Please agree to the Data Collection Policy to continue.");
      return;
    }
    if (isLockedOut) {
      toast.error("Too many failed attempts. Please wait before trying again.");
      return;
    }

    setIsLoading('email');
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        // Calculate exponential cooldown: 30s, 60s, 120s, etc.
        const penaltyMultiplier = Math.pow(2, newAttempts - 3);
        const cooldownMs = 30000 * penaltyMultiplier;
        
        toast.error(`Too many failed attempts. Please wait ${cooldownMs / 1000} seconds before trying again.`);
        setIsLockedOut(true);
        
        setTimeout(() => {
          setIsLockedOut(false);
          // We don't reset attempts here, so the next failure triggers a longer cooldown
        }, cooldownMs);
      } else {
        toast.error(isSignUp ? error.message : "Invalid email or password.");
      }
      setIsLoading(null);
    } else if (isSignUp) {
      setIsLoading(null);
      toast.success("Account created! Check your email to confirm, then sign in.");
      setIsSignUp(false);
    } else {
      setAttempts(0); // Reset attempts on success
      router.push("/");
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen bg-surface-base flex items-center justify-center p-4 sm:p-8">
      {/* THE PERFECT 2:1 SPLIT LAYOUT
        - Desktop: max-width 1040px, fixed height 600px (Prevents vertical stretching)
        - Mobile: auto height, vertical stack
      */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1040px] bg-white rounded-[32px] sm:rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row md:h-[600px]"
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
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight mb-6">
              Stop Searching.<br />Start Attending.
            </h1>
            <p className="text-white/80 text-lg font-medium max-w-[340px] leading-relaxed">
              The ultimate stage for Gen-Z curators and seekers to discover the best events.
            </p>
          </div>

          {/* Bottom Footer Area */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-1 w-8 bg-white/30 rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">EvenTime Engine • Secure</span>
          </div>
        </div>

        {/* RIGHT SIDE: LOGIN FORM (Takes exactly 40% on Desktop) */}
        <div className="w-full md:w-[40%] p-8 sm:p-12 md:p-10 lg:p-12 flex flex-col justify-center bg-white relative z-20">
          
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="md:hidden w-14 h-14 relative mb-8">
            <Image src="/logo1.webp" alt="EvenTime" fill sizes="56px" className="object-contain" priority />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{isSignUp ? "Sign Up" : "Sign In"}</h2>
            <p className="text-slate-500 text-sm font-medium">{isSignUp ? "Create your curator account." : "Access your curator dashboard."}</p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                <input 
                  type="email" name="email" required placeholder="name@email.com" 
                  className="w-full bg-surface-base border border-transparent rounded-2xl px-12 py-3.5 sm:py-4 text-sm text-slate-900 focus:bg-white focus:border-[#E5E5EA] focus:ring-4 focus:ring-[#6C47FF]/10 outline-none font-medium transition-all"
                />
              </div>
            </div>

           <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"} name="password" required placeholder="••••••••" 
                  className="w-full bg-surface-base border border-transparent rounded-2xl pl-12 pr-12 py-3.5 sm:py-4 text-sm text-slate-900 focus:bg-white focus:border-[#E5E5EA] focus:ring-4 focus:ring-[#6C47FF]/10 outline-none font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isSignUp && (
                <p className="text-[11px] text-slate-400 font-medium ml-1 mt-1">
                  Min 6 characters, with uppercase, lowercase, a number & a symbol.
                </p>
              )}
            </div>
            <div className="flex items-start gap-3 mt-4 mb-2">
              <input 
                type="checkbox" 
                id="consent" 
                checked={hasConsented} 
                onChange={(e) => setHasConsented(e.target.checked)} 
                className="mt-1 w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-[#6C47FF] outline-none cursor-pointer"
              />
               <label htmlFor="consent" className="text-xs text-slate-500 font-medium leading-relaxed cursor-pointer select-none">
                  I consent to the collection of my email and profile details to personalize my event experience, as per the <a href="/privacy" className="text-brand-primary hover:underline">Privacy Policy</a>.
                </label>
            </div>
            <button 
              type="submit" disabled={!!isLoading || isLockedOut}
              className="w-full bg-[#1D1D1F] hover:bg-black disabled:bg-slate-300 text-white py-3.5 sm:py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-slate-200 mt-2 text-sm"
            >
               {isLoading === 'email' ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <>{isSignUp ? "Create Account" : "Login"} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 font-medium mt-4">
            {isSignUp ? "Already have an account?" : "New here?"}{" "}
             <button type="button" onClick={() => { setIsSignUp(!isSignUp); setResetMessage(null); }} className="text-brand-primary font-bold hover:underline">
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>

          {!isSignUp && (
            <div className="text-right -mt-2 mb-1">
              <button
                type="button"
                disabled={isResetLoading}
                onClick={async () => {
                  const emailInput = (document.querySelector('input[name="email"]') as HTMLInputElement)?.value;
                  if (!emailInput) {
                    setResetMessage("Enter your email above first.");
                    return;
                  }
                  setIsResetLoading(true);
                  setResetMessage(null);
                  await supabase.auth.resetPasswordForEmail(emailInput, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  setIsResetLoading(false);
                  setResetMessage("If an account exists with this email, a reset link has been sent.");
                }}
                className="text-xs font-bold text-brand-primary hover:underline disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>
          )}
          {!isSignUp && resetMessage && (
            <p className="text-[11px] text-slate-500 font-medium -mt-1 mb-2 text-right">
              {resetMessage}
            </p>
          )}

          {/* Clean Divider */}
          <div className="relative flex items-center justify-center my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <span className="relative bg-white px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Social</span>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleLogin('google')} className="flex items-center justify-center gap-2.5 bg-white border border-slate-200 py-3.5 rounded-2xl font-bold text-[13px] hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Google
            </button>
            <button onClick={() => handleLogin('github')} className="flex items-center justify-center gap-2.5 bg-white border border-slate-200 py-3.5 rounded-2xl font-bold text-[13px] hover:bg-slate-50 transition-all active:scale-95 shadow-sm text-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
              GitHub
            </button>
          </div>

        </div>
      </motion.div>
    </main>
  );
}