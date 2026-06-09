import { Skeleton } from "@/components/ui/skeleton";

export function EventCardSkeleton({ isFeatured = false }: { isFeatured?: boolean }) {
  // Mirroring the new container logic
  const cardVariantClass = isFeatured 
    ? "w-[280px] sm:w-[320px] shrink-0 snap-start" 
    : "w-full aspect-square";

  return (
    <div className={`relative bg-white p-3 rounded-[24px] border border-slate-100 shadow-sm flex flex-col ${cardVariantClass}`}>
      {/* Image Skeleton */}
      <Skeleton className="w-full aspect-video rounded-[16px] shrink-0" />
      
      {/* Typography Wrapper (Left-aligned & properly padded) */}
      <div className="mt-3 pr-24 flex flex-col gap-2 flex-1 text-left">
        {/* Title Skeleton (2 lines) */}
        <Skeleton className="w-full h-5 rounded-md" />
        <Skeleton className="w-2/3 h-5 rounded-md" />
        
        {/* Organizer Skeleton */}
        <Skeleton className="w-1/2 h-4 rounded-md mt-1" />
      </div>

      {/* Buttons at Bottom Right exactly mirroring the live component */}
      <div className="absolute bottom-3 right-3 flex gap-2">
        <Skeleton className="w-10 h-10 rounded-[12px]" />
        <Skeleton className="w-10 h-10 rounded-[12px]" />
      </div>
    </div>
  );
}