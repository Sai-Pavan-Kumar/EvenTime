import { CITIES } from "@/lib/constants/cities";

export interface EventDetails {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  city: string;
  isOnline: boolean;
}

// Our users are in India, and platforms like Luma publish times in UTC.
const EVENT_TIME_ZONE = "Asia/Kolkata";
const ISO_DATE_TIME = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?)?/;

// Event pages often use the older name, and our city list has only the current one.
const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  bombay: "Mumbai",
  calcutta: "Kolkata",
  cochin: "Kochi",
  delhi: "New Delhi",
  gurgaon: "Gurugram",
  madras: "Chennai",
  mangalore: "Mangaluru",
  mysore: "Mysuru",
  trivandrum: "Thiruvananthapuram",
  vizag: "Visakhapatnam",
};

const CITY_NAMES: Array<[string, string]> = [
  ...CITIES.map((city): [string, string] => [city.toLowerCase(), city]),
  ...Object.entries(CITY_ALIASES),
];

// Platforms append their own name to page titles, and it must not become part of the event's name.
const PLATFORM_SUFFIX = /\s+[·•|–—-]\s+(luma|lu\.ma|eventbrite|meetup|unstop|devfolio|devnovate|townscript|skillenza|allevents(\.in)?|bookmyshow|insider(\.in)?|meraevents|10times|google forms)\s*$/i;

export function removePlatformName(title: string): string {
  return title.replace(PLATFORM_SUFFIX, "").trim();
}

function findCity(text: string): string {
  const lower = text.toLowerCase();
  const match = CITY_NAMES.find(([name]) => new RegExp(`\\b${name}\\b`).test(lower));
  return match ? match[1] : "";
}

function to12Hour(hour24: number, minute: string): string {
  const hour = hour24 % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${minute} ${hour24 < 12 ? "AM" : "PM"}`;
}

function splitDateTime(raw: unknown): { date: string; time: string } {
  const match = typeof raw === "string" ? raw.trim().match(ISO_DATE_TIME) : null;
  if (!match) return { date: "", time: "" };

  const [, date, hour, minute, offset] = match;
  if (!hour) return { date, time: "" };
  if (!offset) return { date, time: to12Hour(Number(hour), minute) };

  const instant = new Date((raw as string).trim());
  if (isNaN(instant.getTime())) return { date: "", time: "" };
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: to12Hour(Number(part("hour")), part("minute")),
  };
}

function isVirtualLocation(location: Record<string, unknown> | undefined): boolean {
  return location?.["@type"] === "VirtualLocation";
}

/** Fields the website form needs beyond the original response. fallbackDate covers pages with no JSON-LD. */
export function extractEventDetails(jsonLd: Record<string, unknown> | null, fallbackDate: string): EventDetails {
  const start = splitDateTime(jsonLd?.["startDate"] ?? fallbackDate);
  const end = splitDateTime(jsonLd?.["endDate"]);

  const rawLocation = jsonLd?.["location"];
  const location = (Array.isArray(rawLocation) ? rawLocation[0] : rawLocation) as Record<string, unknown> | undefined;
  const address = location?.["address"];
  const locality = typeof address === "object" && address ? (address as Record<string, unknown>)["addressLocality"] : "";

  const placeTexts = [locality, typeof address === "string" ? address : "", location?.["name"], typeof rawLocation === "string" ? rawLocation : ""];
  const city = placeTexts.reduce<string>((found, text) => found || (typeof text === "string" ? findCity(text) : ""), "");

  return {
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    city,
    isOnline: String(jsonLd?.["eventAttendanceMode"] ?? "").includes("OnlineEventAttendanceMode") || isVirtualLocation(location),
  };
}
