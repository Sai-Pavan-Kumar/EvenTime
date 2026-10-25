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
