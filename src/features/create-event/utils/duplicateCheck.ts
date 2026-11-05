/**
 * Normalizes a registration link and extracts the event ID / path pattern
 * for robust duplicate detection across varying link formats.
 */
export function normalizeRegistrationLink(rawLink: string): {
  normalized: string;
  eventIdSegment: string | null;
  pattern: string;
} | null {
  const trimmed = rawLink.trim();
  if (!trimmed || trimmed.length < 5) return null;

  // Auto-normalize protocol if user types/pastes "lu.ma/xxx" without http/https
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = url.pathname.replace(/\/$/, "");
    const normalized = `${host}${pathname}`;

    const segments = url.pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] || null;

    // Filter out common route stems that aren't unique event identifiers
    const genericSegments = new Set([
      "events",
      "event",
      "register",
      "registration",
      "e",
      "view",
      "details",
      "home",
      "index",
    ]);
    const isGeneric =
      !lastSegment || genericSegments.has(lastSegment.toLowerCase());
    const eventIdSegment =
      !isGeneric && lastSegment.length >= 3 ? lastSegment : null;

    // If we have a unique eventId (slug or numeric ID), match by segment so tracking parameters,
    // custom subdomains, or mobile app deep links don't evade detection.
    const pattern = eventIdSegment ? `%/${eventIdSegment}%` : `%${normalized}%`;

    return { normalized, eventIdSegment, pattern };
  } catch {
    const cleaned = trimmed
      .replace(/^https?:\/\/(www\.)?/, "")
      .replace(/\/$/, "");
    return { normalized: cleaned, eventIdSegment: null, pattern: `%${cleaned}%` };
  }
}

// Deleted and rejected events no longer occupy their link, so it can be posted again.
export const IGNORED_DUPLICATE_STATUSES = "(deleted,rejected)";
export const DUPLICATE_CANDIDATE_LIMIT = 25;

function baseDomain(normalized: string) {
  return normalized.split("/")[0].split(".").slice(-2).join(".");
}

// The search pattern is deliberately loose, so a.com/hackathon also finds b.com/hackathon-2026.
// This decides the real match: same site and same event id, ignoring tracking params and subdomains.
export function isSameRegistrationLink(first: string, second: string | null) {
  const a = normalizeRegistrationLink(first);
  const b = second ? normalizeRegistrationLink(second) : null;
  if (!a || !b) return false;
  if (a.normalized.toLowerCase() === b.normalized.toLowerCase()) return true;
  return Boolean(a.eventIdSegment) && a.eventIdSegment?.toLowerCase() === b.eventIdSegment?.toLowerCase() && baseDomain(a.normalized) === baseDomain(b.normalized);
}
