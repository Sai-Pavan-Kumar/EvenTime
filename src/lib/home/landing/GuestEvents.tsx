"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import type { EventRow } from "@/types";
import { EventGrid } from "@/lib/home/EventGrid";

const FIRST_BATCH_DESKTOP = 8;
const FIRST_BATCH_MOBILE = 4;
const LOAD_MORE_STEP = 4;
// Past this many, the list asks for a sign-in: enough to prove the product, not the whole catalogue.
const GUEST_EVENT_LIMIT = 12;
const MOBILE_QUERY = "(max-width: 767px)";

// The same cards a signed-in member sees, so the landing page shows the product as it is.
// Pulled up over the end of the pinned hero, so the list slides in as the stage fades
// instead of leaving a blank white screen between them.
export function GuestEvents({ events }: { events: Partial<EventRow>[] }) {
  const [shown, setShown] = useState(FIRST_BATCH_DESKTOP);
  const [askToSignIn, setAskToSignIn] = useState(false);

  // Set after mount so server and client agree. The list is far below the fold by then.
  useEffect(() => {
    if (window.matchMedia(MOBILE_QUERY).matches) setShown(FIRST_BATCH_MOBILE);
  }, []);

  const handleLoadMore = () => {
    const hasMore = shown < GUEST_EVENT_LIMIT && shown < events.length;
    if (hasMore) setShown(Math.min(shown + LOAD_MORE_STEP, GUEST_EVENT_LIMIT));
    else setAskToSignIn(true);
  };

  return (
    <section id="events" className="relative z-10 -mt-[50svh] scroll-mt-16 bg-white px-4 sm:px-6 lg:px-10 pt-16 pb-24 md:pb-32">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <h2 className="reveal font-heading font-black tracking-[-0.03em] leading-[0.9] text-[clamp(44px,7vw,104px)] text-[#0D0B1A]">
            Coming up next.
          </h2>
          <p className="reveal max-w-sm text-lg text-slate-700">The next events across India. Open any of them, no sign-up needed.</p>
        </div>

        <div className="mt-14">
          <EventGrid events={events.slice(0, shown)} profile={null} user={null} gridClass="spring-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" />
        </div>

        {askToSignIn ? (
          <div data-signin-prompt className="spring-pop mt-12 flex flex-col items-center gap-4 rounded-3xl bg-[#F1EDFF] p-8 text-center">
            <h3 className="font-heading text-2xl font-black text-[#0D0B1A]">Want to see every event?</h3>
            <p className="max-w-md text-base text-slate-700">Sign in with Google to see all events across India, with a feed made for you.</p>
            <Link href="/login" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-primary px-7 text-base font-bold text-white spring-press hover:-translate-y-0.5 active:scale-95">
              Sign in to view all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-12 flex justify-center">
            <button type="button" onClick={handleLoadMore} className="inline-flex min-h-12 cursor-pointer items-center rounded-full bg-[#0D0B1A] px-8 text-base font-bold text-white spring-press hover:-translate-y-0.5 active:scale-95">
              Load more
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
