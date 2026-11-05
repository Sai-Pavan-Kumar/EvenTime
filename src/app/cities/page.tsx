import { Metadata } from "next";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { CitiesClient } from "./CitiesClient";
import { PUBLIC_AUDIENCE_FILTER, localDateString, upcomingFilter } from "./cityEvents";

export const metadata: Metadata = {
  title: "Explore Events by City | EvenTime",
  description: "Discover upcoming conferences, hackathons & meetups happening in active cities across India.",
  alternates: { canonical: "https://eventime.thesurfboard.in/cities" },
  openGraph: {
    title: "Explore Events by City | EvenTime",
    description: "Discover upcoming conferences, hackathons & meetups happening in active cities across India.",
    url: "https://eventime.thesurfboard.in/cities",
  },
};

// "Upcoming" changes with the date, so counts must expire even when no event is edited.
export const revalidate = 600;

const getCachedCityCounts = unstable_cache(
  async () => {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const today = localDateString();

    // Throwing keeps a failed read out of the cache
    const { data, error } = await supabase
      .from("events")
      .select("city")
      .eq("status", "approved")
      .or(upcomingFilter(today))
      .or(PUBLIC_AUDIENCE_FILTER);
    if (error) throw error;

    const cityCounts: Record<string, number> = {};
    if (data) {
      data.forEach((ev: any) => {
        if (ev.city) {
          const name = ev.city.trim();
          cityCounts[name] = (cityCounts[name] || 0) + 1;
        }
      });
    }

    return cityCounts;
  },
  ["cities-page-counts"],
  { revalidate: 600, tags: ["events"] }
);

export default async function CitiesPage() {
  const cityCounts = await getCachedCityCounts().catch((err) => {
    console.warn("[CitiesPage] Could not load city counts:", err);
    return null;
  });
  return <CitiesClient initialCityCounts={cityCounts} />;
}

