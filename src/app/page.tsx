import { fetchHomePageData } from "@/lib/home/fetchHomePageData";
import { HomePageClient } from "@/lib/home/HomePageClient";
import { Suspense } from "react";

export const revalidate = 3600; // Cache the buffet for 1 hour

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