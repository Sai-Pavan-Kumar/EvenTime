import { Skeleton } from "@/components/ui/skeleton";
import { EventCardSkeleton } from "@/components/skeletons/EventCardSkeleton";

export default function EventLoading() {
  return (
    <main className="min-h-screen bg-white pb-32">
      {/* Fake Sticky Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto w-full px-6 py-8 md:py-10 space-y-10">
        {/* Hero Image Skeleton */}
        <Skeleton className="w-full h-[250px] sm:h-[300px] md:h-[400px] rounded-[24px]" />

        <div className="space-y-10">
          {/* Header Area */}
          <div className="space-y-4">
            <Skeleton className="w-24 h-6 rounded-lg" />
            <Skeleton className="w-3/4 h-12 md:h-14 rounded-lg" />
            <Skeleton className="w-1/3 h-6 rounded-md" />
          </div>

          {/* Action Buttons Desktop */}
          <div className="hidden md:flex gap-4">
            <Skeleton className="flex-1 h-16 rounded-2xl" />
            <Skeleton className="flex-1 h-16 rounded-2xl" />
          </div>

          {/* Logistics Box */}
          <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="w-20 h-3 rounded-md" />
                <Skeleton className="w-32 h-4 rounded-md" />
              </div>
            </div>
            <div className="flex gap-4">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="w-20 h-3 rounded-md" />
                <Skeleton className="w-32 h-4 rounded-md" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <Skeleton className="w-32 h-6 rounded-md mb-4" />
            <Skeleton className="w-full h-4 rounded-md" />
            <Skeleton className="w-full h-4 rounded-md" />
            <Skeleton className="w-5/6 h-4 rounded-md" />
            <Skeleton className="w-4/6 h-4 rounded-md" />
          </div>
        </div>

        {/* Similar Events */}
        <div className="pt-10 border-t border-slate-100 mt-12">
          <Skeleton className="w-40 h-8 rounded-lg mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}