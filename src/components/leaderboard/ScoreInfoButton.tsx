"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";

export function ScoreInfoButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded-full text-slate-600 transition-colors"
      >
        <Info className="w-3 h-3" /> How ET Score works
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[28px] shadow-2xl p-6 text-left">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-heading font-bold text-lg text-slate-900 mb-4">How ET Score works</h3>
            <div className="space-y-3 text-sm text-slate-600 font-medium">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Base score</span>
                <span className="font-bold text-slate-900">+100</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Completing your profile</span>
                <span className="font-bold text-slate-900">+50 (one-time)</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Each approved event</span>
                <span className="font-bold text-slate-900">+20</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Each unique save/interest on your event</span>
                <span className="font-bold text-slate-900">+10</span>
              </div>
              <div className="flex justify-between">
                <span>Confirmed spam event (5+ trusted reports)</span>
                <span className="font-bold text-red-500">−25</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}