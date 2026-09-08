import { Navbar } from "@/components/layout/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryPageLoading() {
  return (
    <main className="min-h-screen bg-surface-base pb-24 sm:pb-16">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-10 sm:pt-14">
        {/* Header Skeleton */}
        <div className="mb-10 space-y-3">
          <Skeleton className="w-28 h-6 rounded-full" />
          <Skeleton className="w-72 sm:w-96 h-11 rounded-2xl" />
          <Skeleton className="w-56 h-4 rounded-md" />
        </div>

        {/* Event Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-3xl border border-slate-200/80 bg-white p-3 space-y-3 shadow-sm">
              <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
              <div className="p-2 space-y-2.5">
                <div className="flex justify-between items-center">
                  <Skeleton className="w-20 h-4 rounded" />
                  <Skeleton className="w-14 h-4 rounded" />
                </div>
                <Skeleton className="w-full h-5 rounded-md" />
                <Skeleton className="w-3/4 h-5 rounded-md" />
                <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                  <Skeleton className="w-24 h-4 rounded" />
                  <Skeleton className="w-16 h-4 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
