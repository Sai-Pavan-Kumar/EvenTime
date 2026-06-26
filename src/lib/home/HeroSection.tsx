"use client";

import Image from "next/image";

interface PlatformStats {
  event_count: number;
  city_count: number;
  category_count: number;
  user_count: number;
}

export function HeroSection({ stats }: { stats?: PlatformStats }) {
  return (
    <div className="relative w-full bg-white overflow-hidden">
      
      {/* Background Image Layer (DESKTOP ONLY) */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <Image 
          src="/hero-section-v3.png" 
          alt="EvenTime Hero Background" 
          fill
          priority
          unoptimized={true}
          // object-right ensures the stage (which is on the right) is always perfectly visible
          className="object-cover object-right"
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between md:min-h-[450px] lg:min-h-[550px]">
        
        {/* Text Layer: Left Aligned always */}
        <div className="w-full px-4 sm:px-8 pt-12 pb-4 md:py-0 md:w-3/5 text-left">
          <h1 className="text-[2.5rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-[80px] font-heading font-extrabold text-[#1D1D1F] tracking-[-0.02em] md:[text-shadow:_0_2px_24px_rgba(255,255,255,0.8),_0_0_48px_rgba(255,255,255,0.6)]">
            The Dictionary for
            <br />
            <span className="text-[#6C47FF]">Events.</span>
          </h1>    
        </div>

        {/* Image Layer (MOBILE ONLY) - Normal flow aspect ratio removes all white space! */}
        <div className="w-full md:hidden relative aspect-[2.5/1]">
          <Image 
            src="/hero-section-v2.png" 
            alt="EvenTime Hero Background" 
            fill
            priority
            unoptimized={true}
            className="object-contain object-bottom"
          />
        </div>

      </div>
    </div>
  );
}
