"use client";

const SEEN_EVENTS_STORAGE_KEY = "eventime_seen_event_ids";

export function getSeenEventIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SEEN_EVENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markEventAsSeen(eventId?: string | null): void {
  if (!eventId || typeof window === "undefined") return;
  try {
    const seen = getSeenEventIds();
    if (!seen.includes(eventId)) {
      seen.push(eventId);
      localStorage.setItem(SEEN_EVENTS_STORAGE_KEY, JSON.stringify(seen));
      window.dispatchEvent(new CustomEvent("eventime:event-seen", { detail: { eventId } }));
    }
  } catch {}
}

export function isEventNew(eventId?: string | null, createdAt?: string | null): boolean {
  if (!eventId || !createdAt) return false;
  
  // 1. Time decay check: max 24 hours allowed
  const createdMs = new Date(createdAt).getTime();
  if (isNaN(createdMs)) return false;
  
  const elapsedMs = Date.now() - createdMs;
  const isWithin24Hours = elapsedMs >= 0 && elapsedMs < 24 * 60 * 60 * 1000;
  if (!isWithin24Hours) return false;

  // 2. Interaction check: if already clicked/hovered/seen, it's no longer new
  const seenIds = getSeenEventIds();
  return !seenIds.includes(eventId);
}

// Looking at a feed tab counts as having seen what was in it. Without this, a tab keeps its dot
// for a whole day unless the person opens every single new event, which trains them to ignore it.
const FEED_VISITS_STORAGE_KEY = "eventime_feed_visited_at";

function getFeedVisits(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(FEED_VISITS_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function markFeedVisited(feed: string): void {
  if (typeof window === "undefined") return;
  try {
    const visits = getFeedVisits();
    visits[feed] = Date.now();
    localStorage.setItem(FEED_VISITS_STORAGE_KEY, JSON.stringify(visits));
    window.dispatchEvent(new CustomEvent("eventime:event-seen", { detail: { feed } }));
  } catch {}
}

export function isEventNewInFeed(feed: string, eventId?: string | null, createdAt?: string | null): boolean {
  if (typeof window === "undefined" || !isEventNew(eventId, createdAt)) return false;
  const lastVisitMs = getFeedVisits()[feed] ?? 0;
  return new Date(createdAt as string).getTime() > lastVisitMs;
}
