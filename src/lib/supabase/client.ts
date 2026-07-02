import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// SAFEGUARD: Fix iOS Safari Private Browsing crash (SecurityError on localStorage)
if (typeof window !== 'undefined') {
  try {
    window.localStorage.getItem('test');
  } catch (error) {
    console.warn('localStorage is blocked by iOS/Safari. Injecting memory fallback.');
    const memoryStorage = {
      getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}, length: 0, key: () => null
    };
    try {
      Object.defineProperty(window, 'localStorage', { value: memoryStorage, writable: true });
      Object.defineProperty(window, 'sessionStorage', { value: memoryStorage, writable: true });
    } catch (e) {}
  }

  // SAFEGUARD: Fix iOS WebSocket insecure operation crash
  try {
    const OriginalWebSocket = window.WebSocket;
    if (OriginalWebSocket) {
      window.WebSocket = function(url: string | URL, protocols?: string | string[]) {
        try {
          return new OriginalWebSocket(url, protocols);
        } catch (e) {
          console.warn("WebSocket blocked by iOS/Safari:", e);
          return { // Return dummy closed WebSocket to prevent app crash
            close: () => {}, send: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true,
            readyState: 3, CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3, url: url?.toString() || ""
          } as unknown as WebSocket;
        }
      } as any;
      window.WebSocket.prototype = OriginalWebSocket.prototype;
      Object.assign(window.WebSocket, OriginalWebSocket);
    }
  } catch (e) {}
}

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