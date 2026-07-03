import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { EventGrid } from "@/lib/home/EventGrid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  // Convert URL friendly "hackathons-and-events" back to "hackathons and events"
  const decodedCategory = decodeURIComponent(category).replace(/-/g, ' ');

  return {
    title: `${decodedCategory} Events | EvenTime`,
    description: `Discover the best ${decodedCategory} events, meetups, and workshops on EvenTime.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category).replace(/-/g, ' ');
  const supabase = await createClient();

  // 1. Fetch user session to determine if they are a student
  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  
  if (user) {
    const { data } = await supabase.from("profiles").select("user_type, college_id").eq("id", user.id).single();
    profile = data;
  }

  // 2. Build the strict visibility filter (exactly like the homepage)
  let visibilityFilter = `college_only.is.null,college_only.eq.false,target_audience.cs.{Anyone}`;
  
  if (user) {
    visibilityFilter += `,creator_id.eq.${user.id}`;
  }
  if (profile?.user_type === 'student' && profile?.college_id) {
       visibilityFilter += `,college_id.eq.${profile.college_id}`;
  }

  // 3. Fetch all approved events securely by applying the filter
  const { data: events } = await supabase
    .from("events")
    .select("id, slug, title, category, date_string, start_time, location, city, poster_url, organizer_name, is_free, is_featured, target_audience")
    .eq("status", "approved")
    .ilike("category", decodedCategory)
    .or(visibilityFilter) // SECURE: Apply the privacy rules here!
    .order("date_string", { ascending: true });

  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-heading font-black text-slate-900 capitalize">
            {decodedCategory} Events
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Discover and join the best {decodedCategory.toLowerCase()} events.
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