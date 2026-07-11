"use client";

import { useMemo, useState } from "react";
import { LoadMoreGrid } from "@/components/shared/LoadMoreGrid";

export function CuratorEventsTabs({ events }: { events: any[] }) {
  const [tab, setTab] = useState<"live" | "archive">("live");

  const { liveEvents, archiveEvents } = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const live = events
      .filter((e) => (e.date_string || "") >= todayStr)
      .sort((a, b) => (a.date_string || "").localeCompare(b.date_string || ""));
    const archive = events
      .filter((e) => (e.date_string || "") < todayStr)
      .sort((a, b) => (b.date_string || "").localeCompare(a.date_string || ""));
    return { liveEvents: live, archiveEvents: archive };
  }, [events]);

  const gridClass = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";

  return (
    <div className="space-y-6">
      <div className="inline-flex bg-slate-100 rounded-full p-1 gap-1">
        <button
          onClick={() => setTab("live")}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
            tab === "live" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Live ({liveEvents.length})
        </button>
        <button
          onClick={() => setTab("archive")}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
            tab === "archive" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Archive ({archiveEvents.length})
        </button>
      </div>

      {tab === "live" ? (
        liveEvents.length > 0 ? (
          <LoadMoreGrid events={liveEvents} gridClass={gridClass} hideOrganizer />
        ) : (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-[#E5E5EA]">
            <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">No live events right now</p>
          </div>
        )
      ) : archiveEvents.length > 0 ? (
        <LoadMoreGrid events={archiveEvents} gridClass={gridClass} hideOrganizer hidePastBadge />
      ) : (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-[#E5E5EA]">
          <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">No past events yet</p>
        </div>
      )}
    </div>
  );
}