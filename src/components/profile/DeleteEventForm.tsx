"use client";

import { Trash2 } from "lucide-react";

export function DeleteEventForm({ 
  eventId, 
  deleteAction 
}: { 
  eventId: string, 
  deleteAction: (formData: FormData) => void 
}) {
  return (
    <form action={deleteAction} className="flex-1" onSubmit={(e) => {
      if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
        e.preventDefault();
      }
    }}>
      <input type="hidden" name="eventId" value={eventId} />
      <button type="submit" title="Delete Event" className="w-full flex items-center justify-center text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 py-2 rounded-lg transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </form>
  );
}