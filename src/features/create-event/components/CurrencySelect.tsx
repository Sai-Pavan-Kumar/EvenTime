"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "@/components/icons";
import { CURRENCIES } from "@/lib/eventPrice";

function SymbolBadge({ symbol, isActive }: { symbol: string; isActive?: boolean }) {
  return (
    <span className={`flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold ${isActive ? "bg-brand-primary text-white" : "bg-brand-primary/10 text-brand-primary"}`}>
      {symbol.trim()}
    </span>
  );
}

export function CurrencySelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const selected = CURRENCIES.find((currency) => currency.code === value) ?? CURRENCIES[0];

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [isOpen]);

  const open = () => {
    setActiveIndex(CURRENCIES.indexOf(selected));
    setIsOpen(true);
  };

  const pick = (code: string) => {
    onChange(code);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) return open();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => Math.min(Math.max(index + step, 0), CURRENCIES.length - 1));
    } else if (isOpen && event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (isOpen && event.key === "Enter") {
      event.preventDefault();
      pick(CURRENCIES[activeIndex].code);
    }
  };

  return (
    <div ref={rootRef} className={`relative shrink-0 ${isOpen ? "z-40" : ""}`} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Currency: ${selected.name}`}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        className={`flex min-h-12 items-center gap-1.5 rounded-md border bg-white pl-2 pr-2.5 text-sm font-semibold text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 ${isOpen ? "border-brand-primary ring-4 ring-brand-primary/10" : "border-slate-200"}`}
      >
        <SymbolBadge symbol={selected.symbol} />
        {selected.code}
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            aria-label="Currency"
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : 0.08 } }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute left-0 top-full mt-1.5 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
          >
            {CURRENCIES.map(({ code, symbol, name }, index) => (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={code === selected.code}
                onClick={() => pick(code)}
                onPointerMove={() => setActiveIndex(index)}
                className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 text-left ${index === activeIndex ? "bg-brand-primary/5" : ""}`}
              >
                <SymbolBadge symbol={symbol} isActive={code === selected.code} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${code === selected.code ? "text-brand-primary" : "text-slate-900"}`}>{code}</span>
                  <span className="block truncate text-xs text-slate-500">{name}</span>
                </span>
                {code === selected.code && <Check className="h-4 w-4 shrink-0 text-brand-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
