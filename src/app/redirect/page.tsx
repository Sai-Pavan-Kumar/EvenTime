"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, ShieldAlert } from "lucide-react";

function RedirectContent() {
  const searchParams = useSearchParams();
  const to = searchParams.get("to") || "/";
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    if (seconds <= 0) {
      window.location.href = to;
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, to]);

  let displayUrl = to;
  try {
    displayUrl = new URL(to).hostname;
  } catch {
    // keep raw string if it's not a valid URL
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-slate-100 p-8 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#EDE8FF] flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-brand-primary" />
        </div>
        <h1 className="text-xl font-heading font-black text-slate-900">
          You'll be redirected to another page
        </h1>
        <p className="text-slate-500 font-medium text-sm">
          You're leaving EvenTime and heading to{" "}
          <span className="font-bold text-slate-700">{displayUrl}</span>.
          EvenTime isn't responsible for content on external sites.
        </p>
        <div className="text-4xl font-black text-brand-primary">{seconds}</div>
        
        <a 
          href={to}
          className="inline-flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-3 px-6 rounded-2xl hover:bg-[#5835e5] transition-all"
        >
          Continue now <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export default function RedirectPage() {
  return (
    <Suspense fallback={null}>
      <RedirectContent />
    </Suspense>
  );
}