import Image from "next/image";
import Link from "next/link";
import { Bookmark, Check, Eye, Pencil, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { DeleteEventForm } from "@/components/profile/DeleteEventForm";
import { getCategoryConfig } from "@/lib/category-config";
import type { ProfileEvent } from "./ProfileClient";

const ROW_ACTION_CLASS =
  "flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900";

const formatEventDate = (dateString: string | null) => (dateString ? format(parseISO(dateString), "EEE, MMM d, yyyy") : "Date TBA");

function EventThumbnail({ event }: { event: { title: string; category: string; poster_url: string | null } }) {
  return (
    <div className="relative aspect-[16/10] w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200/70 bg-slate-100 sm:w-32">
      <Image
        src={event.poster_url || getCategoryConfig(event.category).backgroundImage}
        alt=""
        fill
        unoptimized
        sizes="128px"
        className="object-cover"
      />
    </div>
  );
}

function ReviewStatus({ status }: { status: string }) {
  if (status === "pending") return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">In review</span>;
  if (status === "rejected") return <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Rejected</span>;
  return null;
}

function Metric({ icon: Icon, value, label }: { icon: typeof Users; value: number; label: string }) {
  return (
    <span title={label} className="inline-flex items-center gap-1 tabular-nums">
      <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
      {value}
      <span> {label}</span>
    </span>
  );
}

export function PostedEventRow({ event, deleteAction }: { event: ProfileEvent; deleteAction: (formData: FormData) => void }) {
  return (
    <li className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center">
        <EventThumbnail event={event} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-slate-900">{event.title}</h3>
            <ReviewStatus status={event.status} />
          </div>
          <p className="mt-1 text-[13px] text-slate-500">{formatEventDate(event.date_string)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500">
            <Metric icon={Check} value={event.registered_count || 0} label="registered" />
            <Metric icon={Users} value={event.interested_count || 0} label="interested" />
            <Metric icon={Bookmark} value={event.saved_count || 0} label="saved" />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 justify-end">
        <Link href={`/events/${event.slug}`} aria-label={`View ${event.title}`} title="View" className={ROW_ACTION_CLASS}>
          <Eye className="h-[18px] w-[18px]" />
        </Link>
        <Link href={`/events/${event.slug}/edit`} aria-label={`Edit ${event.title}`} title="Edit" className={ROW_ACTION_CLASS}>
          <Pencil className="h-[18px] w-[18px]" />
        </Link>
        <DeleteEventForm eventId={event.id} deleteAction={deleteAction} />
      </div>
    </li>
  );
}

export function LinkedEventRow({ event, isRegistered = false }: { event: any; isRegistered?: boolean }) {
  const place = event.is_virtual ? "Online" : event.city;
  return (
    <li>
      <Link href={`/events/${event.slug || event.id}`} className="-mx-3 flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-slate-50">
        <EventThumbnail event={event} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-slate-900">{event.title}</h3>
          <p className="mt-1 text-[13px] text-slate-500">
            {formatEventDate(event.date_string)}
            {place ? ` · ${place}` : ""}
          </p>
          {isRegistered && (
            <p className="mt-1 inline-flex items-center gap-1 text-[13px] text-slate-600">
              <Check className="h-3.5 w-3.5 text-brand-primary" /> Registered
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}
