"use client";

import { useEffect, useState } from "react";
import type { SceneWeather } from "./sceneClock";

// Cheap because the API is cached per city; this only decides how soon an open tab notices a change.
const REFRESH_MS = 5 * 60_000;

// Weather only decorates the banner, so any failure quietly keeps the plain time-of-day scene.
export function useCityWeather(city: string | null | undefined): SceneWeather {
  const [weather, setWeather] = useState<SceneWeather>("clear");

  useEffect(() => {
    if (!city) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`, { signal: controller.signal });
        if (!response.ok) return;
        const body = (await response.json()) as { weather?: SceneWeather };
        if (body.weather) setWeather(body.weather);
      } catch {
        // Offline or aborted: the current scene is still correct enough.
      }
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    // Browsers throttle timers in background tabs, so coming back must check straight away.
    const loadWhenVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", loadWhenVisible);
    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", loadWhenVisible);
    };
  }, [city]);

  return city ? weather : "clear";
}
