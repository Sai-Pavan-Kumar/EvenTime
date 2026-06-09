import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// This creates a secure connection to Supabase from the browser with a 30-day session expiry configuration
export function createClient() {
   return createBrowserClient<Database>(
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
}