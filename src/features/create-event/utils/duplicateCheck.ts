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
