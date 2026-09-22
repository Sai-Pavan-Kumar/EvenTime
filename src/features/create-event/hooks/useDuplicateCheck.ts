import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeRegistrationLink } from "../utils/duplicateCheck";

export function useDuplicateCheck() {
  const checkDuplicateLink = useCallback(
    async (link: string, currentEventId?: string, signal?: AbortSignal) => {
      const parsed = normalizeRegistrationLink(link);
      if (!parsed) return null;

      try {
        const supabase = createClient();
        let query = supabase
          .from("events")
          .select("id, title")
          .ilike("registration_link", parsed.pattern)
          .limit(1);

        if (currentEventId) {
          query = query.neq("id", currentEventId);
        }
        if (signal) {
          query = query.abortSignal(signal);
        }

        const res = await Promise.race([
          query.maybeSingle(),
          new Promise<{ data: null }>((resolve) =>
            setTimeout(() => resolve({ data: null }), 3500)
          ),
        ]);
        return res?.data || null;
      } catch (err) {
        console.warn("[useDuplicateCheck] checkDuplicateLink fallback:", err);
        return null;
      }
    },
    []
  );

  return { checkDuplicateLink };
}
