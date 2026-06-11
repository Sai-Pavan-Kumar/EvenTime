import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Shared instance to ensure all components listen to the exact same auth state
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

// This creates a secure connection to Supabase from the browser with a 30-day session expiry configuration
export function createClient() {
  if (supabaseClient) return supabaseClient;

  supabaseClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: 2592000, // Explicitly configuration for 30 days in seconds
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        // Note: HttpOnly is omitted here intentionally. It must be enforced on the server-side client.
      }
    }
  );

  return supabaseClient;
}