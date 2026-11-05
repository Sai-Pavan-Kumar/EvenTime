import { NextResponse } from "next/server";
import { CITY_COORDINATES } from "@/lib/constants/cityCoordinates";
import type { SceneWeather } from "@/lib/home/sceneClock";

const CACHE_SECONDS = 1800;
// Shorter than the forecast cache, so the hour rolling over reaches visitors quickly.
const EDGE_CACHE_SECONDS = 300;
const FORECAST_URL = "https://api.met.no/weatherapi/locationforecast/2.0/compact";
// MET Norway blocks requests that don't identify the application.
const USER_AGENT = `EvenTime/1.0 ${process.env.NEXT_PUBLIC_APP_URL || "https://eventime.thesurfboard.in"}`;

function toSceneWeather(symbolCode: string): SceneWeather {
  if (/^light(rain|sleet|snow)/.test(symbolCode)) return "drizzle";
  if (/rain|sleet|snow|thunder/.test(symbolCode)) return "rain";
  if (/^cloudy|fog/.test(symbolCode)) return "cloudy";
  return "clear";
}

// Only known cities reach MET, and each is cached, so upstream traffic stays flat however many visitors arrive.
export async function GET(request: Request) {
  const city = new URL(request.url).searchParams.get("city") ?? "";
  if (!Object.hasOwn(CITY_COORDINATES, city)) {
    return NextResponse.json({ error: "Unknown city" }, { status: 400 });
  }
  const [lat, lon] = CITY_COORDINATES[city as keyof typeof CITY_COORDINATES];

  try {
    const response = await fetch(`${FORECAST_URL}?lat=${lat}&lon=${lon}`, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: CACHE_SECONDS },
    });
    if (!response.ok) throw new Error(`MET responded ${response.status}`);

    const forecast = await response.json();
    // The cached forecast's first hour goes stale, so pick the entry covering this moment.
    const timeseries: { time: string; data?: { next_1_hours?: { summary?: { symbol_code?: unknown } } } }[] = forecast?.properties?.timeseries ?? [];
    const now = Date.now();
    const currentEntry = timeseries.findLast((entry) => Date.parse(entry.time) <= now) ?? timeseries[0];
    const symbolCode = currentEntry?.data?.next_1_hours?.summary?.symbol_code;
    if (typeof symbolCode !== "string") throw new Error("MET response had no symbol code");

    return NextResponse.json(
      { weather: toSceneWeather(symbolCode) },
      { headers: { "Cache-Control": `public, s-maxage=${EDGE_CACHE_SECONDS}, stale-while-revalidate=${EDGE_CACHE_SECONDS}` } }
    );
  } catch (error) {
    console.error("Weather lookup failed", error);
    return NextResponse.json({ error: "Weather unavailable" }, { status: 502 });
  }
}
