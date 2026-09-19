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
 */
export function checkIsEventPast(
  dateString: string | null | undefined,
  endDateString?: string | null,
  endTime?: string | null,
  startTime?: string | null
): boolean {
  const targetDateStr = endDateString || dateString;
  if (!targetDateStr) return false;

  const targetDate = parseEventDateString(targetDateStr);
  if (!targetDate) return false;

  const timeStr = endTime || startTime;
  if (timeStr) {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
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

  // Fallback: If no time specified, consider it concluded at the end of that day
  targetDate.setHours(23, 59, 59, 999);
  return targetDate.getTime() < Date.now();
}