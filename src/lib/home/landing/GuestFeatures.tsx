import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Feature = { title: string; text: string; href?: string; action?: string };

// Split by what a visitor can do right now versus after a Google sign-in, because
// "do I need an account for this?" is the first question every feature raises.
const FREE_FEATURES: Feature[] = [
  { title: "Every event, one list", text: "Hackathons, meetups, conferences and college fests gathered from across the web.", href: "/search", action: "Search events" },
  { title: "Browse by city", text: "Every city has its own page of what's on, sorted by date.", href: "/cities", action: "See cities" },
  { title: "Calendar and WhatsApp in one tap", text: "Add any event to your calendar or send it to your group chat." },
];

const ACCOUNT_FEATURES: Feature[] = [
  { title: "A feed made for you", text: "Tell us your college, branch and goals, and your feed shows only what fits.", href: "/login", action: "Sign in with Google" },
  { title: "Save for later", text: "Keep the events you like in one saved list.", href: "/saved", action: "Your saved list" },
  { title: "Post an event", text: "Verified college and company emails go live instantly. Others are checked by our team first.", href: "/events/new", action: "Post an event" },
];

function FeatureList({ features, startAt }: { features: Feature[]; startAt: number }) {
  return (
    <ol className="mt-10 grid gap-x-16 gap-y-12 md:grid-cols-2 lg:grid-cols-6">
      {features.map((f, i) => (
        <li key={f.title} className="reveal grid grid-cols-[3rem_1fr] content-start gap-x-4 md:first:col-span-2 lg:col-span-2 lg:first:col-span-2 lg:nth-[n+4]:col-span-3">
          <span className="font-heading text-3xl font-black tabular-nums text-brand-primary">{String(startAt + i).padStart(2, "0")}</span>
          <div>
            <h4 className="font-heading text-2xl md:text-3xl font-black leading-tight text-[#0D0B1A]">{f.title}</h4>
            <p className="mt-2 text-lg leading-relaxed text-slate-700">{f.text}</p>
            {f.href && (
              <Link href={f.href} className="group mt-3 inline-flex min-h-11 items-center gap-1.5 text-base font-bold text-[#0D0B1A] underline decoration-brand-primary decoration-2 underline-offset-[6px]">
                {f.action} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function GuestFeatures() {
  return (
    <section className="bg-slate-50 text-[#0D0B1A] px-4 sm:px-6 lg:px-10 py-16 md:py-24">
      <div className="max-w-7xl mx-auto">
        <h2 className="reveal font-heading font-black tracking-[-0.03em] leading-[0.9] text-[clamp(44px,6.4vw,104px)]">
          What you can do.
        </h2>

        <h3 className="reveal mt-10 font-heading text-2xl md:text-3xl font-black">Free, no account needed</h3>
        <FeatureList features={FREE_FEATURES} startAt={1} />

        <h3 className="reveal mt-14 font-heading text-2xl md:text-3xl font-black">With a free Google sign-in</h3>
        <FeatureList features={ACCOUNT_FEATURES} startAt={FREE_FEATURES.length + 1} />
      </div>
    </section>
  );
}
