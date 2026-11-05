"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

export function CityRanking({ cities, onChange }: { cities: string[]; onChange: (cities: string[]) => void }) {
  const swapWithNext = (index: number) => {
    const reordered = [...cities];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    onChange(reordered);
  };

  const moveButtonClass = "flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:text-slate-200 disabled:hover:bg-transparent";

  return (
    <ol className="mt-3 space-y-1">
      {cities.map((city, index) => (
        <li key={city} className="flex items-center gap-2.5 rounded-lg bg-white pl-3 text-sm font-semibold text-slate-900">
          <span className="w-4 text-xs font-bold text-slate-400">{index + 1}</span>
          <span className="min-w-0 flex-1 truncate">{city}</span>
          <button type="button" aria-label={`Move ${city} up`} disabled={index === 0} onClick={() => swapWithNext(index - 1)} className={moveButtonClass}>
            <ArrowUp className="h-4 w-4" />
          </button>
          <button type="button" aria-label={`Move ${city} down`} disabled={index === cities.length - 1} onClick={() => swapWithNext(index)} className={moveButtonClass}>
            <ArrowDown className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ol>
  );
}
