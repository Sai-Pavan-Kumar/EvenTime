import { Navbar } from "@/components/layout/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

// Mirrors the real profile layout, so nothing jumps when the data arrives.
export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-12">
        <div className="flex items-center gap-4 sm:gap-5">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full sm:h-20 sm:w-20" />
          <div className="flex-1">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="mt-2 h-4 w-32 rounded-md" />
          </div>
        </div>
        <Skeleton className="mt-6 h-16 w-full rounded-xl" />

        <div className="mt-6 grid gap-12 lg:mt-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="flex flex-col gap-1">
            {[1, 2, 3, 4].map((row) => (
              <Skeleton key={row} className="h-11 w-full rounded-xl" />
            ))}
          </div>
          <div className="hidden flex-col gap-6 lg:flex">
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
