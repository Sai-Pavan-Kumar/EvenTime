import { MapPin } from "@/components/icons";
import type { EventRow } from "@/types";
import { parseEventDateString } from "@/lib/utils/date";

// Flat fields from the landing palette. A ticket never carries a photo: it is drawn from the
// event's own data, so what a visitor sees here is exactly what the app will show them.
const TONES = [
  { card: "bg-white text-[#0D0B1A]", chip: "bg-[#F1EDFF] text-[#4B3FD9]", day: "text-brand-primary" },
  { card: "bg-[#FFC83D] text-[#0D0B1A]", chip: "bg-[#0D0B1A] text-[#FFC83D]", day: "text-[#0D0B1A]" },
  { card: "bg-[#0D0B1A] text-white", chip: "bg-white/10 text-white", day: "text-[#FFC83D]" },
  { card: "bg-[#DCD3FF] text-[#0D0B1A]", chip: "bg-white text-[#4B3FD9]", day: "text-[#0D0B1A]" },
];

function priceLabel(e: Partial<EventRow>) {
  if (e.is_free || e.price === 0) return "Free";
  return e.price ? `₹${e.price}` : null;
}

export function EventTicket({ event, tone = 0, className = "" }: { event: Partial<EventRow>; tone?: number; className?: string }) {
  const t = TONES[tone % TONES.length];
  const date = event.date_string ? parseEventDateString(event.date_string) : null;
  const price = priceLabel(event);
  // Many listings repeat the city as the venue; show it once.
  const place = event.location && event.location !== event.city ? [event.location, event.city].filter(Boolean).join(", ") : event.city;

  // Every size is a share of the card's own width, so the ticket scales like a picture and
  // nothing can spill out of it on a small phone. Sizes are drawn for a 250px wide card.
  return (
    <div className="h-full [container-type:inline-size]">
      <div data-ui className={`flex h-full flex-col overflow-hidden rounded-[12cqw] p-[9cqw] ${t.card} ${className}`}>
        <div className="flex items-center justify-between gap-[4cqw]">
          <span className={`min-w-0 truncate rounded-full px-[5cqw] py-[1.6cqw] text-[5.6cqw] font-bold ${t.chip}`}>{event.category || "Event"}</span>
          {price && <span className="shrink-0 text-[5.6cqw] font-bold">{price}</span>}
        </div>

        <div className="mt-[7cqw] flex items-end gap-[4cqw]">
          <span className={`font-heading text-[25cqw] font-black leading-[0.8] tabular-nums ${t.day}`}>{date ? date.getDate() : "··"}</span>
          <span className="min-w-0 text-[6.4cqw] font-bold leading-tight">
            {date ? date.toLocaleDateString("en-IN", { month: "short" }) : "Date"}
            <span className="block font-medium opacity-70">{date ? date.toLocaleDateString("en-IN", { weekday: "short" }) : "soon"}</span>
          </span>
        </div>

        <p className="mt-[7cqw] line-clamp-2 font-heading text-[8cqw] font-black leading-tight">{event.title}</p>

        <span className="mt-auto flex min-w-0 items-center gap-[2cqw] text-[5.6cqw] font-medium opacity-80">
          <MapPin className="h-[6.4cqw] w-[6.4cqw] shrink-0" aria-hidden />
          <span className="truncate">{place || "Venue soon"}</span>
        </span>
      </div>
    </div>
  );
}
