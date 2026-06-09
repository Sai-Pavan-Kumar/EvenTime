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

async function isSafeUrl(rawUrl: string): Promise<boolean> {
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { return false; }
  
  // Only allow http/https
  if (!["http:", "https:"].includes(parsed.protocol)) return false;
  
  // Resolve hostname to IP and block private ranges
  let address: string;
  try {
    const result = await dns.lookup(parsed.hostname);
    address = result.address;
  } catch { return false; }
  
  // Block loopback, private, link-local, metadata ranges
  const BLOCKED = [
    /^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./,
    /^169\.254\./, /^::1$/, /^fc00:/, /^fe80:/,
  ];
  return !BLOCKED.some((re) => re.test(address));
}

// ─────────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxPerMinute = 5): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= maxPerMinute) return false;
  entry.count++;
  return true;
}

// ─────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────

export async function POST(request: Request) {
  const EMPTY_RESULT: ExtractionResult = {
    title: "", description: "", image: "", date: "",
    location: "", confidence: 0, isTrusted: false,
    finalDomain: "", message: "",
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
    if (!checkRateLimit(clientIp, 5)) {
      return NextResponse.json({ ...EMPTY_RESULT, message: "Rate limit exceeded. Please wait a minute." }, { status: 429 });
    }

    // URL validation
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ ...EMPTY_RESULT, message: "URL is required" }, { status: 400 });
    }

    // SSRF validation
    if (!(await isSafeUrl(url))) {
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

    // Fetch with 8-second timeout
    let res: Response;
    try {
      res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "TimeoutError";
      return NextResponse.json({
        ...EMPTY_RESULT,
        message: isTimeout
          ? "The event page took too long to respond. Please try again or enter details manually."
          : "Could not reach the event page. Check the URL and try again.",
      }, { status: 504 });
    }

    const finalUrl = res.url;
    
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

    // Trusted domain check
    const { data: trustedDomain } = await supabase
      .from("verified_domains")
      .select("domain_name")
      .eq("domain_name", hostname)
      .maybeSingle();
    const isTrusted = !!trustedDomain;

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