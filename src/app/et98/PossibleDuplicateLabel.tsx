import Link from "next/link";
import { AlertTriangle } from "@/components/icons";

type PossibleDuplicate = { id: string; slug: string | null; title: string };

export function PossibleDuplicateLabel({ event }: { event: PossibleDuplicate }) {
  return (
    <Link
      href={`/events/${event.slug || event.id}?from=admin`}
      className="mb-3 flex min-h-11 items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="line-clamp-2">Possible duplicate of: {event.title}</span>
    </Link>
  );
}
