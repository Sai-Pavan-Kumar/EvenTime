import { Metadata } from "next";
import { createClient as createServerClient } from "@/lib/supabase/server";
import EventClientUI from "./EventClientUI";

// Helper function to check if the slug is a valid UUID
const isValidUUID = (id: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerClient();
  
  const isUUID = isValidUUID(slug);

  // Dynamically build the query based on what the slug actually is
  let query = supabase
    .from("events")
    .select("title, category, date_string, description, status");
    
  if (isUUID) {
    query = query.eq("id", slug);
  } else {
    query = query.eq("slug", slug);
  }

  const { data: event } = await query.maybeSingle();

  if (!event || event.status !== "approved") return { title: "Event Not Found" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const ogUrl = new URL(`${baseUrl}/api/og`);

  ogUrl.searchParams.set("title", event.title);
  ogUrl.searchParams.set("category", event.category);
  ogUrl.searchParams.set("date", event.date_string || "TBA");

  return {
    title: `${event.title} | EvenTime`,
    description: event.description || `Join this ${event.category} event on EvenTime!`,
    alternates: {
      canonical: `${baseUrl}/events/${slug}`,
    },
    openGraph: {
      title: event.title,
      description: event.description || `Join this ${event.category} event on EvenTime!`,
      url: `${baseUrl}/events/${slug}`,
      type: "website",
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.description || `Join this ${event.category} event on EvenTime!`,
      images: [ogUrl.toString()],
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerClient();

  const EVENT_DETAIL_FIELDS = "id, slug, title, category, date_string, start_time, end_date_string, end_time, location, city, is_virtual, poster_url, banner_url, organizer_name, description, registration_link, is_free, price, prizes, team_size, website, target_audience, creator_id, status, college_id, colleges(name)";

  const isUUID = isValidUUID(slug);

  // Dynamically build the query based on what the slug actually is
  let query = supabase
    .from("events")
    .select(EVENT_DETAIL_FIELDS);

  if (isUUID) {
    query = query.eq("id", slug);
  } else {
    query = query.eq("slug", slug);
  }

  const { data: finalEvent } = await query.maybeSingle();

  // NEW: Fetch curator's username (shorter than full_name) for display on the event page
  let curatorUsername: string | null = null;
  if (finalEvent?.creator_id) {
    const { data: curatorProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", finalEvent.creator_id)
      .maybeSingle();
    curatorUsername = curatorProfile?.username || null;
  }

  if (!finalEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 font-medium">
        Event not found.
      </div>
    );
  }

  // Ensure pending/rejected events are only visible to the creator or an admin
  if (finalEvent.status !== "approved") {
    const { data: { user } } = await supabase.auth.getUser();
    const isCreator = user?.id === finalEvent.creator_id;
    
    let isAdmin = false;
    if (user && !isCreator) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      isAdmin = profile?.role === "admin";
    }

    if (!isCreator && !isAdmin) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-[#F5F5F7]">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 text-2xl shadow-sm border border-amber-100">⏳</div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 font-['Outfit'] tracking-tight">Event Under Review</h2>
          <p className="text-slate-500 font-medium max-w-md font-['Switzer']">This event is currently pending approval by our moderators or has been rejected. Check back later.</p>
        </div>
      );
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const eventUrl = `${baseUrl}/events/${finalEvent.slug || finalEvent.id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: finalEvent.title,
    description: finalEvent.description,
    startDate: finalEvent.date_string ? `${finalEvent.date_string}${finalEvent.start_time ? `T${finalEvent.start_time}` : ""}` : undefined,
    endDate: finalEvent.end_date_string ? `${finalEvent.end_date_string}${finalEvent.end_time ? `T${finalEvent.end_time}` : ""}` : undefined,
    eventAttendanceMode: finalEvent.is_virtual 
      ? "https://schema.org/OnlineEventAttendanceMode" 
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: finalEvent.is_virtual
      ? {
          "@type": "VirtualLocation",
          url: finalEvent.registration_link || finalEvent.website || eventUrl,
        }
      : {
          "@type": "Place",
          name: finalEvent.location || "TBA",
          address: {
            "@type": "PostalAddress",
            addressLocality: finalEvent.city || "TBA",
          },
        },
    image: [finalEvent.poster_url || finalEvent.banner_url || `${baseUrl}/api/og?title=${encodeURIComponent(finalEvent.title)}`].filter(Boolean),
    offers: {
      "@type": "Offer",
      url: finalEvent.registration_link || eventUrl,
      price: finalEvent.is_free ? "0" : (finalEvent.price?.toString() || "0"),
      priceCurrency: "INR", 
      availability: "https://schema.org/InStock"
    },
    organizer: {
      "@type": "Organization",
      name: finalEvent.organizer_name || "EvenTime",
    }
  };

  // NEW: Fetch Similar Events based on the same category
  let similarEvents: any[] = [];
  if (finalEvent.category) {
    const { data } = await supabase
      .from("events")
      .select(EVENT_DETAIL_FIELDS)
      .eq("category", finalEvent.category)
      .eq("status", "approved")
      .neq("id", finalEvent.id)
      .order("created_at", { ascending: false })
      .limit(3);
    
    if (data) {
      similarEvents = data;
    }
  }

 // Fetch up to 3 interested user avatars for social proof
  let interestedAvatars: { avatar_url: string | null; full_name: string | null }[] = [];
  {
    const { data: interestedRows } = await supabase
      .from("interested_events" as any)
      .select("user_id")
      .eq("event_id", finalEvent.id)
      .limit(3);

    if (interestedRows && interestedRows.length > 0) {
      const userIds = interestedRows.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .in("id", userIds);
      if (profiles) interestedAvatars = profiles;
    }
  }

  // Pass the data cleanly to the client UI
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EventClientUI event={finalEvent} similarEvents={similarEvents} curatorUsername={curatorUsername} interestedAvatars={interestedAvatars} collegeName={(finalEvent as any).colleges?.name || null} />
    </>
  );
}