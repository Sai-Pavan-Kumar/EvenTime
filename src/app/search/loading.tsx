import { Navbar } from "@/components/layout/Navbar";
import { EventCardSkeleton } from "@/components/skeletons/EventCardSkeleton";

export default function SearchLoading() {
  return (
    <main className="min-h-screen bg-surface-base pb-28 sm:pb-24">
      {/* Top navbar: visible on desktop, hidden on mobile for /search */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Mobile Search Bar: only visible on mobile screens where Navbar is hidden */}
        <div className="block sm:hidden max-w-3xl mx-auto mb-3">
          <div className="h-10 bg-slate-200/80 rounded-full w-full animate-pulse" />
        </div>

        {/* Filter Chips Bar Container Skeleton matching SearchClient */}
        <div className="max-w-3xl sm:max-w-none mx-auto mb-4 sm:mb-6">
          <div className="flex items-center gap-2 overflow-x-auto sm:overflow-visible py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="h-8 w-24 bg-slate-200/80 rounded-full animate-pulse shrink-0" />
            <div className="h-8 w-20 bg-slate-200/80 rounded-full animate-pulse shrink-0" />
            <div className="h-8 w-24 bg-slate-200/80 rounded-full animate-pulse shrink-0" />
            <div className="h-8 w-24 bg-slate-200/80 rounded-full animate-pulse shrink-0" />
            <div className="h-8 w-28 bg-slate-200/80 rounded-full animate-pulse shrink-0" />
          </div>
        </div>

        {/* Event Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
