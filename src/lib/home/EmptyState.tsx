import Link from "next/link";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  message: string;
  /** Animated SVG scene from ./illustrations. */
  illustration: ReactNode;
  buttonText?: string;
  showButton?: boolean;
  variant?: "default" | "foryou";
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({ 
  title, 
  message, 
  illustration,
  buttonText = "Host an Event", 
  showButton = true, 
  variant = "default",
  onAction,
  actionHref 
}: EmptyStateProps) {
  const isForYou = variant === "foryou";
  
  return (
    <div className={`flex flex-col items-center justify-center ${isForYou ? 'py-14 sm:py-16' : 'py-16 sm:py-20'} rounded-2xl px-4 sm:px-8 text-center bg-surface-card relative overflow-hidden w-full border border-slate-100/80 shadow-sm`}>
      {/* Background blobs for flair */}
      <div className="absolute top-[-50%] left-[-10%] w-64 h-64 md:w-96 md:h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-50%] right-[-10%] w-64 h-64 md:w-96 md:h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Scenes run edge to edge across the card: wide screens see the whole street, phones crop to its centre. */}
      <div className={`relative z-10 -mx-4 sm:-mx-8 ${isForYou ? '-mt-14 sm:-mt-16' : '-mt-16 sm:-mt-20'} mb-6 aspect-[10/3] min-h-48 max-h-80 w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)]`}>
        {illustration}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-xl mx-auto animate-in zoom-in-95 fade-in duration-700">

        {/* TITLE & DESCRIPTION - CLEAN SEPARATION, ZERO OVERLAPPING */}
        <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 font-heading mb-3 tracking-[-0.02em]">
          {title}
        </h3>
        
        <p className="text-slate-500 font-medium max-w-md mx-auto mb-8 text-sm md:text-base leading-relaxed">
          {message}
        </p>

        {showButton && (
          onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="bg-[#0F172A] hover:bg-black text-white px-8 py-3.5 rounded-full font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-black/10 cursor-pointer"
            >
              {buttonText}
            </button>
          ) : (
            <Link 
              href={actionHref || "/events/new"} 
              className="bg-[#0F172A] hover:bg-black text-white px-8 py-3.5 rounded-full font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-black/10"
            >
              {buttonText}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
