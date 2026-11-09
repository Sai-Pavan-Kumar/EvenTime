"use client";
import { useState } from "react";
import { MessageSquare } from "@/components/icons";
import { FeedbackModal } from "@/components/layout/FeedbackModal";

export function MobileFeedbackWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-[15px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
      >
        <MessageSquare className="h-[18px] w-[18px] shrink-0 text-slate-400" /> Share feedback
      </button>
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
