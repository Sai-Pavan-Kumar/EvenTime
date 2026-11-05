import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { LinkedEventRow, PostedEventRow } from "./ProfileEventRows";
import type { ProfileEvent, ReportWithEventSlug } from "./ProfileClient";

const PAGE_SIZE = 8;

const TAB_HEADINGS: Record<string, { title: string; text: string }> = {
  posted: { title: "My events", text: "Everything you've posted, and how it's doing." },
  registered: { title: "Registrations", text: "Events you marked as registered." },
  saved: { title: "Saved", text: "Events you bookmarked for later." },
  alerts: { title: "Alerts", text: "Reports on your events that need a fix." },
};

function EmptyState({ image, title, text, action }: { image: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="relative mb-6 aspect-video w-full max-w-[240px]">
        <Image src={image} alt="" fill sizes="240px" className="object-contain" />
      </div>
      <h3 className="font-heading text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[15px] leading-relaxed text-slate-500">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="spring-press inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-primary px-5 text-[15px] font-medium text-white hover:-translate-y-0.5 active:scale-95"
    >
      {children}
    </Link>
  );
}

// Renders rows a page at a time, so a curator with hundreds of events doesn't load every poster at once.
function PagedList({ items, renderItem }: { items: any[]; renderItem: (item: any) => ReactNode }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  return (
    <>
      <ul className="divide-y divide-slate-100">{items.slice(0, visibleCount).map(renderItem)}</ul>
      {items.length > visibleCount && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="min-h-11 cursor-pointer rounded-full border border-slate-200 px-5 text-[15px] font-medium text-slate-900 transition-colors hover:bg-slate-50"
          >
            Show more
          </button>
        </div>
      )}
    </>
  );
}

function AlertRow({ report }: { report: ReportWithEventSlug }) {
  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-red-600" />
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium text-slate-900">{report.events?.title || "Unknown event"}</h3>
          <p className="mt-0.5 text-[13px] text-slate-500">Reported: {report.reason}</p>
        </div>
      </div>
      {report.events?.slug && (
        <Link
          href={`/events/${report.events.slug}/edit`}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-black"
        >
          Fix event
        </Link>
      )}
    </li>
  );
}

export function ProfileContent({
  activeTab,
  myEvents,
  savedEvents,
  registeredEvents,
  reports,
  deleteAction,
}: {
  activeTab: string;
  myEvents: ProfileEvent[];
  savedEvents: any[];
  registeredEvents: any[];
  reports: ReportWithEventSlug[];
  deleteAction: (formData: FormData) => void;
}) {
  const heading = TAB_HEADINGS[activeTab] ?? TAB_HEADINGS.posted;

  return (
    <section>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold tracking-tight text-slate-900">{heading.title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{heading.text}</p>
        </div>
        {activeTab === "posted" && myEvents.length > 0 && (
          <Link
            href="/events/new"
            aria-label="Post an event"
            className="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 sm:w-auto sm:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Post an event</span>
          </Link>
        )}
      </div>

      {activeTab === "posted" &&
        (myEvents.length > 0 ? (
          <PagedList items={myEvents} renderItem={(event) => <PostedEventRow key={event.id} event={event} deleteAction={deleteAction} />} />
        ) : (
          <EmptyState
            image="/empty-profile.webp"
            title="No events yet"
            text="Post your first event and you'll track its saves and registrations here."
            action={<PrimaryLink href="/events/new"><Plus className="h-4 w-4" /> Post an event</PrimaryLink>}
          />
        ))}

      {activeTab === "registered" &&
        (registeredEvents.length > 0 ? (
          <PagedList items={registeredEvents} renderItem={(event) => <LinkedEventRow key={event.id} event={event} isRegistered />} />
        ) : (
          <EmptyState
            image="/Empty_saved.webp"
            title="No registrations yet"
            text='Tap "Mark as Registered" on an event you applied to, and it stays here so you never lose track.'
            action={<PrimaryLink href="/">Find events</PrimaryLink>}
          />
        ))}

      {activeTab === "saved" &&
        (savedEvents.length > 0 ? (
          <PagedList items={savedEvents} renderItem={(event) => <LinkedEventRow key={event.id} event={event} />} />
        ) : (
          <EmptyState
            image="/Empty_saved.webp"
            title="Nothing saved yet"
            text="Tap the bookmark on any event to keep it here."
            action={<PrimaryLink href="/">Find events</PrimaryLink>}
          />
        ))}

      {activeTab === "alerts" &&
        (reports.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {reports.map((report) => <AlertRow key={report.id} report={report} />)}
          </ul>
        ) : (
          <EmptyState image="/Empty_alerts.webp" title="No alerts" text="Nobody has reported a problem with your events." />
        ))}
    </section>
  );
}
