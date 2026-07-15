"use client";

import { useState } from "react";

export function StatusSelect({ eventId, initialStatus }: { eventId: string, initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus || "pending");

  const colorClasses = {
    approved: "bg-emerald-50 text-emerald-600",
    rejected: "bg-red-50 text-red-600",
    pending: "bg-amber-50 text-amber-600",
  };

  return (
    <select
      name="status"
      value={status}
      onChange={(e) => setStatus(e.target.value)}
      form={`update-${eventId}`}
      className={`text-xs font-bold px-2 py-1.5 rounded-md uppercase tracking-wider outline-none cursor-pointer border border-transparent focus:border-slate-300 transition-colors ${
        colorClasses[status as keyof typeof colorClasses] || colorClasses.pending
      }`}
    >
      <option value="pending">Pending</option>
      <option value="approved">Approved</option>
      <option value="rejected">Rejected</option>
    </select>
  );
}