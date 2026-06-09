import { createClient } from "@/lib/supabase/client";

export function useDuplicateCheck() {
  const supabase = createClient();
  
  const checkDuplicateLink = async (link: string) => {
    const { data } = await supabase.from("events").select("id, title").eq("registration_link", link).single();
    return data;
  };

  return { checkDuplicateLink };
}