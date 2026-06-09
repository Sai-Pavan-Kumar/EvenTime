import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eventime.in";
  const supabase = await createClient();

  // Fetch all approved events along with their category and city
  const { data: events } = await supabase
    .from("events")
    .select("slug, created_at, category, city")
    .eq("status", "approved");

  const activeEvents = events || [];

  // 1. Generate Event URLs
  const eventUrls = activeEvents.map((event) => ({
    url: `${baseUrl}/events/${event.slug}`,
    lastModified: event.created_at ? new Date(event.created_at) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // 2. Extract unique Categories and generate URLs
  const uniqueCategories = Array.from(
    new Set(activeEvents.map((e) => e.category).filter((category): category is string => Boolean(category)))
  );
  
  const categoryUrls = uniqueCategories.map((category) => {
    const formattedCategory = category.toLowerCase().trim().replace(/\s+/g, '-');
    return {
      url: `${baseUrl}/categories/${encodeURIComponent(formattedCategory)}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    };
  });

  // 3. Extract unique Cities and generate URLs
  const uniqueCities = Array.from(
    new Set(activeEvents.map((e) => e.city).filter((city): city is string => Boolean(city)))
  );
  
  const cityUrls = uniqueCities.map((city) => {
    const formattedCity = city.toLowerCase().trim().replace(/\s+/g, '-');
    return {
      url: `${baseUrl}/cities/${encodeURIComponent(formattedCity)}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    };
  });

  // 4. Return the combined sitemap array
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "always" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    ...categoryUrls,
    ...cityUrls,
    ...eventUrls,
  ];
}