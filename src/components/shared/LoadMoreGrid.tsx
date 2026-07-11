"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { EventCard } from "@/app/events/EventCard";

const PAGE_SIZE = 8;

export function LoadMoreGrid({
  events,
  gridClass,
  hideOrganizer = false,
}: {
  events: any[];
  gridClass: string;
  hideOrganizer?: boolean;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleEvents = events.slice(0, visibleCount);

  return (
    <div className="space-y-8">
      <div className={gridClass}>
        {visibleEvents.map((event: any) => (
          <EventCard
            key={event.id}
            id={event.id}
            slug={event.slug || event.id}
            title={event.title || "Untitled Event"}
            category={event.category || "General"}
            date={event.date_string || "TBA"}
            city={event.location || event.city || "Online"}
            imageUrl={event.poster_url || "/window.svg"}
            organizerName={event.organizer_name || "Organizer"}
            organizerUsername={event.profiles?.username}
            isFree={event.is_free ?? false}
            audience={event.target_audience ?? []}
            hideOrganizer={hideOrganizer}
          />
        ))}
      </div>

      {events.length > visibleCount && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:shadow-md hover:border-purple-200 hover:text-brand-primary transition-all flex items-center gap-2 group"
          >
            Load More
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      )}
    </div>
  );
}