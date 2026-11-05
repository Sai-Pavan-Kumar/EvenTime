import { Navbar } from "@/components/layout/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the real profile layout, so nothing jumps when the data arrives.
export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-12">
        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white">
          <Skeleton className="h-20 w-full rounded-none sm:h-28" />
          <div className="px-4 pb-4 sm:px-6">
            <Skeleton className="-mt-10 h-20 w-20 rounded-full ring-4 ring-white sm:-mt-12 sm:h-24 sm:w-24" />
            <Skeleton className="mt-3 h-8 w-48 rounded-md" />
            <Skeleton className="mt-2 h-4 w-40 rounded-md" />
            <Skeleton className="mt-5 h-16 w-full rounded-xl" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
          <div className="flex flex-col gap-0.5 rounded-2xl border border-slate-200/70 bg-white p-1.5 lg:self-start">
            {[1, 2, 3, 4].map((row) => (
              <Skeleton key={row} className="h-11 w-full rounded-xl" />
            ))}
          </div>
          <div className="hidden flex-col gap-6 rounded-3xl border border-slate-200/70 bg-white p-6 lg:flex">
            <Skeleton className="h-7 w-40 rounded-md" />
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center gap-4">
                <Skeleton className="aspect-[16/10] w-32 shrink-0 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-2/3 rounded-md" />
                  <Skeleton className="mt-2 h-4 w-1/3 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
