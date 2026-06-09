"use client";

import dynamic from "next/dynamic";
import type { EventRow } from "@/types";

// Rename the dynamic import to 'MapComponent' to avoid conflict
const MapComponent = dynamic(() => import("@/components/map/EventsMap"), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-slate-100 rounded-3xl animate-pulse" />
});

export default function EventsMapWrapper({ events }: { events: Partial<EventRow>[] }) {
  // Pass the events to the dynamic MapComponent
  return <MapComponent events={events} />;
}