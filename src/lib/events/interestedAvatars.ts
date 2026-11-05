import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// Short on purpose: the home page cache only refreshes when events change, so it can't carry live interest.
const INTEREST_REFRESH_SECONDS = 60;
const INTERESTED_AVATARS_LIMIT = 3;

export const eventInterestTag = (eventId: string) => `event_interested_${eventId}`;

export const getCachedInterestedAvatars = (eventId: string) =>
  unstable_cache(
    async () => {
      // Two reads because the table has no foreign key to profiles, so a join cannot work.
      // Server key because guests lose access to user_id once the private-columns migration runs.
      const admin = createAdminClient();
      const { data: interestRows } = await admin
        .from("interested_events")
        .select("user_id")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(INTERESTED_AVATARS_LIMIT);
      const userIds = (interestRows || []).map((row) => row.user_id);
      if (userIds.length === 0) return [];
      const { data: profiles } = await admin
        .from("profiles")
        .select("username, avatar_url")
        .in("id", userIds)
        .is("deleted_at", null);
      return profiles || [];
    },
    ["interested_avatars_v2", eventId],
    { tags: [eventInterestTag(eventId)], revalidate: INTEREST_REFRESH_SECONDS }
  )();

export const getCachedInterestCount = (eventId: string) =>
  unstable_cache(
    async () => {
      const { count } = await createAdminClient()
        .from("interested_events")
        .select("event_id", { count: "exact", head: true })
        .eq("event_id", eventId);
      return count ?? 0;
    },
    ["interested_count", eventId],
    { tags: [eventInterestTag(eventId)], revalidate: INTEREST_REFRESH_SECONDS }
  )();
