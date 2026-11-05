import { Navbar } from "@/components/layout/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function CityPageLoading() {
  return (
    <main className="min-h-screen bg-surface-base pb-24">
      <Navbar />

      {/* Same shape as the real page, so nothing jumps when it arrives */}
      <Skeleton className="w-full h-44 md:h-64 rounded-none" />
      <div className="relative z-10 -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 md:h-24 bg-white rounded-2xl border border-slate-200/80 shadow-sm" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Skeleton className="w-44 h-7 rounded-xl mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl border border-slate-200/80 bg-white p-3 space-y-3 shadow-sm">
              <Skeleton className="w-full aspect-[4/3] rounded-2xl" />
              <Skeleton className="w-full h-5 rounded-md" />
              <Skeleton className="w-3/4 h-4 rounded-md" />
              <Skeleton className="w-1/2 h-4 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
