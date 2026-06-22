"use client";

interface PlatformStats {
  event_count: number;
  city_count: number;
  category_count: number;
  user_count: number;
}

export function HeroSection({ stats }: { stats?: PlatformStats }) {
  return (
    <div className="relative w-full py-12 sm:py-16 lg:py-20 bg-[url('/hero-section.png')] bg-cover bg-bottom bg-no-repeat px-4 sm:px-8 text-center flex flex-col items-center justify-center">
      
      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col items-center justify-center">
        <div className="max-w-4xl w-full mx-auto relative flex flex-col items-center justify-center">
          
          {/* Applied the white halo text-shadow from Option B */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold text-[#1D1D1F] tracking-[-0.02em] leading-tight [text-shadow:_0_2px_24px_rgba(255,255,255,0.8),_0_0_48px_rgba(255,255,255,0.6)]">
            The Dictionary for
            <br />
            <span className="text-[#6C47FF]">Events.</span>
          </h1>
          
          {/* Adjusted max-width to 640px and kept text-shadow on paragraph */}
          <p className="mt-4 sm:mt-6 text-[#555570] drop-shadow-md font-medium text-sm md:text-base max-w-[640px] mx-auto leading-relaxed">
            Stop hunting across ten apps. <br className="sm:hidden" /> We&apos;ve already found what&apos;s happening — you just have to look here.
          </p>         
        </div>
      </div>
    </div>
  );
}
