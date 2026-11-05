"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";

// text-base on phones: iOS Safari zooms the whole page when a focused input is under 16px.
export const FIELD_CLASS =
  "w-full min-h-12 rounded-md border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm font-medium text-slate-900 outline-none transition-colors placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10";

const SEARCHABLE_FROM_OPTIONS = 8;
// Roughly the open list's height: with less room than this below the trigger, it opens upward.
const LIST_ROOM_PX = 320;

export function RequiredMark() {
  return (
    <span className="ml-0.5 text-red-600">
      <span aria-hidden="true">*</span>
      <span className="sr-only"> required</span>
    </span>
  );
}

export function FieldLabel({ children, htmlFor, optional, count, max }: { children: ReactNode; htmlFor?: string; optional?: boolean; count?: number; max?: number }) {
  return (
    <div className="mb-2 flex min-h-5 items-center justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-800">
        {children}
        {!optional && <RequiredMark />}
      </label>
      {max !== undefined && (
        <span className={`text-xs tabular-nums ${(count ?? 0) >= max ? "font-semibold text-red-600" : "text-slate-400"}`}>
          {count ?? 0}/{max}
        </span>
      )}
    </div>
  );
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: () => void; label: string; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={onChange} className="flex min-h-11 w-full items-center justify-between gap-4 text-left">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {hint && <span className="mt-0.5 block text-[13px] leading-snug text-slate-500">{hint}</span>}
      </span>
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? "bg-brand-primary" : "bg-slate-300"}`}>
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string; icon?: ReactNode }[]; onChange: (value: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex min-h-12 gap-0.5 rounded-md bg-slate-100 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] px-3 text-sm font-semibold transition-colors ${
            value === option.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface SelectProps {
  id?: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  // Makes the choice removable: shown as the first row, and picking it sends "".
  emptyLabel?: string;
}

// Native selects can't be styled, and a 34-item phone wheel is slow to scroll, so long lists get a search box.
export function Select({ id, label, value, options, onChange, placeholder = "Select", emptyLabel }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [opensUp, setOpensUp] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();

  const isSearchable = options.length >= SEARCHABLE_FROM_OPTIONS;
  const matches = options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()));
  const rows = emptyLabel && !query ? ["", ...matches] : matches;

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    // Focusing on a touch screen would throw the keyboard up over the list before anyone asked to type.
    if (window.matchMedia("(pointer: fine)").matches) searchRef.current?.focus();
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [isOpen]);

  const open = () => {
    const bottom = triggerRef.current?.getBoundingClientRect().bottom ?? 0;
    setOpensUp(window.innerHeight - bottom < LIST_ROOM_PX);
    setQuery("");
    setActiveIndex(Math.max(rows.indexOf(value), 0));
    setIsOpen(true);
  };

  const pick = (next: string) => {
    onChange(next);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        open();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => Math.min(Math.max(index + step, 0), rows.length - 1));
    } else if (event.key === "Enter" && rows[activeIndex] !== undefined) {
      event.preventDefault();
      pick(rows[activeIndex]);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${isOpen ? "z-40" : ""}`} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label}: ${value || placeholder}`}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        className={`${FIELD_CLASS} flex items-center justify-between gap-2 text-left ${isOpen ? "border-brand-primary ring-4 ring-brand-primary/10" : ""}`}
      >
        <span className={`truncate ${value ? "" : "font-normal text-slate-400"}`}>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: opensUp ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transition: { duration: 0.08 } }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`absolute left-0 min-w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl ${opensUp ? "bottom-full mb-1.5" : "top-full mt-1.5"}`}
          >
            {isSearchable && (
              <div className="flex items-center gap-2 border-b border-slate-100 px-3">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  aria-label={`Search ${label}`}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder="Search"
                  className="min-h-11 w-full bg-transparent text-base sm:text-sm outline-none placeholder:text-slate-400"
                />
              </div>
            )}
            <div role="listbox" aria-label={label} className="max-h-60 overflow-y-auto overscroll-contain p-1">
              {rows.map((row, index) => (
                <button
                  key={row || "empty"}
                  type="button"
                  role="option"
                  aria-selected={row === value}
                  onClick={() => pick(row)}
                  onPointerMove={() => setActiveIndex(index)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 whitespace-nowrap rounded-[8px] px-3 text-left text-sm ${
                    index === activeIndex ? "bg-slate-100" : ""
                  } ${row === value ? "font-semibold text-brand-primary" : "font-medium text-slate-700"}`}
                >
                  {row || emptyLabel}
                  {row === value && <Check className="h-4 w-4 shrink-0" />}
                </button>
              ))}
              {rows.length === 0 && <p className="px-3 py-3 text-sm text-slate-500">Nothing matches &quot;{query}&quot;</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
