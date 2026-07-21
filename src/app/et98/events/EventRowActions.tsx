"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle, Trash2, Loader2 } from "lucide-react";
import { updateEventDetailsAction, deleteEventAction } from "../actions";

const colorClasses = {
  approved: "bg-emerald-50 text-emerald-600",
  rejected: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-600",
};

export function EventRowActions({
  eventId,
  initialCategory,
  initialStatus,
}: {
  eventId: string;
  initialCategory: string;
  initialStatus: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState(initialStatus || "pending");
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleSave = () => {
    startSaveTransition(async () => {
      const fd = new FormData();
      fd.set("eventId", eventId);
      fd.set("category", category);
      fd.set("status", status);
      const result = await updateEventDetailsAction(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Event updated!");
      }
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
    startDeleteTransition(async () => {
      const fd = new FormData();
      fd.set("eventId", eventId);
      const result = await deleteEventAction(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Event moved to trash.");
      }
    });
  };

  return (
    <>
      <input
        type="text"
        name="category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category"
        className="text-[12px] font-bold text-brand-primary bg-transparent border-b-2 border-dashed border-transparent hover:border-[#B29DFF] focus:border-[#6C47FF] px-2 py-1.5 uppercase tracking-wider w-36 outline-none transition-colors font-['Outfit']"
      />

      <select
        name="status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className={`text-xs font-bold px-2 py-1.5 rounded-md uppercase tracking-wider outline-none cursor-pointer border border-transparent focus:border-slate-300 transition-colors ${
          colorClasses[status as keyof typeof colorClasses] || colorClasses.pending
        }`}
      >
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-[44px] h-[44px] rounded-full bg-surface-base text-[#6B7280] flex items-center justify-center hover:bg-[#22C55E] hover:text-white transition-colors disabled:opacity-60"
          title="Save Changes"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 bg-white text-slate-400 hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-100 rounded-lg transition-colors disabled:opacity-60"
          title="Delete Event Completely"
        >
          {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
        </button>
      </div>
    </>
  );
}