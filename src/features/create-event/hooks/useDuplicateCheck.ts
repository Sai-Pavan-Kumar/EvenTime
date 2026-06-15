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

    // Most event platforms embed a unique numeric event ID in the URL
    // (e.g. meetup.com/.../events/315052580/). Match on that number first -
    // it catches the same event regardless of path/query differences.
    const idMatches = link.match(/\d{5,}/g);
    const eventId = idMatches ? idMatches.reduce((a, b) => (b.length > a.length ? b : a), "") : null;

    const pattern = eventId ? `%${eventId}%` : `${normalized}%`;

    const { data } = await supabase.from("events").select("id, title").ilike("registration_link", pattern).limit(1).maybeSingle();
    return data;
  };

  return { checkDuplicateLink };
}