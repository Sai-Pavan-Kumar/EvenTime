import { fetchHomePageData } from "@/lib/home/fetchHomePageData";
import { HomePageClient } from "@/lib/home/HomePageClient";

export const revalidate = 3600; // Revalidate at most every hour 

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string; q?: string; date?: string; category?: string; view?: string; tab?: string; show_cal?: string }>;
}) {
  // Await the params before passing them
  const params = await searchParams;
  
  // Fetch all the heavily lifted data securely from the backend logic
  const data = await fetchHomePageData(params);
  
  // Pass the returned props directly into our separated Client UI component
  return <HomePageClient {...data} />;
}