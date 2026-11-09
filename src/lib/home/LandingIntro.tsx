import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";

const HOW_IT_WORKS = [
  {
    title: "Tell us your city and interests",
    desc: "Your feed only shows what fits you. We never share your data.",
  },
  {
    title: "See every event in one list",
    desc: "Hackathons, meetups and fests from across the web, gathered so you stop hunting on ten sites.",
  },
  {
    title: "Post the ones you know about",
    desc: "Verified college and company domains go live instantly; others are checked by our team first.",
  },
];

const ACCOUNT_PERKS = [
  { title: "A feed for you", desc: "Events matched to your college, branch and goals." },
  { title: "ET Score leaderboard", desc: "Earn points for posting events people save." },
  { title: "Campus events", desc: "Private events for your college. Not listed? Add yours." },
];

// Shown to guests after the event feed: by then they have seen the product, so this only answers
// "how does it work" and "why sign in". Plain lists, because these are short facts, not features to sell.
export function LandingIntro() {
  return (
    <div className="pb-24 pt-12 md:pt-20 space-y-24 md:space-y-32">
      <section className="grid md:grid-cols-2 gap-10 md:gap-16 items-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700">
        <div>
          <h2 className="text-3xl md:text-5xl font-heading font-black text-slate-900 leading-tight tracking-[-0.02em]">
            How EvenTime works
          </h2>
          <p className="mt-5 text-lg text-slate-700 leading-relaxed">
            We built it after missing one too many great events we only heard about the day after.
          </p>
          <ol className="mt-10 space-y-7">
            {HOW_IT_WORKS.map((item) => (
              <li key={item.title}>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-base text-slate-700 leading-relaxed">{item.desc}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="relative w-full aspect-video">
          <Image src="/landing-assets/what1.webp" alt="EvenTime event feed on a laptop and phone" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain" />
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-10 md:gap-16 items-center rounded-3xl bg-brand-primary/5 p-6 sm:p-10 md:p-14">
        <div className="relative w-full aspect-square md:order-2 max-w-md mx-auto">
          <Image src="/landing-assets/benefits1.webp" alt="Personal event feed and leaderboard on a phone" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-contain" />
        </div>
        <div className="md:order-1">
          <h2 className="text-3xl md:text-5xl font-heading font-black text-slate-900 leading-tight tracking-[-0.02em]">
            Sign in for more
          </h2>
          <p className="mt-5 text-lg text-slate-700 leading-relaxed">
            Browsing is free. An account takes 10 seconds with Google.
          </p>
          <ul className="mt-8 space-y-6">
            {ACCOUNT_PERKS.map((perk) => (
              <li key={perk.title}>
                <h3 className="text-xl font-bold text-slate-900">{perk.title}</h3>
                <p className="mt-1.5 text-base text-slate-700 leading-relaxed">{perk.desc}</p>
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className="mt-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white transition-transform hover:bg-brand-hover active:scale-95"
          >
            Continue with Google <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
