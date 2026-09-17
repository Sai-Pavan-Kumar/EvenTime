/**
 * Verified event platform domains.
 * Events linked from these platforms are trusted and approved automatically upon posting.
 */
export const DEFAULT_VERIFIED_DOMAINS: string[] = [
  "eventbrite.com",
  "meetup.com",
  "luma.com",
  "lu.ma",
  "townscript.com",
  "unstop.com",
  "devfolio.co",
  "skillenza.com",
  "allevents.in",
  "bookmyshow.com",
  "in.bookmyshow.com",
  "insider.in",
  "goavo.ai",
  "meraevents.com",
  "eventsframe.com",
  "ticketleap.com",
  "ticketbud.com",
  "airmeet.com",
  "zoho.com/backstage",
  "hubilo.com",
  "10times.com",
  "eventcombo.com",
  "eventzilla.net",
  "ticketfairy.com",
  "socio.events",
  "docs.google.com/forms",
  "forms.gle",
  "forms.gle/",
  "eventcreate.com",
  "splashthat.com",
  "pages.razorpay.com",
  "rzp.io",
  "eventtia.com",
];

// In-memory cache for dynamically fetched domains from Supabase
let dynamicVerifiedDomains: Set<string> | null = null;

export function updateDynamicVerifiedDomains(domains: string[]) {
  if (Array.isArray(domains) && domains.length > 0) {
    dynamicVerifiedDomains = new Set(
      domains.map((d) => d.toLowerCase().trim())
    );
  }
}

/**
 * Checks if a given event registration URL belongs to a verified domain.
 * Supports:
 *  - Exact domain match (e.g. luma.com, lu.ma)
 *  - Subdomains (e.g. sub.devfolio.co, in.bookmyshow.com)
 *  - Path-specific shared platforms (e.g. docs.google.com/forms, forms.gle/...)
 */
export function isVerifiedDomain(rawUrl: string | null | undefined, customList?: string[]): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  let parsed: URL;
  try {
    const withProtocol = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
    parsed = new URL(withProtocol);
  } catch {
    return false;
  }

  let hostname = parsed.hostname.toLowerCase();
  if (hostname.startsWith("www.")) hostname = hostname.slice(4);
  const pathname = parsed.pathname.toLowerCase();
  const fullPath = `${hostname}${pathname}`;

  const domainsToCheck = customList && customList.length > 0
    ? customList
    : (dynamicVerifiedDomains ? Array.from(dynamicVerifiedDomains) : DEFAULT_VERIFIED_DOMAINS);

  return domainsToCheck.some((entry) => {
    const cleanEntry = entry.toLowerCase().trim().replace(/\/$/, "");
    if (!cleanEntry) return false;

    if (cleanEntry.includes("/")) {
      // Path-specific rule, e.g. "docs.google.com/forms" or "zoho.com/backstage"
      return fullPath === cleanEntry || fullPath.startsWith(`${cleanEntry}/`) || fullPath.startsWith(cleanEntry);
    }
    // Hostname or subdomain rule, e.g. "luma.com", "lu.ma", "devfolio.co"
    return hostname === cleanEntry || hostname.endsWith(`.${cleanEntry}`);
  });
}
