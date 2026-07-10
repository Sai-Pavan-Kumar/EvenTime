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
          src="/hero-section-v2.webp" 
          alt="EvenTime Hero Background" 
          fill
          priority
          unoptimized={true}
          // object-right-bottom ensures the stage (which is on the right) and the bottom edge are perfectly visible
          className="object-cover object-right-bottom"
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between md:min-h-[450px] lg:min-h-[550px]">
        
        {/* Text Layer: Left Aligned always. 
            Mobile: -mb-10 pulls the image up so text overlaps it (saves height).
            Desktop: mb-20 pushes the text upwards from center for better visibility. */}
        <div className="relative z-20 w-full px-4 sm:px-8 pt-12 -mb-10 sm:-mb-14 md:mt-0 md:mb-24 lg:mb-32 md:w-3/5 text-left">
          <h1 className="text-4xl leading-[1.1] sm:text-5xl md:text-6xl lg:text-[80px] font-heading font-extrabold text-text-primary tracking-[-0.02em] md:[text-shadow:_0_2px_24px_rgba(255,255,255,0.8),_0_0_48px_rgba(255,255,255,0.6)]">
            The Dictionary
            <br />
            for <span className="text-brand-primary">Events.</span>
          </h1>    
        </div>

        {/* Image Layer (MOBILE ONLY) - Added mb-16 so stats bar overlaps white space instead of image */}
        <div className="w-full md:hidden relative z-0 aspect-[2.5/1] mb-12 sm:mb-16">
          <Image 
            src="/hero-section-v2.webp" 
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
