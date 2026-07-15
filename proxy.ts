import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_OPTIONS } from '@/lib/constants/cookies';

// NEXT.JS 16.2+: The function MUST be named 'proxy' instead of 'middleware'
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options, ...COOKIE_OPTIONS });
          response.cookies.set({ name, value, ...options, ...COOKIE_OPTIONS });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options, ...COOKIE_OPTIONS });
          response.cookies.set({ name, value: "", ...options, ...COOKIE_OPTIONS });
        },
      },
    }
  );

  // Use getUser() for high-security checks
  const { data: { user } } = await supabase.auth.getUser();

  // NEW: Global Authentication Check Strategy
  // Expose a non-HttpOnly cookie so the client can instantly check auth status without an API call.
  response.cookies.set({
    name: 'client_auth',
    value: user ? 'true' : 'false',
    path: '/',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  // 1. If user IS logged in and tries to go to login page, send to profile
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/profile';
    return NextResponse.redirect(url);
  }

  const isProtected = 
    request.nextUrl.pathname.startsWith('/events/new') || 
    request.nextUrl.pathname.endsWith('/edit') || 
    request.nextUrl.pathname.startsWith('/profile') || 
    request.nextUrl.pathname.startsWith('/et98');
    
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

// Ensure the config remains to avoid unnecessary runs
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};