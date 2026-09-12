import { fetchHomePageData } from "@/lib/home/fetchHomePageData";
import { HomePageClient } from "@/lib/home/HomePageClient";
import { Suspense } from "react";

export const revalidate = false; // Pure event-driven on-demand cache (0 hourly polling)

export default async function Home() {
  // Fetch only the global public buffet securely from the backend logic
  const data = await fetchHomePageData();
  
  // Wrapped in Suspense so Next.js can safely generate a 100% Static Page
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-base animate-pulse" />}>
      <HomePageClient {...data} />
    </Suspense>
  );
}