"use client";

import { Trash2 } from "@/components/icons";

export function DeleteEventForm({ 
  eventId, 
  deleteAction 
}: { 
  eventId: string, 
  deleteAction: (formData: FormData) => void 
}) {
  return (
    <form action={deleteAction} onSubmit={(e) => {
      if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
        e.preventDefault();
      }
    }}>
      <input type="hidden" name="eventId" value={eventId} />
      <button type="submit" title="Delete" aria-label="Delete event" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600">
        <Trash2 className="h-[18px] w-[18px]" />
      </button>
    </form>
  );
}