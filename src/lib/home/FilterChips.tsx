"use client";

import { useRouter } from "next/navigation";

export interface FilterChipsProps {
  dynamicChips: { name: string; value: string; count?: number }[];
  category?: string;
  q?: string;
  branch?: string;
}

export function FilterChips({ dynamicChips, category, q, branch }: FilterChipsProps) {
  const router = useRouter();
  if (!dynamicChips || dynamicChips.length === 0) return null;

  const activeChip = dynamicChips.find(c => c.value === (category || "")) || dynamicChips[0];

  return (
    <div className="relative flex items-center shrink-0">
      {/* VISUAL TEXT: Clean, minimal Apple-esque styling that flows with "Explore:" */}
      <div className="flex items-center gap-1 text-slate-900 text-sm font-bold pointer-events-none pr-1">
        <span>
          {activeChip.name} {typeof activeChip.count === 'number' ? `(${activeChip.count})` : ""}
        </span>
        <svg className="w-4 h-4 text-[#6C47FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* INVISIBLE NATIVE SELECT: Overlays exactly on top to catch clicks */}
      <select
        value={category || ""}
        onChange={(e) => {
          const val = e.target.value;
          const params = new URLSearchParams();
          if (val) params.set("category", val);
          if (q) params.set("q", q);
          if (branch) params.set("branch", branch);
          router.push(params.toString() ? `/?${params.toString()}` : "/");
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      >
        {dynamicChips.map((cat) => (
          <option key={cat.name} value={cat.value}>
            {cat.name} {typeof cat.count === 'number' ? `(${cat.count})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}