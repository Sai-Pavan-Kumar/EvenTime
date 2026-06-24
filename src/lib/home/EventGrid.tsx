import { EventCard } from "@/app/events/EventCard";
import { AnimatePresence } from "framer-motion";
import type { EventRow, ProfileRow } from "@/types";
import { getMatchLabel } from "@/lib/events/match";
import type { User } from "@supabase/supabase-js";

export interface EventGridProps {
  events: (Partial<EventRow> & { matchReason?: string })[];
  profile?: Partial<ProfileRow> | null;
  user?: User | null;
  isFeatured?: boolean;
  defaultMatchLabel?: string;
  useMatchLogic?: boolean;
  gridClass?: string;
  defaultImage?: string;
  isPastDateView?: boolean;
}

export function EventGrid({
  events,
  profile,
  user,
  isFeatured = false,
  defaultMatchLabel,
  useMatchLogic = false,
  gridClass = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6",
  defaultImage = "",
  isPastDateView = false,
}: EventGridProps) {

  // Applying horizontal scrolling strip conditionally based on isFeatured status
  const finalGridClass = isFeatured 
    ? (gridClass === "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" ? "flex overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory" : gridClass)
    : gridClass;

  return (
    <div className={finalGridClass}>
      <AnimatePresence>
        {events.map((event) => {
          const matchReason = useMatchLogic
          ? getMatchLabel(event as Partial<EventRow>, profile || null)
          : event.matchReason || defaultMatchLabel;

        return (
          <EventCard
            key={event.id}
            id={event.id as string}
            slug={event.slug || (event.id as string)}
            title={event.title!}
            category={event.category!}
            date={event.start_time ? `${event.date_string} · ${event.start_time}${event.end_time ? ` - ${event.end_time}` : ''}` : event.date_string!}
            city={event.location || event.city!}
            imageUrl={event.poster_url || defaultImage}
            organizerName={event.organizer_name || "Event Curator"}
            isFree={event.is_free!}
            isFeatured={event.is_featured || isFeatured}
            matchLabel={matchReason}
            audience={event.target_audience!}
            collegeName={(event as any).colleges?.name}
            interestedCount={0}
            isGuest={!user}
            layout={true}
            isPastDateView={isPastDateView}
            userRole={profile?.role as string | undefined}
          />
        );
      })}
      </AnimatePresence>
    </div>
  );
}