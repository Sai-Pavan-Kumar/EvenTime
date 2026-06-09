import { Navbar } from "@/components/layout/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16 flex flex-col items-center">
          <Skeleton className="w-20 h-20 rounded-[24px] mb-6" />
          <Skeleton className="w-64 h-12 rounded-lg mb-4" />
          <Skeleton className="w-96 h-6 rounded-md" />
        </div>

        {/* Podium Skeleton */}
        <div className="relative grid grid-cols-3 items-end gap-2 md:gap-4 mb-24 px-2 min-h-[380px] md:min-h-[420px] max-w-3xl mx-auto mt-10">
          {/* Rank 2 */}
          <div className="flex flex-col items-center justify-self-end w-full max-w-[160px]">
            <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full mb-4" />
            <Skeleton className="h-5 w-24 rounded-md mb-2" />
            <Skeleton className="h-4 w-16 rounded-md mb-3" />
            <Skeleton className="w-full h-24 md:h-32 rounded-t-2xl" />
          </div>

          {/* Rank 1 */}
          <div className="flex flex-col items-center justify-self-center w-full max-w-[180px] z-10">
            <Skeleton className="w-28 h-28 md:w-36 md:h-36 rounded-full mb-4" />
            <Skeleton className="h-6 w-32 rounded-md mb-2" />
            <Skeleton className="h-4 w-20 rounded-md mb-3" />
            <Skeleton className="w-full h-36 md:h-48 rounded-t-[20px]" />
          </div>

          {/* Rank 3 */}
          <div className="flex flex-col items-center justify-self-start w-full max-w-[160px]">
            <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full mb-4" />
            <Skeleton className="h-5 w-24 rounded-md mb-2" />
            <Skeleton className="h-4 w-16 rounded-md mb-3" />
            <Skeleton className="w-full h-16 md:h-20 rounded-t-2xl" />
          </div>
        </div>

        {/* List Skeleton */}
        <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
          <div className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 border-b border-slate-100 bg-slate-50/50">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 justify-self-end" />
          </div>
          
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 items-center">
                <Skeleton className="w-10 h-6 rounded-md" />
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 rounded-md" />
                    <Skeleton className="h-4 w-40 rounded-md" />
                  </div>
                </div>
                <Skeleton className="w-12 h-6 rounded-md justify-self-end" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}