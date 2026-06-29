import Link from "next/link";
import { SearchX } from "lucide-react";
import { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  message: string;
  icon?: ReactNode;
  buttonText?: string;
  showButton?: boolean;
  variant?: "default" | "foryou";
}

export function EmptyState({ 
  title, 
  message, 
  icon, 
  buttonText = "Host an Event", 
  showButton = true, 
  variant = "default" 
}: EmptyStateProps) {
  const isForYou = variant === "foryou";
  
  return (
    <div className={`flex flex-col items-center justify-center ${isForYou ? 'py-16' : 'py-20'} rounded-xl px-4 text-center bg-surface-card border border-dashed border-border-default relative overflow-hidden w-full`}>
      <div className="absolute top-[-50%] left-[-10%] w-64 h-64 md:w-96 md:h-96 bg-brand/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-50%] right-[-10%] w-64 h-64 md:w-96 md:h-96 bg-warning/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 fade-in duration-1000">
        <div className={`${isForYou ? 'w-20 h-20 rounded-lg' : 'w-24 h-24 rounded-xl'} bg-surface-base flex items-center justify-center mb-6 shadow-inner rotate-3 hover:rotate-0 transition-transform duration-500 border border-border-default`}>
          {icon || <SearchX className={`${isForYou ? 'w-8 h-8' : 'w-10 h-10'} text-text-muted`} />}
        </div>
        <h3 className={`${isForYou ? 'text-2xl sm:text-3xl' : 'text-3xl'} font-extrabold text-text-primary font-heading mb-4 tracking-[-0.02em]`}>
          {title}
        </h3>
        <p className="text-text-muted font-medium max-w-md mx-auto mb-8 text-sm md:text-base leading-relaxed">
          {message}
        </p>
       {showButton && (
          <Link href="/events/new" className="bg-text-primary hover:bg-black text-surface-card px-8 py-4 rounded-full font-bold transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-black/10">
            {buttonText}
          </Link>
        )}
      </div>
    </div>
  );
}