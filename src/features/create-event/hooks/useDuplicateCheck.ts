import { createClient } from "@/lib/supabase/client";

export function useDuplicateCheck() {
  const supabase = createClient();
  
  const checkDuplicateLink = async (link: string) => {
    let normalized = link;
    try {
      const url = new URL(link);
      const host = url.hostname.replace(/^www\./, "");
      normalized = `${host}${url.pathname}`.replace(/\/$/, "");
    } catch {
      // invalid URL, fall back to raw link
    }

    // Every event platform puts a unique identifier as the last segment of
    // the path (meetup: numeric "315052580", lu.ma: slug "abc123x", etc).
    // Pulling that segment out catches duplicates regardless of platform,
    // since query params/tracking codes never change this part of the URL.
    let eventId: string | null = null;
    try {
      const url = new URL(link);
      const segments = url.pathname.split("/").filter(Boolean);
      eventId = segments[segments.length - 1] || null;
    } catch {
      // invalid URL, eventId stays null
    }

    const pattern = eventId ? `%/${eventId}%` : `${normalized}%`;

    const { data } = await supabase.from("events").select("id, title").ilike("registration_link", pattern).limit(1).maybeSingle();
    return data;
  };

  return { checkDuplicateLink };
}