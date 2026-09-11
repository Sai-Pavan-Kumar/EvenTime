/**
 * Ultra-lightweight reactive client-side event bus for 0ms instant UI state synchronization.
 * Syncs user interactions (Interested count, Bookmark/Save, Delete, Flag) across all cards
 * and screens in real-time with ZERO database queries or server bills.
 */

export type EventSyncPayload = {
  eventId: string;
  type: 'interest' | 'save' | 'delete' | 'report';
  isInterested?: boolean;
  interestedCountDelta?: number;
  newInterestedCount?: number;
  isSaved?: boolean;
};

type EventSyncListener = (payload: EventSyncPayload) => void;

class EventSyncBus {
  private listeners = new Set<EventSyncListener>();

  emit(payload: EventSyncPayload) {
    if (typeof window !== 'undefined') {
      // 1. Direct in-memory broadcast
      this.listeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (e) {
          console.error('[EventSync] Listener error:', e);
        }
      });

      // 2. DOM CustomEvent for decoupled components
      try {
        window.dispatchEvent(
          new CustomEvent('eventime:sync', { detail: payload })
        );
      } catch {}
    }
  }

  subscribe(listener: EventSyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const eventSync = new EventSyncBus();
