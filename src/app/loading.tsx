// File: src/app/loading.tsx
import { Navbar } from "@/components/layout/Navbar";
import { EventCardSkeleton } from "@/components/skeletons/EventCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar />
      
      <div className="flex flex-col">
        {/* Fake Hero Section */}
        <div className="relative w-full h-[400px] bg-slate-900 overflow-hidden flex items-center justify-center">
          <div className="text-center space-y-6 z-10">
            <Skeleton className="h-12 w-[300px] sm:w-[500px] bg-slate-800 rounded-lg mx-auto" />
            <Skeleton className="h-6 w-[250px] sm:w-[400px] bg-slate-800 rounded-md mx-auto" />
          </div>
        </div>

        {/* Fake Sticky Discovery Pill */}
        <div className="z-40 mx-auto bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-200 px-4 py-2 flex items-center gap-4 w-max max-w-[90vw] -mt-8 mb-10">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <Skeleton className="w-16 h-8 rounded-full" />
            <Skeleton className="w-20 h-8 rounded-full" />
            <Skeleton className="w-24 h-8 rounded-full hidden sm:block" />
          </div>
          <div className="h-6 w-px bg-slate-300 shrink-0" />
          <Skeleton className="w-28 h-8 rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20 w-full">
          <div className="space-y-6">
            {/* Header Area */}
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="w-48 h-8 rounded-lg mb-2" />
                <Skeleton className="w-64 h-4 rounded-md" />
              </div>
            </div>
            
            {/* Skeletons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}