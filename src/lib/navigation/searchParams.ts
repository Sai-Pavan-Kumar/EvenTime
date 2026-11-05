"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";

// Why this exists: calling Next's useSearchParams() inside a statically prerendered page makes
// Next drop server rendering for everything up to the nearest <Suspense>. The Navbar is on
// every page, so every page shipped an empty shell and drew nothing until ~500 KB of JS had
// downloaded: a blank screen for seconds on a weak signal, and empty HTML for crawlers.
//
// Instead, ONE bridge (mounted in the root layout, inside its own Suspense) reads the real
// params and publishes them here. Server HTML renders with no params, which is the normal
// landing view; the client switches to the real URL right after hydration.

let currentQuery: string | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getClientSnapshot() {
  return currentQuery ?? window.location.search.replace(/^\?/, "");
}

function getServerSnapshot() {
  return "";
}

function publish(query: string) {
  if (query === currentQuery) return;
  currentQuery = query;
  listeners.forEach((listener) => listener());
}

export function SearchParamsBridge() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  useEffect(() => publish(query), [query]);
  return null;
}

/** Drop-in for useSearchParams() that never blocks server rendering. */
export function useNonBlockingSearchParams() {
  const query = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  return useMemo(() => new URLSearchParams(query), [query]);
}
