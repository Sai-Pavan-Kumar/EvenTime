import { parseISO } from "date-fns";

export function parseEventDateString(dateStr: string): Date | null {
  try {
    // Extract just the date part before the dot
    const raw = dateStr.split(" · ")[0];
    const parsed = parseISO(raw);
    
    // Check if the parsed date is actually valid
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}