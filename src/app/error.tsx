"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { RefreshCcw, Home } from "lucide-react";
import * as Sentry from "@sentry/nextjs";useEffect 

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global App Error:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="max-w-lg w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
        
        {/* PREMIUM ILLUSTRATION PLACEHOLDER */}
        <div className="relative w-56 h-56 md:w-72 md:h-72 mb-8 transition-transform duration-500 hover:scale-105">
          <Image 
            src="/illustrations/error_state.webp" 
            alt="Error Illustration" 
            fill 
            className="object-contain" 
            priority
          />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-heading font-black text-slate-900 mb-4 tracking-tight">
          Oops, a minor glitch!
        </h1>
        
        <p className="text-slate-500 font-medium text-base md:text-lg max-w-md mb-10 leading-relaxed">
          Something went wrong on our end. We're already on it, but the stage is still yours.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-8">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black hover:bg-slate-800 text-white px-8 py-4 rounded-full font-bold active:scale-95 transition-all shadow-xl shadow-black/10"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
          </button>
          
          <Link 
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-8 py-4 rounded-full font-bold active:scale-95 transition-all shadow-sm"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}