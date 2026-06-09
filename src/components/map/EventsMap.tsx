"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { EventRow } from "@/types";
import "leaflet/dist/leaflet.css"; // ✅ Keep only this — remove the <style> @import below

export default function EventsMap({ events }: { events: Partial<EventRow>[] }) {
  const [MapComponents, setMapComponents] = useState<Record<string, any> | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    if (mapInstance) {
      const timers = [100, 500, 1000].map(t =>
        setTimeout(() => mapInstance.invalidateSize(), t)
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [mapInstance]);

  useEffect(() => {
    Promise.all([
      import("react-leaflet"),
      import("leaflet")
    ]).then(([reactLeaflet, L]) => {
      const createCustomIcon = (isFree: boolean) => new L.DivIcon({
        className: "custom-leaflet-pin",
        html: `<div style="
          background-color: ${isFree ? '#6C47FF' : '#1D1D1F'}; 
          width: 24px; height: 24px; border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });

      setMapComponents({
        MapContainer: reactLeaflet.MapContainer,
        TileLayer: reactLeaflet.TileLayer,
        Marker: reactLeaflet.Marker,
        Popup: reactLeaflet.Popup,
        createCustomIcon
      });
    });
  }, []);

  if (!MapComponents) {
    return (
      <div className="w-full h-[60vh] min-h-[500px] rounded-3xl bg-slate-100 animate-pulse border border-slate-200 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#6C47FF]/30 border-t-[#6C47FF] rounded-full animate-spin" />
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, createCustomIcon } = MapComponents;
  const defaultCenter: [number, number] = [17.3850, 78.4867];

  return (
    // ✅ Removed the <style> tag with @import entirely
    <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="w-full h-full z-0"
        scrollWheelZoom={false}
        ref={setMapInstance}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">Carto</a>'
          maxZoom={19}
        />
        {events.map((event) => {
          if (!event.lat || !event.lon) return null;
          return (
            <Marker
              key={event.id}
              position={[event.lat, event.lon]}
              icon={createCustomIcon(event.is_free)}
            >
              <Popup className="rounded-xl overflow-hidden shadow-xl border-none">
                <div className="p-1 min-w-[200px]">
                  <span className="text-[9px] font-extrabold text-[#6C47FF] uppercase tracking-widest block mb-1">
                    {event.category}
                  </span>
                  <h3 className="font-bold text-slate-900 leading-tight mb-2">{event.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3">
                    <CalendarDays className="w-3 h-3" />
                    {event.date_string ? format(parseISO(event.date_string), "MMM d") : "TBA"}
                  </div>
                  <Link
                    href={`/events/${event.slug || event.id}`}
                    className="w-full bg-[#1D1D1F] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    View Details <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg border border-slate-100 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#6C47FF] border border-white" />
          <span className="text-xs font-bold text-slate-700">Free</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#1D1D1F] border border-white" />
          <span className="text-xs font-bold text-slate-700">Paid</span>
        </div>
      </div>
    </div>
  );
}