import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DUPLICATE_CANDIDATE_LIMIT, IGNORED_DUPLICATE_STATUSES, isSameRegistrationLink, normalizeRegistrationLink } from "../utils/duplicateCheck";

export function useDuplicateCheck() {
  const checkDuplicateLink = useCallback(
    async (link: string, currentEventId?: string, signal?: AbortSignal) => {
      const parsed = normalizeRegistrationLink(link);
      if (!parsed) return null;

      try {
        const supabase = createClient();
        let query = supabase
          .from("events")
          .select("id, title, registration_link")
          .ilike("registration_link", parsed.pattern)
          .not("status", "in", IGNORED_DUPLICATE_STATUSES)
          .limit(DUPLICATE_CANDIDATE_LIMIT);

        if (currentEventId) {
          query = query.neq("id", currentEventId);
        }
        if (signal) {
          query = query.abortSignal(signal);
        }

        const res = await Promise.race([
          query,
          new Promise<{ data: null }>((resolve) =>
            setTimeout(() => resolve({ data: null }), 3500)
          ),
        ]);
        return res?.data?.find((row) => isSameRegistrationLink(link, row.registration_link)) || null;
      } catch (err) {
        console.warn("[useDuplicateCheck] checkDuplicateLink fallback:", err);
        return null;
      }
    },
    []
  );

  return { checkDuplicateLink };
}
