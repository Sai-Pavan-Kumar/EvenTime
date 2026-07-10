"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, CheckCircle, AlertTriangle } from "lucide-react";
import { FieldStatus, GeoResult } from "../types";

export function DrumColumn({ items, defaultIndex = 0, onSelect }: { items: string[]; defaultIndex?: number; onSelect: (val: string) => void; }) {
  const colRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (colRef.current) colRef.current.scrollTop = defaultIndex * 44; }, []);
  const handleScroll = () => {
    if (!colRef.current) return;
    const idx = Math.round(colRef.current.scrollTop / 44);
    if (items[idx]) onSelect(items[idx]);
  };
  return (
    <div ref={colRef} onScroll={handleScroll} className="h-[180px] overflow-y-scroll" style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none" }}>
      <div style={{ height: 68, flexShrink: 0 }} />
      {items.map((val, i) => (
        <div key={val} style={{ scrollSnapAlign: "center" }} className="h-[44px] flex items-center justify-center text-sm font-medium text-slate-400 cursor-pointer select-none" onClick={() => { if (colRef.current) colRef.current.scrollTop = i * 44; onSelect(val); }}>
          {val}
        </div>
      ))}
      <div style={{ height: 68, flexShrink: 0 }} />
    </div>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function MiniCalendar({ selectedDate, onSelect }: { selectedDate: Date | undefined; onSelect: (d: Date) => void; }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() || today.getMonth());
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const isSelected = (d: number) => selectedDate && selectedDate.getDate() === d && selectedDate.getMonth() === viewMonth && selectedDate.getFullYear() === viewYear;
  const isToday = (d: number) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  const isPast = (d: number) => new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/50">
        <span className="text-base font-bold text-slate-900">{MONTHS[viewMonth]} {viewYear}</span>
        <div className="flex gap-1">
          <button type="button" onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-primary hover:bg-[#6C47FF]/10 transition-colors">‹</button>
          <button type="button" onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-primary hover:bg-[#6C47FF]/10 transition-colors">›</button>
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => <div key={d} className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wide py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-[2px]">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1; const past = isPast(d); const selected = isSelected(d); const todayCell = isToday(d);
            return (
              <button key={d} type="button" disabled={past} onClick={() => onSelect(new Date(viewYear, viewMonth, d))} className={["aspect-square flex items-center justify-center text-[13px] rounded-lg transition-all", past ? "text-slate-300 cursor-not-allowed" : "cursor-pointer", selected ? "bg-[#6C47FF] text-white font-bold shadow-lg shadow-[#6C47FF]/30 scale-110 rounded-xl" : todayCell ? "font-bold text-brand-primary" : !past ? "text-slate-700 hover:bg-[#6C47FF]/10 hover:text-brand-primary hover:font-semibold" : ""].join(" ")}>{d}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function LocationSearch({ value, onChange }: { value: string; onChange: (val: string, lat?: number, lon?: number) => void; }) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowDropdown(false); };
    document.addEventListener("mousedown", handler); return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 3) { setResults([]); setShowDropdown(false); return; }
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`, { headers: { "Accept-Language": "en" } });
        const data: GeoResult[] = await res.json(); setResults(data); setShowDropdown(data.length > 0);
      } catch { setResults([]); } finally { setIsLoading(false); }
    }, 500);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (result: GeoResult) => {
    const parts = [result.address.city || result.address.town || result.address.village, result.address.state, result.address.country].filter(Boolean);
    const shortName = parts.join(", ") || result.display_name.split(",").slice(0, 3).join(",");
    setQuery(shortName);
    onChange(shortName, parseFloat(result.lat), parseFloat(result.lon));
    setShowDropdown(false); setResults([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input type="text" placeholder="Search city or venue..." value={query} onChange={e => { setQuery(e.target.value); onChange(e.target.value); }} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 pr-10 focus:ring-4 focus:ring-[#6C47FF]/10 focus:border-[#6C47FF] outline-none transition-all placeholder:text-slate-400" />
        {isLoading ? <Search className="absolute right-4 top-4 w-4 h-4 text-slate-400 animate-spin" /> : <MapPin className="absolute right-4 top-4 w-4 h-4 text-slate-400" />}
      </div>
      <AnimatePresence>
        {showDropdown && results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {results.map((r, i) => {
              const parts = [r.address.city || r.address.town || r.address.village, r.address.state, r.address.country].filter(Boolean);
              const label = parts.join(", ") || r.display_name.split(",").slice(0, 3).join(",");
              return (
                <button key={i} type="button" onClick={() => handleSelect(r)} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#6C47FF]/5 transition-colors text-left border-b border-slate-100 last:border-0">
                  <MapPin className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                  <div><div className="text-sm font-semibold text-slate-800 truncate">{label}</div></div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ConfidenceField({ status, children }: { status: FieldStatus; children: React.ReactNode }) {
  return (
    <div className={`relative transition-all rounded-xl ${status === "success" ? "ring-2 ring-green-400/40" : status === "warning" ? "ring-2 ring-amber-400/40" : ""}`}>
      {children}
      {status === "success" && (
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <CheckCircle className="w-4 h-4 text-green-500" />
        </div>
      )}
      {status === "warning" && (
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        </div>
      )}
    </div>
  );
}