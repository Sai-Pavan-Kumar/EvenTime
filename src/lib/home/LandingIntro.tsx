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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-[#6C47FF] text-sm font-bold w-fit">
            <Star className="w-4 h-4 fill-current" /> What is EvenTime?
          </div>
          <h2 className="text-3xl md:text-5xl font-heading font-black text-slate-900 leading-tight">
            India's cleanest directory for <br />
            college, tech, startup <br />
            & all other event categories.
          </h2>
          
          {/* MOBILE ONLY IMAGE - Appears exactly between heading and paragraph */}
          <div className="w-full relative aspect-video block md:hidden mt-2 mb-2">
            <Image 
              src="/landing-assets/what1.png" 
              alt="What is EvenTime" 
              fill 
              className="object-contain"
            />
          </div>

          <p className="text-lg text-slate-500 leading-relaxed font-medium">
            Stop hunting across ten different WhatsApp groups, LinkedIn posts, and Instagram stories. 
            We aggregate the best hackathons, fests, workshops, and startup mixers into one beautiful place.
          </p>
        </div>
        
        {/* DESKTOP ONLY IMAGE - Appears normally on the right side */}
        <div className="flex-1 w-full relative aspect-video hidden md:block">
          <Image 
            src="/landing-assets/what1.png" 
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
          <p className="text-slate-500 mt-4 font-medium text-lg">Three simple steps to never miss out again.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Discover", desc: "Filter by city, branch, or date. Find exactly what fits your vibe.", icon: <SearchIcon className="w-6 h-6 text-[#6C47FF]" /> },
            { step: "02", title: "Save & Track", desc: "Hit 'Save' or 'Interested' to build your personal event pipeline.", icon: <CheckCircle2 className="w-6 h-6 text-[#6C47FF]" /> },
            { step: "03", title: "Attend", desc: "Get alerts before it starts. Show up, network, and grow.", icon: <CalendarDays className="w-6 h-6 text-[#6C47FF]" /> }
          ].map((item, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-8 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-6 opacity-10 font-heading text-8xl font-black text-[#6C47FF] group-hover:scale-110 transition-transform">
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
          <div className="flex flex-col-reverse md:flex-row items-center gap-12 mb-24 bg-[#6C47FF]/5 rounded-3xl p-8 md:p-12">
          <div className="flex-1 w-full relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-slate-100">
            <Image 
              src="/landing-assets/why1.png" 
              alt="Why EvenTime" 
              fill 
              className="object-cover"
            />
          </div>
        <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-5xl font-heading font-black text-slate-900 mb-6 leading-tight">
              Built for event enthusiasts.
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              We were tired of finding out about an amazing event two days after registrations closed. 
              Information is scattered, and people lose out on opportunities simply because they didn't know. 
            </p>
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            That's why <span className="font-bold text-[#6C47FF]">The SurfBoard</span> team built EvenTime — to democratize access to opportunities.
          </p>
        </div>
      </div>

      {/* SECTION 4: Why Sign In? */}
      <div className="flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-black text-slate-900 mb-4">
              Unlock the full experience
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              Guest mode is great, but an account is better. Takes 10 seconds via Google.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-[#6C47FF]" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Personalized Feed</h4>
                <p className="text-slate-500 font-medium">Events tailored to your college, branch, and goals.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-[#6C47FF]" />
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

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#6C47FF]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    Smart Alerts
                    {!isSmartAlertsEnabled && (
                      <span className="text-[10px] bg-[#6C47FF] text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold whitespace-nowrap shrink-0">Coming Soon</span>
                    )}
                  </h4>
                <p className="text-slate-500 font-medium">Get notified before registrations close for your saved events.</p>
              </div>
            </div>
          </div>
        </div>
          <div className="flex-1 w-full relative aspect-square">
            <Image 
              src="/landing-assets/benefits1.png" 
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