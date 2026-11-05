"use server";

import { updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { eventInterestTag } from "@/lib/events/interestedAvatars";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Logged-in only, so strangers can't keep emptying the cache and forcing database reads.
export async function refreshEventInterest(eventId: string) {
  if (!UUID_PATTERN.test(eventId)) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) updateTag(eventInterestTag(eventId));
}
