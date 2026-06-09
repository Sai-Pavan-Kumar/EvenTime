// src/lib/events/match.ts

import type { EventRow, ProfileRow } from "@/types";

export function getMatchLabel(
  event: Partial<EventRow>, 
  profile: Partial<ProfileRow> | null
): string | undefined {
  if (!profile?.is_onboarded) return undefined;
  
  const matchedGoal = event.goal_tags?.find(g => profile.goals?.includes(g));
  if (matchedGoal) return `Matches Goal: ${matchedGoal}`;
  
  if (profile.branch && event.branch_tags?.includes(profile.branch)) {
    return `Matches Branch: ${profile.branch}`;
  }
  
  return undefined;
}