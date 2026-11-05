import { CITIES } from "@/lib/constants/cities";

export const ONLINE_CITY = "online";

// Both city screens must agree, or a tile can promise events its page then hides.
export const PUBLIC_AUDIENCE_FILTER = `college_only.is.null,college_only.eq.false,target_audience.cs.{"Everyone"}`;

// A multi-day event stays listed until its last day, not just its first.
export const upcomingFilter = (today: string) => `date_string.gte.${today},end_date_string.gte.${today}`;

// Only real cities get a page, so a mistyped or invented URL cannot become an indexable one.
export function resolveCity(slug: string) {
  const normalized = decodeURIComponent(slug).replace(/-/g, " ").trim().toLowerCase();
  if (normalized === ONLINE_CITY) return ONLINE_CITY;
  return CITIES.find((c) => c.toLowerCase() === normalized) ?? null;
}

export function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function shortDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function cityLabel(name: string) {
  return name.toLowerCase() === ONLINE_CITY ? "Online" : name;
}
