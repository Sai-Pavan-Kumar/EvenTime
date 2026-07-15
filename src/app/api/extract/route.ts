import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";
import { isIP } from "net";
import dns from "dns/promises";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface ExtractedEvent {
  title: string;
  description: string;
  image: string;
  date: string;
  location: string;
}

interface ExtractionResult extends ExtractedEvent {
  confidence: number;
  isTrusted: boolean;
  finalDomain: string;
  finalUrl: string;
  message: string;
}

type ExtractorFn = ($: cheerio.CheerioAPI, jsonLd: Record<string, unknown> | null) => ExtractedEvent;

// ─────────────────────────────────────────────
// BLOCKED PLATFORMS (no point fetching these)
// ─────────────────────────────────────────────

const BLOCKED_DOMAINS = ["instagram.com", "whatsapp.com", "wa.me", "facebook.com"];

// ─────────────────────────────────────────────
// CONFIDENCE SCORING
// Higher weight = more reliable signal for an event page
// ─────────────────────────────────────────────

function scoreConfidence(event: ExtractedEvent): number {
  let score = 0;
  if (event.title)       score += 0.40;
  if (event.date)        score += 0.30;
  if (event.location)    score += 0.20;
  if (event.description) score += 0.10;
  return parseFloat(score.toFixed(2));
}

// ─────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────

function safeStr(value: unknown): string {
  if (typeof value === "string") return value.replace(/\n/g, " ").trim();
  return "";
}

/** Pull common OG/Twitter/title tags — used as fallback by all extractors */
function extractOgBase($: cheerio.CheerioAPI): ExtractedEvent {
  return {
    title:       safeStr($('meta[property="og:title"]').attr("content") ?? $("title").text()),
    description: safeStr($('meta[property="og:description"]').attr("content") ?? $('meta[name="description"]').attr("content")),
    image:       safeStr($('meta[property="og:image"]').attr("content") ?? $('meta[name="twitter:image"]').attr("content")),
    date:        "",
    location:    "",
  };
}

/** Pull startDate + location from a JSON-LD Event object */
function extractFromJsonLd(jsonLd: Record<string, unknown> | null): { date: string; location: string } {
  if (!jsonLd) return { date: "", location: "" };

  const date = safeStr(
    (jsonLd["startDate"] as string) ??
    ((jsonLd["eventSchedule"] as Record<string, unknown>)?.[0] as Record<string, unknown>)?.["startDate"]
  );

  const locationObj = jsonLd["location"] as Record<string, unknown> | undefined;
  const location = safeStr(
    (locationObj?.["name"] as string) ??
    ((locationObj?.["address"] as Record<string, unknown>)?.["streetAddress"] as string) ??
    (locationObj?.["address"] as string)
  );

  return { date, location };
}

// ─────────────────────────────────────────────
// PLATFORM-SPECIFIC EXTRACTORS
// ─────────────────────────────────────────────

/** Luma: relies heavily on JSON-LD for date/location */
const extractFromLuma: ExtractorFn = ($, jsonLd) => {
  const base = extractOgBase($);
  const { date, location } = extractFromJsonLd(jsonLd);
  return { ...base, date, location };
};

/** Eventbrite: JSON-LD first, OG fallback */
const extractFromEventbrite: ExtractorFn = ($, jsonLd) => {
  const base = extractOgBase($);
  const { date, location } = extractFromJsonLd(jsonLd);

  // Eventbrite puts a clean date in a specific data attribute sometimes
  const domDate = safeStr($('time[datetime]').attr("datetime"));
  const domLocation = safeStr($('[class*="location-info__address"]').first().text());

  return {
    ...base,
    date:     date || domDate,
    location: location || domLocation,
  };
};

/** Meetup: JSON-LD first, then their DOM selectors */
const extractFromMeetup: ExtractorFn = ($, jsonLd) => {
  const base = extractOgBase($);
  const { date, location } = extractFromJsonLd(jsonLd);

  const domDate     = safeStr($('time').attr("datetime"));
  const domLocation = safeStr($('[data-testid="venue-name-link"]').first().text() ?? $('[class*="venueDisplay"]').first().text());

  return {
    ...base,
    date:     date || domDate,
    location: location || domLocation,
  };
};

/** Devfolio: OG tags + their specific class selectors */
const extractFromDevfolio: ExtractorFn = ($, _jsonLd) => {
  const base = extractOgBase($);
  const title = base.title || safeStr($(".hackathon-title").text()) || safeStr($("h1").first().text());
  const description = base.description || safeStr($(".hackathon-tagline").text());
  const date     = safeStr($('[class*="date"]').first().text());
  const location = safeStr($('[class*="location"]').first().text());
  return { ...base, title, description, date, location };
};

/** Unstop: OG tags + h1 fallback */
const extractFromUnstop: ExtractorFn = ($, _jsonLd) => {
  const base = extractOgBase($);
  const title = base.title || safeStr($("h1").first().text());
  return { ...base, title };
};

/** Townscript: OG tags + JSON-LD */
const extractFromTownscript: ExtractorFn = ($, jsonLd) => {
  const base = extractOgBase($);
  const { date, location } = extractFromJsonLd(jsonLd);
  return { ...base, date, location };
};

/** BookMyShow / Insider (insider.in): OG + JSON-LD */
const extractFromBMS: ExtractorFn = ($, jsonLd) => {
  const base = extractOgBase($);
  const { date, location } = extractFromJsonLd(jsonLd);
  return { ...base, date, location };
};

/** Generic fallback: used for all other verified platforms */
const extractGeneric: ExtractorFn = ($, jsonLd) => {
  const base = extractOgBase($);
  const { date, location } = extractFromJsonLd(jsonLd);
  return { ...base, date, location };
};

// ─────────────────────────────────────────────
// STRATEGY MAP  (domain substring → extractor)
// ─────────────────────────────────────────────

const EXTRACTOR_MAP: Array<{ match: string; fn: ExtractorFn }> = [
  { match: "lu.ma",          fn: extractFromLuma },
  { match: "luma.com",       fn: extractFromLuma },
  { match: "eventbrite.com", fn: extractFromEventbrite },
  { match: "meetup.com",     fn: extractFromMeetup },
  { match: "devfolio.co",    fn: extractFromDevfolio },
  { match: "unstop.com",     fn: extractFromUnstop },
  { match: "townscript.com", fn: extractFromTownscript },
  { match: "bookmyshow.com", fn: extractFromBMS },
  { match: "insider.in",     fn: extractFromBMS },
  // All other verified platforms use the generic extractor
  { match: "skillenza.com",  fn: extractGeneric },
  { match: "allevents.in",   fn: extractGeneric },
  { match: "goavo.ai",       fn: extractGeneric },
  { match: "meraevents.com", fn: extractGeneric },
  { match: "eventsframe.com",fn: extractGeneric },
  { match: "ticketleap.com", fn: extractGeneric },
  { match: "ticketbud.com",  fn: extractGeneric },
  { match: "airmeet.com",    fn: extractGeneric },
  { match: "zoho.com",       fn: extractGeneric },
  { match: "hubilo.com",     fn: extractGeneric },
  { match: "10times.com",    fn: extractGeneric },
  { match: "eventcombo.com", fn: extractGeneric },
  { match: "eventzilla.net", fn: extractGeneric },
  { match: "ticketfairy.com",fn: extractGeneric },
  { match: "socio.events",   fn: extractGeneric },
  { match: "eventcreate.com",fn: extractGeneric },
  { match: "splashthat.com", fn: extractGeneric },
  { match: "eventtia.com",   fn: extractGeneric },
];

function getExtractor(hostname: string): ExtractorFn {
  const entry = EXTRACTOR_MAP.find(({ match }) => hostname.includes(match));
  return entry ? entry.fn : extractGeneric;
}

// ─────────────────────────────────────────────
// SAFE JSON-LD PARSER
// ─────────────────────────────────────────────

function parseJsonLd(html: string): Record<string, unknown> | null {
  try {
    // Load just the script tag from the full HTML
    const $ = cheerio.load(html);
    const raw = $('script[type="application/ld+json"]').first().html();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // JSON-LD can be an array; unwrap if needed
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// SSRF PROTECTION
// ─────────────────────────────────────────────

// Blocked IP ranges — loopback, private, link-local, metadata
const BLOCKED_IP_RANGES = [
  /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./, /^::1$/, /^fc00:/, /^fe80:/,
];

function isBlockedIp(address: string): boolean {
  return BLOCKED_IP_RANGES.some((re) => re.test(address));
}

// Resolves hostname ourselves and returns the SAME ip we will connect to.
// This closes the DNS-rebinding gap where a check-time lookup and the
// actual fetch-time lookup could return two different IPs.
async function resolveSafeIp(hostname: string): Promise<string | null> {
  try {
    const result = await dns.lookup(hostname);
    if (isBlockedIp(result.address)) return null;
    return result.address;
  } catch {
    return null;
  }
}

async function isSafeUrl(rawUrl: string): Promise<{ safe: boolean; ip: string | null }> {
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { return { safe: false, ip: null }; }

  if (!["http:", "https:"].includes(parsed.protocol)) return { safe: false, ip: null };

  const ip = await resolveSafeIp(parsed.hostname);
  return { safe: !!ip, ip };
}

// ─────────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────────

// Rate limiting is now handled via Supabase DB

// ─────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────

export async function POST(request: Request) {
  const EMPTY_RESULT: ExtractionResult = {
    title: "", description: "", image: "", date: "",
    location: "", confidence: 0, isTrusted: false,
    finalDomain: "", finalUrl: "", message: "",
  };

  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ...EMPTY_RESULT, message: "Unauthorized" }, { status: 401 });
    }

    // Extract client IP for rate limiting
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown-ip";
    
    // Check DB rate limit
    const { data: rlData } = await supabase
      .from("rate_limits")
      .select("request_count, reset_at")
      .eq("ip_address", clientIp)
      .eq("endpoint", "/api/extract")
      .single();

    const now = new Date();
    
    if (rlData && new Date(rlData.reset_at) > now) {
      if (rlData.request_count >= 5) {
        return NextResponse.json({ ...EMPTY_RESULT, message: "Rate limit exceeded. Please wait a minute." }, { status: 429 });
      }
      
      // Increment count
      await supabase
        .from("rate_limits")
        .update({ request_count: rlData.request_count + 1 })
        .eq("ip_address", clientIp)
        .eq("endpoint", "/api/extract");
    } else {
      // Create new limit window
      const resetAt = new Date(now.getTime() + 60000); // 1 min from now
      
      if (rlData) {
        await supabase
          .from("rate_limits")
          .update({ request_count: 1, reset_at: resetAt.toISOString() })
          .eq("ip_address", clientIp)
          .eq("endpoint", "/api/extract");
      } else {
        await supabase
          .from("rate_limits")
          .insert({
            ip_address: clientIp,
            endpoint: "/api/extract",
            request_count: 1,
            reset_at: resetAt.toISOString()
          });
      }
    }

    // URL validation
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ ...EMPTY_RESULT, message: "URL is required" }, { status: 400 });
    }

    // SSRF validation — resolve once, remember the IP we're allowed to hit
    const { safe, ip } = await isSafeUrl(url);
    if (!safe || !ip) {
      return NextResponse.json({ ...EMPTY_RESULT, message: "URL not allowed." }, { status: 422 });
    }

    // Block unsupported platforms before fetching
    const isBlocked = BLOCKED_DOMAINS.some((d) => url.includes(d));
    if (isBlocked) {
      return NextResponse.json({
        ...EMPTY_RESULT,
        message: "This platform (Instagram/WhatsApp/Facebook) does not allow automatic event extraction. Please enter event details manually.",
      }, { status: 422 });
    }

    // Fetch manually hop-by-hop (max 3 redirects), re-checking SSRF safety
    // at every hop instead of letting fetch() silently follow redirects
    // and re-resolve DNS on its own (that's the rebinding hole).
    let currentUrl = url;
    let res: Response | null = null;
    try {
      for (let hop = 0; hop < 4; hop++) {
        const { safe: hopSafe, ip: hopIp } = await isSafeUrl(currentUrl);
        if (!hopSafe || !hopIp) {
          return NextResponse.json({ ...EMPTY_RESULT, message: "URL not allowed." }, { status: 422 });
        }

        const attempt = await fetch(currentUrl, {
          signal: AbortSignal.timeout(8000),
          redirect: "manual",
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        });

        if ([301, 302, 303, 307, 308].includes(attempt.status)) {
          const location = attempt.headers.get("location");
          if (!location) return NextResponse.json({ ...EMPTY_RESULT, message: "Could not reach the event page." }, { status: 504 });
          currentUrl = new URL(location, currentUrl).toString();
          continue;
        }

        res = attempt;
        break;
      }
      if (!res) {
        return NextResponse.json({ ...EMPTY_RESULT, message: "Too many redirects." }, { status: 422 });
      }
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "TimeoutError";
      return NextResponse.json({
        ...EMPTY_RESULT,
        message: isTimeout
          ? "The event page took too long to respond. Please try again or enter details manually."
          : "Could not reach the event page. Check the URL and try again.",
      }, { status: 504 });
    }

    const finalUrl = res.url || currentUrl;
    
    const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.length;
        if (totalBytes > MAX_BODY_BYTES) {
          reader.cancel();
          return NextResponse.json({ ...EMPTY_RESULT, message: "Page too large to extract." }, { status: 422 });
        }
        chunks.push(value);
      }
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks));

    // Parse hostname
    const parsedUrl = new URL(finalUrl);
    let hostname = parsedUrl.hostname.toLowerCase();
    if (hostname.startsWith("www.")) hostname = hostname.slice(4);

    // Trusted domain check (matches hostname, or hostname+path for shared hosts like Google Forms)
    const fullPath = `${hostname}${parsedUrl.pathname}`;
    const { data: trustedDomains } = await supabase
      .from("verified_domains")
      .select("domain_name");
    const isTrusted = !!trustedDomains?.some(
      (d) => hostname === d.domain_name || fullPath.startsWith(d.domain_name)
    );

    // Parse HTML + JSON-LD
    const $ = cheerio.load(html);
    const jsonLd = parseJsonLd(html);

    // Pick and run the right extractor
    const extractor = getExtractor(hostname);
    const extracted = extractor($, jsonLd);

    // Score confidence
    const confidence = scoreConfidence(extracted);

    const result: ExtractionResult = {
      ...extracted,
      confidence,
      isTrusted,
      finalDomain: hostname,
      finalUrl,
      message: confidence < 0.8
        ? "Some event details could not be extracted. Please review and fill in the missing fields."
        : "Event details extracted successfully.",
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json({
      ...EMPTY_RESULT,
      message: "An unexpected error occurred while extracting event data.",
    }, { status: 500 });
  }
}