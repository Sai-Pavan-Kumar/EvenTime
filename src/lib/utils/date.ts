import { parseISO } from "date-fns";

export function parseEventDateString(dateStr: string): Date | null {
  try {
    if (!dateStr) return null;
    const raw = dateStr.split(" · ")[0]?.trim();
    if (!raw) return null;

    // YYYY-MM-DD format (construct local date to prevent UTC midnight date shift)
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split("-").map(Number);
      const localDate = new Date(y, m - 1, d);
      return isNaN(localDate.getTime()) ? null : localDate;
    }

    // Try parseISO
    const parsed = parseISO(raw);
    if (!isNaN(parsed.getTime())) return parsed;

    // Try native Date parsing
    const nativeDate = new Date(raw);
    if (!isNaN(nativeDate.getTime())) return nativeDate;

    // Timestamp
    const ts = Date.parse(raw);
    if (!isNaN(ts)) return new Date(ts);

    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if an event is concluded based on date string and optional time strings.
 * Supports end_date_string, date_string, end_time, and start_time.
 * If an event has an explicit end time (or a time range like "09:00 AM - 07:00 PM"),
 * it concludes once that end time passes.
 * If no explicit end time is provided, same-day events remain active for the day (conclude at 23:59:59).
 */
export function checkIsEventPast(
  dateString: string | null | undefined,
  endDateString?: string | null,
  endTime?: string | null,
  _startTime?: string | null
): boolean {
  const targetDateStr = endDateString || dateString;
  if (!targetDateStr) return false;

  const targetDate = parseEventDateString(targetDateStr);
  if (!targetDate) return false;

  let effectiveEndTime = endTime;

  // If no explicit endTime provided, check if the string contains a time range (e.g. "09:00 AM - 07:00 PM")
  if (!effectiveEndTime && targetDateStr.includes(" · ")) {
    const timePart = targetDateStr.split(" · ")[1];
    const matches = Array.from(timePart.matchAll(/(\d+):(\d+)\s*(AM|PM)?/gi));
    if (matches.length > 1) {
      effectiveEndTime = matches[matches.length - 1][0];
    }
  }

  if (effectiveEndTime && effectiveEndTime.trim()) {
    const match = effectiveEndTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3] ? match[3].toUpperCase() : null;
      if (ampm === "PM" && hours !== 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      targetDate.setHours(hours, minutes, 0, 0);
      return targetDate.getTime() < Date.now();
    }
  }

  // Fallback: If no explicit end time specified, consider it concluded at the end of that day (23:59:59)
  targetDate.setHours(23, 59, 59, 999);
  return targetDate.getTime() < Date.now();
}