import { fetchHomePageData } from "@/lib/home/fetchHomePageData";
import { HomePageClient } from "@/lib/home/HomePageClient";
import { Suspense } from "react";

// Dates in the saved page go stale at midnight. The rebuild reuses the cached events, so it adds no event reads.
export const revalidate = 86400;

export default async function Home() {
  // Fetch only the global public buffet securely from the backend logic
  const data = await fetchHomePageData();

  // Most stored events are over, and nobody sees them until they filter or open a past date.
  // The client loads the full list at that moment, so the first page stays small.
  const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const upcomingEvents = data.allEvents.filter((e) => !e.date_string || e.date_string >= todayIST);
  
  // Wrapped in Suspense so Next.js can safely generate a 100% Static Page
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomePageClient {...data} allEvents={upcomingEvents} />
    </Suspense>
  );
}