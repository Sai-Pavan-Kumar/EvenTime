"use client";
import { useState } from "react";
import { Bug } from "lucide-react";
import { FeedbackModal } from "@/components/layout/FeedbackModal";

export function MobileFeedbackWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="flex lg:hidden items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all w-full text-left"
      >
        <Bug className="w-4 h-4" /> Report Bug / Feedback
      </button>
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}