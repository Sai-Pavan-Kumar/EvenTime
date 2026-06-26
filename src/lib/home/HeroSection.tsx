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
    <div className="relative w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[480px] px-4 sm:px-8 text-center flex flex-col items-center justify-center overflow-hidden bg-white">
      
      {/* Background Image Layer: Full image without cropping */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/hero-section-v2.png" 
          alt="EvenTime Hero Background" 
          fill
          priority
          unoptimized={true}
          className="object-contain object-bottom sm:object-cover w-full h-full"
        />
      </div>
      
      {/* Text Layer */}
      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col items-center justify-center py-16 sm:py-20">
        <div className="max-w-4xl w-full mx-auto relative flex flex-col items-center justify-center">
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold text-[#1D1D1F] tracking-[-0.02em] leading-tight [text-shadow:_0_2px_24px_rgba(255,255,255,0.8),_0_0_48px_rgba(255,255,255,0.6)]">
            The Dictionary for
            <br />
            <span className="text-[#6C47FF]">Events.</span>
          </h1>    
        </div>
      </div>
    </div>
  );
}