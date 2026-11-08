import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

interface CityHeroProps {
  heading: string;
  cityImage?: string;
  hostHref: string;
  hostLabel: string;
  // Null while there is nothing true to report: a failed load or an empty city
  stats: { upcoming: number; next: string; free: number } | null;
}

export function CityHero({ heading, cityImage, hostHref, hostLabel, stats }: CityHeroProps) {
  const statItems = stats && [
    { value: stats.upcoming, label: stats.upcoming === 1 ? "upcoming event" : "upcoming events" },
    { value: stats.next, label: "next event" },
    { value: stats.free, label: stats.free === 1 ? "free event" : "free events" },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 md:pt-6">
      <Link
        href="/cities"
        className="inline-flex items-center gap-1.5 min-h-11 pr-3 text-slate-600 text-sm font-bold active:scale-95 transition-transform"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> All cities
      </Link>

      {/* Same card language as the /cities tile, so opening a city feels like that tile growing. */}
      <div className="mt-1 grid grid-cols-[96px_minmax(0,1fr)] md:grid-cols-[256px_minmax(0,1fr)_auto] items-center gap-x-3 md:gap-x-8 bg-white p-2 md:p-3 rounded-[16px] md:rounded-[20px] shadow-sm">
        <div className={`relative aspect-video overflow-hidden rounded-[8px] bg-slate-100 ${statItems ? "md:row-span-2" : ""}`}>
          {cityImage && <Image src={cityImage} alt="" fill priority className="object-cover" sizes="(min-width: 768px) 256px, 96px" />}
        </div>

        <h1 className={`text-2xl md:text-5xl font-heading font-black text-slate-900 tracking-tight break-words ${statItems ? "md:self-end" : ""}`}>
          {heading}
        </h1>

        {statItems && (
          <>
            <dl className="col-span-2 md:col-span-1 md:col-start-2 md:self-start grid grid-cols-3 md:flex md:gap-10 mt-3 md:mt-2 px-1 md:px-0 pb-1 md:pb-0">
              {statItems.map((item) => (
                <div key={item.label} className="flex flex-col-reverse min-w-0">
                  <dt className="text-slate-500 text-xs md:text-sm font-medium mt-0.5">{item.label}</dt>
                  <dd className="text-slate-900 text-xl md:text-2xl font-heading font-black whitespace-nowrap">{item.value}</dd>
                </div>
              ))}
            </dl>
            {/* Phones already have the Post button in the bottom bar */}
            <Link
              href={hostHref}
              className="hidden md:inline-flex md:col-start-3 md:row-start-1 md:row-span-2 items-center gap-2 min-h-11 mr-3 px-5 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-primary/90 text-sm active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> {hostLabel}
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
