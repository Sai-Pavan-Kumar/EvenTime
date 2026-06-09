"use client";

import { Trash2 } from "lucide-react";

export function DeleteConfirmButton() {
  return (
    <button 
      type="submit" 
      onClick={(e) => {
        if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
      className="p-2 bg-white text-slate-400 hover:bg-red-50 hover:text-red-500 border border-transparent hover:border-red-100 rounded-lg transition-colors" 
      title="Delete Event Completely"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}