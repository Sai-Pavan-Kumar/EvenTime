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
    const { data } = await supabase.from("events").select("id, title").ilike("registration_link", `${normalized}%`).maybeSingle();
    return data;
  };

  return { checkDuplicateLink };
}