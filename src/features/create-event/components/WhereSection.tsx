"use client";

import { MapPin, Video } from "lucide-react";
import { CITIES } from "@/lib/constants/cities";
import { FIELD_CLASS, FieldLabel, Segmented, Select } from "./FormControls";

const FORMAT_OPTIONS = [
  { value: "in-person", label: "In person", icon: <MapPin className="h-4 w-4" /> },
  { value: "online", label: "Online", icon: <Video className="h-4 w-4" /> },
];

export function WhereSection({ data, updateData }: any) {
  // location falls back to the city when no venue is typed, so the box must not show the city as a venue.
  const venue = data.location && data.location !== data.city ? data.location : "";

  return (
    <div className="space-y-5">
      <Segmented
        label="Event format"
        value={data.isOnline ? "online" : "in-person"}
        options={FORMAT_OPTIONS}
        onChange={(format) => updateData({ isOnline: format === "online" })}
      />
      {data.isOnline ? (
        <p className="text-[13px] leading-snug text-slate-600">Online events need a registration link, so people know where to join.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel>City</FieldLabel>
            <Select
              id="event-city-select"
              label="City"
              placeholder="Select city"
              value={data.city || ""}
              options={CITIES}
              onChange={(city) => updateData({ city, location: venue || city })}
            />
          </div>
          <div>
            <FieldLabel htmlFor="event-venue-input" optional count={venue.length} max={150}>Venue</FieldLabel>
            <input
              id="event-venue-input"
              type="text"
              value={venue}
              maxLength={150}
              onChange={(e) => updateData({ location: e.target.value.trim() ? e.target.value : data.city })}
              placeholder="Address or campus landmark"
              className={FIELD_CLASS}
            />
          </div>
        </div>
      )}
    </div>
  );
}
