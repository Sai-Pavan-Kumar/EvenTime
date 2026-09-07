import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "Search Events & Hackathons | EvenTime",
  description: "Search tech meetups, hackathons, college fests, conferences, and creator meetups across India.",
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-base pt-20 px-4 max-w-7xl mx-auto animate-pulse">
          <div className="h-12 bg-slate-200 rounded-full max-w-2xl mx-auto mb-6" />
          <div className="flex gap-3 justify-center mb-10">
            <div className="h-9 w-24 bg-slate-200 rounded-full" />
            <div className="h-9 w-24 bg-slate-200 rounded-full" />
            <div className="h-9 w-28 bg-slate-200 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 bg-slate-100 rounded-3xl" />
            ))}
          </div>
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}
