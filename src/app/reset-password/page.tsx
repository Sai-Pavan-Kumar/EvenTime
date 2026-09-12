"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen bg-surface-base flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[440px] bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8 sm:p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 text-brand-primary flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 font-heading">Passwords Retired</h2>
        <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">
          EvenTime uses fast, passwordless 1-click authentication with Google and GitHub. No passwords to remember or reset.
        </p>
        <Link
          href="/login"
          className="w-full bg-[#1D1D1F] hover:bg-black text-white py-3.5 sm:py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-slate-200 text-sm"
        >
          Go to Sign In <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </main>
  );
}