import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { EventGrid } from "@/lib/home/EventGrid";
import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { categoriesList } from "@/features/create-event/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  // Convert URL friendly "hackathons-and-events" back to "hackathons and events"
  const decodedCategory = decodeURIComponent(category).replace(/-/g, ' ');
  const normalized = decodedCategory.trim().toLowerCase();
  const matchedCategory = categoriesList.find((c) => c.toLowerCase() === normalized);

  if (!matchedCategory) {
    return {
      title: "Category Not Found | EvenTime",
      description: "The requested category could not be found in the EvenTime directory.",
    };
  }

  return {
    title: `${matchedCategory} Events | EvenTime`,
    description: `Discover the best ${matchedCategory.toLowerCase()} events, meetups, and workshops on EvenTime.`,
  };
}

import { cookies } from "next/headers";

export const revalidate = 600;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category).replace(/-/g, ' ');
  const normalized = decodedCategory.trim().toLowerCase();
  const matchedCategory = categoriesList.find((c) => c.toLowerCase() === normalized);

  if (!matchedCategory) {
    notFound();
  }

  const CATEGORY_FIELDS = "id, slug, title, category, date_string, start_time, location, city, poster_url, organizer_name, is_free, is_featured, target_audience, college_id, creator_id";

  // CACHED: public events for this category (same for every anonymous/non-student visitor)
  const getCachedPublicCategoryEvents = unstable_cache(
    async () => {
      const supabaseAnon = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );
      const today = new Date();
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const sixMonthsAgoStr = sixMonthsAgo.toISOString().substring(0, 10);

      const { data } = await supabaseAnon
        .from("events")
        .select(CATEGORY_FIELDS)
        .eq("status", "approved")
        .ilike("category", matchedCategory)
        .gte("date_string", sixMonthsAgoStr)
        .or(`college_only.is.null,college_only.eq.false,target_audience.cs.{"Everyone"}`)
        .order("date_string", { ascending: true })
        .limit(50);
      return data || [];
    },
    [`category_events_${matchedCategory.toLowerCase()}`],
    { tags: ["events"], revalidate: 600 } // 10 minutes
  );

  // Fast check: Only query Supabase auth if session cookie is present
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.getAll().some(c => c.name.includes("-auth-token"));

  let user = null;
  let profile: { user_type: string | null; college_id: string | null } | null = null;
  let supabaseServer = null;

  if (hasAuthCookie) {
    supabaseServer = await createClient();
    const { data: authData } = await supabaseServer.auth.getUser();
    user = authData.user;
    if (user) {
      const { data: prof } = await supabaseServer.from("profiles").select("user_type, college_id").eq("id", user.id).single();
      profile = prof;
    }
  }

  const publicEvents = await getCachedPublicCategoryEvents();

  // Tiny, uncached, bounded-to-1-user query for their own extra visible events
  let personalEvents: any[] = [];
  if (user && supabaseServer) {
    let extraFilter = `creator_id.eq.${user.id}`;
    if (profile?.user_type === "student" && profile?.college_id) {
      extraFilter += `,college_id.eq.${profile.college_id}`;
    }
    const { data } = await supabaseServer
      .from("events")
      .select(CATEGORY_FIELDS)
      .eq("status", "approved")
      .ilike("category", matchedCategory)
      .or(extraFilter)
      .order("date_string", { ascending: true })
      .limit(50);
    personalEvents = data || [];
  }

  const eventMap = new Map();
  [...publicEvents, ...personalEvents].forEach((e: any) => eventMap.set(e.id, e));
  const events = Array.from(eventMap.values());

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-heading font-black text-slate-900 capitalize">
            {matchedCategory} Events
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Discover and join the best {matchedCategory.toLowerCase()} events.
          </p>
        </div>

        {events && events.length > 0 ? (
          <EventGrid events={events} gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" />
        ) : (
          <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No events found in this category</p>
          </div>
        )}
      </div>
    </main>
  );
}