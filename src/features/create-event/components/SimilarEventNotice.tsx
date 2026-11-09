import { ExternalLink } from "@/components/icons";
import type { SimilarEventCandidate } from "../utils/similarEvents";

// Opens in a new tab so checking the other event never costs the poster their half-filled form.
export function SimilarEventNotice({ event }: { event: SimilarEventCandidate }) {
  return (
    <div role="status" className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-bold text-slate-900">This event may already be listed</p>
      <a
        href={`/events/${event.slug || event.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 flex min-h-11 items-center gap-1.5 text-sm font-bold text-brand-primary hover:underline"
      >
        <span className="truncate">{event.title}</span>
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
      </a>
      <p className="text-sm text-slate-600">If it is a different event, you can still post it.</p>
    </div>
  );
}
