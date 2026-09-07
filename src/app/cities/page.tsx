import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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

export const revalidate = 60; // Refresh city counts every 60 seconds

export default async function CitiesPage() {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().split("T")[0];

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

  return <CitiesClient initialCityCounts={cityCounts} />;
}
