import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-10 w-64 rounded-lg mb-2" />
          <Skeleton className="h-5 w-72 rounded-md" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm">
              <Skeleton className="w-6 h-6 rounded-md mb-4" />
              <Skeleton className="w-24 h-4 rounded-md mb-3" />
              <Skeleton className="w-16 h-10 rounded-md" />
            </div>
          ))}
        </div>

        {/* Top Colleges Skeleton */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-8">
          <div className="flex justify-between mb-6">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-6 w-6 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-50" />
            ))}
          </div>
        </div>

        {/* Bottom Split Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Approval Queue */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between">
              <Skeleton className="h-6 w-48 rounded-md" />
            </div>
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 flex flex-col gap-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-20 h-14 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-full rounded-md" />
                      <Skeleton className="h-4 w-1/2 rounded-md" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1 rounded-full" />
                    <Skeleton className="h-8 flex-1 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Reports */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-red-50/30 flex justify-between">
              <Skeleton className="h-6 w-32 rounded-md" />
            </div>
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6">
                  <div className="flex justify-between mb-3">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-20 rounded-md" />
                      <Skeleton className="h-5 w-3/4 rounded-md mt-2" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Skeleton className="h-8 flex-1 rounded-lg" />
                    <Skeleton className="h-8 flex-1 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}