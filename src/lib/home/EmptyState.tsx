import Link from "next/link";
import Image from "next/image";

export interface EmptyStateProps {
  title: string;
  message: string;
  imageSrc?: string;
  buttonText?: string;
  showButton?: boolean;
  variant?: "default" | "foryou";
}

export function EmptyState({ 
  title, 
  message, 
  imageSrc = "/illustrations/empty_state3.webp", 
  buttonText = "Host an Event", 
  showButton = true, 
  variant = "default" 
}: EmptyStateProps) {
  const isForYou = variant === "foryou";
  
  return (
    <div className={`flex flex-col items-center justify-center ${isForYou ? 'py-16' : 'py-20'} rounded-xl px-4 text-center bg-surface-card relative overflow-hidden w-full`}>
      {/* Background blobs for flair */}
      <div className="absolute top-[-50%] left-[-10%] w-64 h-64 md:w-96 md:h-96 bg-brand/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-50%] right-[-10%] w-64 h-64 md:w-96 md:h-96 bg-warning/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 fade-in duration-1000">
        
        {/* BIG TECH PREMIUM ILLUSTRATION WITH BAKED TEXT */}
        <div className={`${isForYou ? 'w-64 h-48 md:w-80 md:h-64' : 'w-full max-w-[500px] aspect-[4/3]'} relative mb-8`}>
          <Image 
            src={imageSrc} 
            alt={title} 
            fill 
            className="object-contain" 
            priority
          />
        </div>

        {/* SR-ONLY TEXT (Visually hidden but screen-reader & SEO friendly) */}
        <div className="sr-only">
          <h3>{title}</h3>
          <p>{message}</p>
        </div>
       {showButton && (
          <Link href="/events/new" className="bg-text-primary hover:bg-black text-surface-card px-8 py-4 rounded-full font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-black/10">
            {buttonText}
          </Link>
        )}
      </div>
    </div>
  );
}