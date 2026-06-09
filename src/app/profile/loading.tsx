import { Navbar } from "@/components/layout/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      <Navbar variant="centered" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-[24px] border border-slate-200/60 shadow-sm flex flex-col lg:flex-row overflow-hidden min-h-[700px]">
          
          {/* LEFT SIDEBAR SKELETON */}
          <div className="w-full lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 hidden lg:block">
            <div className="flex flex-col h-full">
              <div className="p-6 flex flex-col items-center text-center">
                {/* Avatar Skeleton */}
                <Skeleton className="w-28 h-28 rounded-full mb-4" />
                {/* Name Skeleton */}
                <Skeleton className="h-6 w-40 rounded-md mb-2" />
                {/* Email Skeleton */}
                <Skeleton className="h-4 w-32 rounded-md mb-6" />
                
                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-4 w-full border-t border-slate-100 pt-5 text-center divide-x divide-slate-100">
                  <div className="flex flex-col items-center gap-2"><Skeleton className="h-5 w-8 rounded-md" /><Skeleton className="h-3 w-10 rounded-sm" /></div>
                  <div className="flex flex-col items-center gap-2"><Skeleton className="h-5 w-8 rounded-md" /><Skeleton className="h-3 w-10 rounded-sm" /></div>
                  <div className="flex flex-col items-center gap-2"><Skeleton className="h-5 w-8 rounded-md" /><Skeleton className="h-3 w-10 rounded-sm" /></div>
                  <div className="flex flex-col items-center gap-2"><Skeleton className="h-5 w-8 rounded-md" /><Skeleton className="h-3 w-10 rounded-sm" /></div>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              {/* Menu Navigation Skeleton */}
              <div className="flex flex-col p-3 gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>

              <div className="p-4 pt-1 mb-2 mt-auto">
                <Skeleton className="h-12 w-full rounded-full" />
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT AREA SKELETON */}
          <div className="flex-1 p-6 sm:p-8 lg:p-10 flex-col flex">
            <div className="mb-8">
              <Skeleton className="h-8 w-48 rounded-md mb-3" />
              <Skeleton className="h-4 w-64 rounded-md" />
            </div>

            {/* Profile Content Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-2 flex flex-col h-full shadow-sm">
                  <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                  <div className="px-2 pt-3.5 pb-1 flex flex-col grow">
                    <Skeleton className="h-5 w-full rounded-md mb-2" />
                    <Skeleton className="h-5 w-2/3 rounded-md mb-4" />
                    <div className="flex justify-between mt-auto mb-3.5">
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-4 w-16 rounded-md" />
                    </div>
                    <div className="mt-auto flex gap-1.5 border-t border-slate-100 pt-3">
                      <Skeleton className="h-8 flex-1 rounded-lg" />
                      <Skeleton className="h-8 flex-1 rounded-lg" />
                      <Skeleton className="h-8 flex-1 rounded-lg" />
                    </div>
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