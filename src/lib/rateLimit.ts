import { createAdminClient } from "@/lib/supabase/admin";

// The counter function is closed to the public API (anyone could lock out any IP with it), so only
// the server may call it, with the service key.
// Fails closed: if the check itself breaks, the request is refused, because the endpoints guarded here
// cost money (storage, outbound fetches) and an outage must not become an open door.
export async function isWithinRateLimit(
  subject: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const { data: allowed, error } = await createAdminClient().rpc("check_and_increment_rate_limit", {
    p_ip_address: subject,
    p_endpoint: endpoint,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error(`Rate limit check failed for ${endpoint}:`, error);
    return false;
  }
  return allowed === true;
}

// On Vercel the first x-forwarded-for entry is written by the platform, not the visitor.
export function getClientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "unknown-ip";
}
