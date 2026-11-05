import { DEFAULT_CURRENCY, isSupportedCurrency } from "@/lib/eventPrice";
import type { SubmitEventActionPayload } from "./eventSubmission";

const MAX_LENGTHS = { title: 100, category: 60, description: 3000, location: 150, organizer_name: 80, prizes: 120, team_size: 40, college_branch: 100, college_year: 20 } as const;
const MAX_PRICE = 9_999_999;
const MAX_AUDIENCE_GROUPS = 10;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(0?[1-9]|1[0-2]):[0-5]\d (AM|PM)$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS_AHEAD = 367;

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function isValidWebLink(link: string) {
  try {
    const { protocol, hostname } = new URL(link);
    return (protocol === "http:" || protocol === "https:") && hostname.includes(".");
  } catch {
    return false;
  }
}

function minutesSinceMidnight(time: string) {
  const [clock, period] = time.split(" ");
  const [hour, minute] = clock.split(":").map(Number);
  return ((hour % 12) + (period === "PM" ? 12 : 0)) * 60 + minute;
}

function checkLengths(payload: SubmitEventActionPayload) {
  for (const [field, max] of Object.entries(MAX_LENGTHS)) {
    const value = payload[field as keyof typeof MAX_LENGTHS];
    if (typeof value === "string" && value.length > max) return `${field.replace("_", " ")} is too long.`;
  }
  return null;
}

function checkDates(payload: SubmitEventActionPayload, isEditing: boolean, now: number) {
  if (!DATE_PATTERN.test(payload.date_string || "") || Number.isNaN(Date.parse(payload.date_string))) return "Please pick a valid event date.";
  if (payload.end_date_string && (!DATE_PATTERN.test(payload.end_date_string) || payload.end_date_string < payload.date_string)) {
    return "The end date can't be before the start date.";
  }
  if (!isEditing) {
    // A day of slack: the server clock is UTC while most posters are ahead of it in IST.
    const earliest = new Date(now - DAY_MS).toISOString().slice(0, 10);
    const latest = new Date(now + MAX_DAYS_AHEAD * DAY_MS).toISOString().slice(0, 10);
    if (payload.date_string < earliest) return "Event date can't be in the past.";
    if (payload.date_string > latest) return "Event date can't be more than 1 year ahead.";
  }
  return null;
}

// Older events hold free-form times, so an edit must not fail on a field the poster never touched.
function checkTimes(payload: SubmitEventActionPayload, isEditing: boolean) {
  const { start_time: start, end_time: end, end_date_string: endDate, date_string: date } = payload;
  if (isEditing && !((start && TIME_PATTERN.test(start)) && (end && TIME_PATTERN.test(end)))) return null;
  if ((start && !TIME_PATTERN.test(start)) || (end && !TIME_PATTERN.test(end))) return "Please pick a valid time.";
  const isSameDay = !endDate || endDate === date;
  if (start && end && isSameDay && minutesSinceMidnight(end) <= minutesSinceMidnight(start)) {
    return "The end time must be after the start time. For overnight events, add an end date.";
  }
  return null;
}

// The browser form checks most of this too, but a direct request skips the browser entirely.
export function validateEventPayload(payload: SubmitEventActionPayload, isEditing: boolean, now = Date.now()): string | null {
  if (!payload || typeof payload !== "object") return "Invalid event details.";
  if (typeof payload.title !== "string" || !payload.title.trim()) return "Please enter an event title.";
  if (typeof payload.category !== "string" || !payload.category.trim()) return "Please select a category.";
  if (typeof payload.description !== "string" || !payload.description.trim()) return "Please enter a description.";

  const problem = checkLengths(payload) || checkDates(payload, isEditing, now) || checkTimes(payload, isEditing);
  if (problem) return problem;

  if (payload.is_virtual && !payload.registration_link?.trim()) return "Online events need a registration link.";
  if (!payload.is_virtual && !payload.city?.trim()) return "Please select a city.";

  if (!payload.is_free) {
    const price = Number(payload.price);
    if (!Number.isInteger(price) || price <= 0 || price > MAX_PRICE) return "Please enter a valid ticket price.";
    if (!isSupportedCurrency(payload.price_currency || DEFAULT_CURRENCY)) return "Please pick a valid currency.";
  }

  if (payload.college_id && !isUuid(payload.college_id)) return "Please pick your college from the list.";
  if (payload.college_only && !payload.college_id) return "Pick the college from the list, or open this event to all colleges.";
  if (payload.target_audience && (!Array.isArray(payload.target_audience) || payload.target_audience.length > MAX_AUDIENCE_GROUPS)) return "Invalid audience.";
  return null;
}
