"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, AlertTriangle } from "@/components/icons";
import { FieldStatus } from "../types";

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

export function MiniCalendar({ selectedDate, onSelect, minDate }: { selectedDate: Date | undefined; onSelect: (d: Date) => void; minDate?: Date; }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxAllowedDate = new Date(today);
  maxAllowedDate.setFullYear(today.getFullYear() + 1);

  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() || today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() || today.getMonth());

  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [selectedDate]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // A date filled from a link can be months away, so the calendar has to open on it.
  useEffect(() => {
    if (!selectedDate) return;
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [selectedDate]);

  const isMinMonth = viewYear <= today.getFullYear() && viewMonth <= today.getMonth();
  const isMaxMonth = viewYear > maxAllowedDate.getFullYear() || (viewYear === maxAllowedDate.getFullYear() && viewMonth >= maxAllowedDate.getMonth());

  const prevMonth = () => {
    if (isMinMonth) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (isMaxMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isSelected = (d: number) => selectedDate && selectedDate.getDate() === d && selectedDate.getMonth() === viewMonth && selectedDate.getFullYear() === viewYear;
  const isToday = (d: number) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  const isDateDisabled = (d: number) => {
    const target = new Date(viewYear, viewMonth, d);
    target.setHours(0, 0, 0, 0);
    return target < today || target > maxAllowedDate || Boolean(minDate && target < minDate);
  };
  
  return (
    <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
      <div className="flex items-center justify-between pl-4 pr-1 py-1 border-b border-slate-100">
        <span className="text-sm font-bold text-slate-900">{MONTHS[viewMonth]} {viewYear}</span>
        <div className="flex gap-1">
          <button type="button" disabled={isMinMonth} aria-label="Previous month" onClick={prevMonth} className="w-11 h-11 text-xl rounded-lg flex items-center justify-center text-brand-primary hover:bg-brand-primary/10 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed">‹</button>
          <button type="button" disabled={isMaxMonth} aria-label="Next month" onClick={nextMonth} className="w-11 h-11 text-xl rounded-lg flex items-center justify-center text-brand-primary hover:bg-brand-primary/10 transition-colors disabled:text-slate-300 disabled:cursor-not-allowed">›</button>
        </div>
      </div>
      <div className="px-2 py-2">
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => <div key={d} className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wide py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-[2px]">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1; const disabled = isDateDisabled(d); const selected = isSelected(d); const todayCell = isToday(d);
            return (
              <button key={d} type="button" disabled={disabled} onClick={() => onSelect(new Date(viewYear, viewMonth, d))} className={["aspect-square flex items-center justify-center text-[13px] rounded-lg transition-all", disabled ? "text-slate-300 cursor-not-allowed" : "cursor-pointer", selected ? "bg-brand-primary text-white font-bold" : todayCell ? "font-bold text-brand-primary" : !disabled ? "text-slate-700 hover:bg-brand-primary/10 hover:text-brand-primary hover:font-semibold" : ""].join(" ")}>{d}</button>
            );
          })}
        </div>
      </div>
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