"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated! Please sign in.");
      router.push("/login");
    }
  };

  return (
    <main className="min-h-screen bg-surface-base flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8 sm:p-12"
      >
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Set New Password</h2>
        <p className="text-slate-500 text-sm font-medium mb-8">Enter a new password for your account.</p>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
              <input
                type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-base border border-transparent rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 text-sm text-slate-900 focus:bg-white focus:border-[#E5E5EA] focus:ring-4 focus:ring-[#6C47FF]/10 outline-none font-medium transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium ml-1 mt-1">
              Min 6 characters, with uppercase, lowercase, a number & a symbol.
            </p>
          </div>

          <button
            type="submit" disabled={isLoading}
            className="w-full bg-[#1D1D1F] hover:bg-black disabled:bg-slate-300 text-white py-3.5 sm:py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-slate-200 mt-2 text-sm"
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <>Update Password <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </motion.div>
    </main>
  );
}