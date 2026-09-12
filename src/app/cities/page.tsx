import { Metadata } from "next";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { CitiesClient } from "./CitiesClient";

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

export const revalidate = 3600; // 1-hour ISR buffet cache

const getCachedCityCounts = unstable_cache(
  async () => {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const { data } = await supabase
      .from("events")
      .select("city, date_string")
      .eq("status", "approved")
      .gte("date_string", todayStr);

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
  { revalidate: 3600, tags: ["events"] }
);

export default async function CitiesPage() {
  const cityCounts = await getCachedCityCounts();
  return <CitiesClient initialCityCounts={cityCounts} />;
}

