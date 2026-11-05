import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

interface CityHeroProps {
  heading: string;
  coverImage?: string;
  hostHref: string;
  hostLabel: string;
  // Null while there is nothing true to report: a failed load or an empty city
  stats: { upcoming: number; next: string; free: number } | null;
}

export function CityHero({ heading, coverImage, hostHref, hostLabel, stats }: CityHeroProps) {
  const statItems = stats && [
    { value: stats.upcoming, label: stats.upcoming === 1 ? "upcoming event" : "upcoming events" },
    { value: stats.next, label: "next event" },
    { value: stats.free, label: stats.free === 1 ? "free event" : "free events" },
  ];

  return (
    <section>
      <div className="relative h-44 md:h-64 bg-slate-800 overflow-hidden">
        {coverImage && (
          // Phones get the 640px copy: on a weak signal the 1600px banner alone took ~7s.
          // fetchPriority lets it download ahead of the JS that loads at the same time.
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet={coverImage.replace("/cities/covers/", "/cities/covers/sm/")}
            />
            <img
              src={coverImage}
              alt=""
              fetchPriority="high"
              className="w-full h-full object-cover object-bottom"
            />
          </picture>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/25" />

        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-11 md:pb-12 flex flex-col justify-between">
          <Link
            href="/cities"
            className="inline-flex items-center gap-1.5 w-fit min-h-11 px-3.5 rounded-full bg-black/40 text-white text-sm font-bold active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> All cities
          </Link>
          <h1 className="text-4xl md:text-6xl font-heading font-black text-white tracking-tight break-words">
            {heading}
          </h1>
        </div>
      </div>

      {statItems && (
        <div className="relative z-10 -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 md:px-8 md:py-5">
            <dl className="grid grid-cols-3 flex-1 md:flex md:gap-14">
              {statItems.map((item) => (
                <div key={item.label} className="flex flex-col-reverse min-w-0">
                  <dt className="text-slate-500 text-xs md:text-sm font-medium mt-0.5">{item.label}</dt>
                  <dd className="text-slate-900 text-xl md:text-3xl font-heading font-black whitespace-nowrap">{item.value}</dd>
                </div>
              ))}
            </dl>
            {/* Phones already have the Post button in the bottom bar */}
            <Link
              href={hostHref}
              className="hidden md:inline-flex items-center gap-2 min-h-11 px-5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 text-sm active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> {hostLabel}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
