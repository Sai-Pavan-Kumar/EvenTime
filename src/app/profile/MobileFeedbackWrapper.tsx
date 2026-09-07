"use client";
import { useState } from "react";
import { MessageSquare, ChevronRight } from "lucide-react";
import { FeedbackModal } from "@/components/layout/FeedbackModal";

export function MobileFeedbackWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="mx-1 my-2 p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100/80 flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-brand-primary shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 leading-snug">Help Us Shape EvenTime</h4>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">
              Spotted an issue or have an idea?
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full py-2 px-3 bg-white hover:bg-purple-50 text-brand-primary border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
        >
          <span>Share Feedback / Suggestion</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
