"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error("Global App Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface-basebase flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-sm border border-slate-100 max-w-md w-full flex flex-col items-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-heading font-black text-slate-900 mb-3 tracking-tight">
          Oops! Something broke.
        </h1>
        
        <p className="text-slate-500 font-medium text-base mb-8 leading-relaxed">
          We encountered an unexpected error on our end. Don't worry, the stage is still here.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 bg-text-primary hover:bg-black text-white px-6 py-3.5 rounded-full font-bold active:scale-95 transition-all shadow-md"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
          </button>
          
          <Link 
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3.5 rounded-full font-bold active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}