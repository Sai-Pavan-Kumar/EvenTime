import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { EventGrid } from "@/lib/home/EventGrid";
import { getCityConfig } from "@/lib/city-config";
import { MapPin } from "lucide-react";

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

  // Get today's date string (YYYY-MM-DD) to filter out past events
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { data: events } = await supabase
    .from("events")
    .select("id, slug, title, category, date_string, start_time, location, city, poster_url, organizer_name, is_free, is_featured, target_audience")
    .eq("status", "approved")
    .ilike("city", decodedCity)
    .gte("date_string", todayStr) // Only today & upcoming events
    .order("date_string", { ascending: true });

  const cityConfig = getCityConfig(decodedCity);

  return (
    <main className="min-h-screen bg-[#F5F5F7] pb-24">
      <Navbar />
      
      {/* City Cover Hero */}
      <div className="w-full h-[35vh] md:h-[45vh] relative mt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full h-full rounded-[32px] overflow-hidden relative shadow-sm border border-slate-200/60">
           <img 
            src={cityConfig.coverImage} 
            alt={decodedCity} 
            className="w-full h-full object-cover"
            // Okavela covers folder lo 21:9 lekapothe pata 16:9 image vesthundi
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = cityConfig.backgroundImage;
            }}
          />          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 shadow-sm">
                <MapPin className="w-3.5 h-3.5" />
                {decodedCity}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-black text-white capitalize drop-shadow-md">
              {decodedCity}
            </h1>
            <p className="text-white/90 font-medium mt-2 md:mt-3 md:text-lg max-w-xl drop-shadow-md">
              Events happening here
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 font-heading">
            Upcoming Events
          </h2>
          <span className="text-sm font-bold text-slate-500 bg-slate-200/60 px-3 py-1.5 rounded-xl border border-slate-200">
            {events?.length || 0} {events?.length === 1 ? 'Event' : 'Events'}
          </span>
        </div>

        {events && events.length > 0 ? (
          <EventGrid events={events} gridClass="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" />
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-[32px] border border-dashed border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-bold text-lg">No Upcoming Events</h3>
            <p className="text-slate-500 font-medium text-sm mt-2 max-w-sm">
              We couldn't find any upcoming events in {decodedCity}. Check back later or explore other cities.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}