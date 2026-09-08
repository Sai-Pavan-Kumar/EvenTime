import { Skeleton } from "@/components/ui/skeleton";

export default function EventDetailLoading() {
  return (
    <div className="min-h-screen bg-surface-base pb-24 sm:pb-16">
      {/* Top Bar Skeleton */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="w-32 h-5 rounded-lg hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Poster Skeleton */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-sm sm:max-w-md aspect-[4/5] rounded-[32px] overflow-hidden border border-slate-200/80 bg-white p-3 shadow-sm">
              <Skeleton className="w-full h-full rounded-[24px]" />
            </div>
          </div>

          {/* Right Column: Event Info Skeleton */}
          <div className="lg:col-span-7 space-y-6">
            {/* Category & Tags */}
            <div className="flex items-center gap-2">
              <Skeleton className="w-24 h-7 rounded-full" />
              <Skeleton className="w-20 h-7 rounded-full" />
            </div>

            {/* Title */}
            <div className="space-y-3">
              <Skeleton className="w-full max-w-xl h-10 rounded-xl" />
              <Skeleton className="w-3/4 max-w-md h-10 rounded-xl" />
            </div>

            {/* Organizer Row */}
            <div className="flex items-center gap-3 pt-1">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="w-20 h-3 rounded" />
                <Skeleton className="w-36 h-4 rounded-md" />
              </div>
            </div>

            {/* Date & Time Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-2">
                <Skeleton className="w-16 h-3 rounded" />
                <Skeleton className="w-40 h-5 rounded-md" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-2">
                <Skeleton className="w-16 h-3 rounded" />
                <Skeleton className="w-32 h-5 rounded-md" />
              </div>
            </div>

            {/* Location Box */}
            <div className="p-4 rounded-2xl bg-white border border-slate-100 space-y-2">
              <Skeleton className="w-20 h-3 rounded" />
              <Skeleton className="w-64 h-5 rounded-md" />
            </div>

            {/* CTA Button Skeleton */}
            <div className="pt-4 flex gap-4">
              <Skeleton className="flex-1 h-14 rounded-2xl" />
              <Skeleton className="w-14 h-14 rounded-2xl" />
            </div>

            {/* Description Skeleton */}
            <div className="pt-6 border-t border-slate-200/60 space-y-3">
              <Skeleton className="w-28 h-5 rounded-md" />
              <Skeleton className="w-full h-4 rounded" />
              <Skeleton className="w-full h-4 rounded" />
              <Skeleton className="w-4/5 h-4 rounded" />
              <Skeleton className="w-2/3 h-4 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}