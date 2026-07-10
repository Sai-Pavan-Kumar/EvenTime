import Image from "next/image";
import { Star, CalendarDays, Bell, TrendingUp, CheckCircle2 } from "lucide-react";

export function LandingIntro({ 
  isLeaderboardEnabled = false, 
  isSmartAlertsEnabled = false 
}: { 
  isLeaderboardEnabled?: boolean;
  isSmartAlertsEnabled?: boolean;
}) {
  return (
    <div className="w-full bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-slate-100 mb-16 mt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      
      {/* SECTION 1: What is it? */}
      <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
        <div className="flex-1 space-y-6 flex flex-col">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-brand-primary text-sm font-bold w-fit">
            <Star className="w-4 h-4 fill-current" /> What is EvenTime?
          </div>
          <h2 className="text-3xl md:text-5xl font-heading font-black text-slate-900 leading-tight">
            The only event directory you'll ever need.
          </h2>
          
          {/* MOBILE ONLY IMAGE - Appears exactly between heading and paragraph */}
          <div className="w-full relative aspect-video block md:hidden mt-2 mb-2">
            <Image 
              src="/landing-assets/what1.webp" 
              alt="What is EvenTime" 
              fill 
              className="object-contain"
            />
          </div>

          <p className="text-lg text-slate-500 leading-relaxed font-medium">
            Usually, finding great events means hunting across multiple websites, only to discover them after they've already ended. We've fixed that. EvenTime curates events across all categories into one single place so you never miss out again. You can even post events you know about and help build the library!
          </p>
        </div>
        
        {/* DESKTOP ONLY IMAGE - Appears normally on the right side */}
        <div className="flex-1 w-full relative aspect-video hidden md:block">
          <Image 
            src="/landing-assets/what1.webp" 
            alt="What is EvenTime" 
            fill 
            className="object-contain"
          />
        </div>
      </div>

      {/* SECTION 2: How it works */}
      <div className="mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-black text-slate-900">How to use it</h2>
          <p className="text-slate-500 mt-4 font-medium text-lg">Simple steps to get the most out of EvenTime.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Set Your Vibe", desc: "Create an account and securely share your location and interests (we never share your data).", icon: <SearchIcon className="w-6 h-6 text-brand-primary" /> },
            { step: "02", title: "Let The Magic Happen", desc: "Our system works its magic to curate and show only the events you'll love, so you don't miss out on your favorites.", icon: <CheckCircle2 className="w-6 h-6 text-brand-primary" /> },
            { step: "03", title: "Post & Share", desc: "Know an amazing event? Post it here! Verified domains go live instantly, while others are quickly approved by our admins.", icon: <CalendarDays className="w-6 h-6 text-brand-primary" /> }
          ].map((item, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-8 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-6 opacity-10 font-heading text-8xl font-black text-brand-primary group-hover:scale-110 transition-transform">
                {item.step}
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-6 relative z-10">
                {item.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 relative z-10">{item.title}</h3>
              <p className="text-slate-500 relative z-10 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Why we built it */}
      <div className="flex flex-col md:flex-row-reverse items-center gap-12 mb-24 bg-[#6C47FF]/5 rounded-3xl p-8 md:p-12">
        <div className="flex-1 space-y-6 flex flex-col">
            <h2 className="text-3xl md:text-5xl font-heading font-black text-slate-900 mb-6 leading-tight">
              The story behind EvenTime.
            </h2>

            {/* MOBILE ONLY IMAGE */}
            <div className="w-full relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-slate-100 block md:hidden mt-2 mb-2">
              <Image 
                src="/landing-assets/why1.webp" 
                alt="Why EvenTime" 
                fill 
                className="object-cover"
              />
            </div>

            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              How many times have you scrolled through reels or read a newspaper, only to realize an amazing event happened yesterday? We've all had that "I wish I went to that" feeling.
            </p>
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            That FOMO is exactly why <span className="font-bold text-brand-primary">The SurfBoard</span> team built EvenTime. To ensure you never miss out on the experiences that matter.
          </p>
        </div>
        
        {/* DESKTOP ONLY IMAGE */}
        <div className="flex-1 w-full relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-slate-100 hidden md:block">
          <Image 
            src="/landing-assets/why1.webp" 
            alt="Why EvenTime" 
            fill 
            className="object-cover"
          />
        </div>
      </div>

      {/* SECTION 4: Why Sign In? */}
      <div className="flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-8 flex flex-col">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-black text-slate-900 mb-4">
              Unlock the full experience
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              Guest mode is great, but an account is better. Takes 10 seconds via Google.
            </p>
          </div>

          {/* MOBILE ONLY IMAGE - exactly between heading and features list */}
          <div className="w-full relative aspect-square block md:hidden mt-2 mb-2">
            <Image 
              src="/landing-assets/benefits1.webp" 
              alt="EvenTime Benefits" 
              fill 
              className="object-contain"
            />
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Personalized Feed</h4>
                <p className="text-slate-500 font-medium">Events tailored to your college, branch, and goals.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    ET Score Leaderboard
                    {!isLeaderboardEnabled && (
                      <span className="text-[10px] bg-[#6C47FF] text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold whitespace-nowrap shrink-0">Coming Soon</span>
                    )}
                  </h4>
                  <p className="text-slate-500 font-medium">Earn points for attending events and climbing the ranks.</p>
                </div>
              </div>

              
          </div>
        </div>

        {/* DESKTOP ONLY IMAGE */}
        <div className="flex-1 w-full relative aspect-square hidden md:block">
          <Image 
            src="/landing-assets/benefits1.webp" 
            alt="EvenTime Benefits" 
            fill 
            className="object-contain"
          />
        </div>
      </div>
      
    </div>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}