import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { EventGrid } from "@/lib/home/EventGrid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const decodedCity = decodeURIComponent(city).replace(/-/g, ' ');

  return {
    title: `Events in ${decodedCity} | EvenTime`,
    description: `Discover the best events, hackathons, and meetups in ${decodedCity} on EvenTime.`,
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const decodedCity = decodeURIComponent(city).replace(/-/g, ' ');
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, slug, title, category, date_string, start_time, location, city, poster_url, organizer_name, is_free, is_featured, target_audience")
    .eq("status", "approved")
    .ilike("city", decodedCity)
    .order("date_string", { ascending: true });

  return (
    <main className="min-h-screen bg-[#F5F5F7]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-heading font-black text-slate-900 capitalize">
            Events in {decodedCity}
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Discover and join the best events happening in {decodedCity}.
          </p>
        </div>

        {events && events.length > 0 ? (
          <EventGrid events={events} gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" />
        ) : (
          <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No events found in this city</p>
          </div>
        )}
      </div>
    </main>
  );
}