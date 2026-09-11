import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchClient } from "./SearchClient";
import SearchLoading from "./loading";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { EventRow } from "@/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Search Events & Hackathons | EvenTime",
  description: "Search tech meetups, hackathons, college fests, conferences, and creator meetups across India.",
};

const getCachedSearchEvents = unstable_cache(
  async () => {
    const supabaseAnon = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const { data } = await supabaseAnon
      .from("events")
      .select(
        "id, slug, title, category, date_string, start_time, end_time, location, city, poster_url, organizer_name, is_free, is_featured, goal_tags, branch_tags, target_audience, is_virtual, college_only, college_id, colleges(name), profiles(username, full_name), description, interested_events(count)"
      )
      .eq("status", "approved")
      .or("college_only.is.null,college_only.eq.false")
      .order("created_at", { ascending: false });
    return (data || []) as Partial<EventRow>[];
  },
  ["search_events_pool"],
  { tags: ["events"], revalidate: 3600 }
);

export default async function SearchPage() {
  const initialEvents = await getCachedSearchEvents();

  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchClient initialEvents={initialEvents} />
    </Suspense>
  );
}
