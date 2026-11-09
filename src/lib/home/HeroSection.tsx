import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";

// A first-time visitor decides in a few seconds. The brand line stays, but the sentence under it
// says plainly what this is, and the first action scrolls straight to real events below the fold.
export function HeroSection() {
  return (
    <div className="relative w-full bg-white overflow-hidden">
      {/* Wide screens only: below 1024px the stage art runs under the sentence, so tablets get the stacked phone layout */}
      <div className="absolute inset-0 z-0 hidden lg:block">
        <Image
          src="/hero-section-v2.webp"
          alt=""
          fill
          priority
          quality={75}
          sizes="100vw"
          className="object-cover object-right-bottom"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col lg:flex-row lg:items-start lg:min-h-[540px]">
        <div className="w-full px-4 sm:px-8 pt-10 lg:pt-12 lg:w-1/2 text-left motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
          <h1 className="text-4xl leading-[1.05] sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-extrabold text-text-primary tracking-[-0.03em]">
            The directory for <span className="text-brand-primary">events.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-slate-700 font-medium">
            Hackathons, meetups, conferences and college fests in your city, all in one place. Free to browse, no sign-up needed.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="#events"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white transition-transform hover:bg-brand-hover active:scale-95"
            >
              Browse events <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/events/new"
              className="inline-flex min-h-11 items-center rounded-full bg-slate-100 px-6 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-200 active:scale-95"
            >
              Post an event
            </Link>
          </div>
        </div>

        {/* 828px copy: images are served unoptimized (no Vercel quota), so phones need their own small file */}
        <div className="w-full lg:hidden relative aspect-[2.5/1] mt-6">
          <Image
            src="/hero-section-v2-sm.webp"
            alt=""
            fill
            priority
            quality={75}
            sizes="100vw"
            className="object-contain object-bottom"
          />
        </div>
      </div>
    </div>
  );
}
