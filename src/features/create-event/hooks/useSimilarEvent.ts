import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { findSimilarEvent, type SimilarEventCandidate } from "../utils/similarEvents";

const CHECK_DELAY_MS = 600;
const MIN_TITLE_LENGTH = 3;
const CANDIDATE_LIMIT = 50;

type SimilarEventInput = {
  title: string;
  city: string;
  dateString: string;
  currentEventId?: string;
};

// Only approved events are compared here: they are already public, so the warning never reveals
// someone's event that is still in review. Pending lookalikes are flagged in the admin queue instead.
// A failed check just shows nothing, because this warning must never get in the way of posting.
export function useSimilarEvent({ title, city, dateString, currentEventId }: SimilarEventInput) {
  const [similarEvent, setSimilarEvent] = useState<SimilarEventCandidate | null>(null);
  const trimmedTitle = title.trim();
  const isReady = trimmedTitle.length >= MIN_TITLE_LENGTH && Boolean(city) && Boolean(dateString);

  useEffect(() => {
    if (!isReady) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await createClient()
          .from("events")
          .select("id, slug, title, city, date_string")
          .eq("status", "approved")
          .eq("date_string", dateString)
          .limit(CANDIDATE_LIMIT)
          .abortSignal(controller.signal);
        if (controller.signal.aborted) return;
        if (error) throw error;
        setSimilarEvent(
          findSimilarEvent({ id: currentEventId, title: trimmedTitle, city, date_string: dateString }, data ?? [])
        );
      } catch {
        if (!controller.signal.aborted) setSimilarEvent(null);
      }
    }, CHECK_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isReady, trimmedTitle, city, dateString, currentEventId]);

  return isReady ? similarEvent : null;
}
