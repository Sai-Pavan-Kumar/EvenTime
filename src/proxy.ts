import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_OPTIONS } from '@/lib/constants/cookies';

export async function proxy(request: NextRequest) {
  // A production build served over plain http (localhost, or a phone on the same Wi-Fi) would have
  // every asset force-upgraded to an https port that doesn't exist, leaving the page unstyled.
  // Hosting platforms report the visitor's real protocol here, so live traffic keeps the upgrade.
  const isHttps = request.headers.get('x-forwarded-proto') === 'https';
  // 'unsafe-eval' is only for the dev server's hot reload; production bundles never need eval.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''} https://us-assets.i.posthog.com https://us.i.posthog.com https://static.cloudflareinsights.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https: http:;
    font-src 'self';
    connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL} https://*.ingest.us.sentry.io https://*.posthog.com https://us.i.posthog.com https://vitals.vercel-insights.com https://cloudflareinsights.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${process.env.NODE_ENV === 'production' && isHttps ? "upgrade-insecure-requests;" : ""}
  `;
  const contentSecurityPolicyHeaderValue = cspHeader.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);

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

  const isProtected =
    request.nextUrl.pathname.startsWith('/events/new') ||
    request.nextUrl.pathname.endsWith('/edit') ||
    request.nextUrl.pathname.startsWith('/profile') ||
    request.nextUrl.pathname.startsWith('/et98');

  const isLoginRoute = request.nextUrl.pathname === '/login';

  // PERFORMANCE BOOST: Only query Supabase Auth for routes that actually require authorization
  if (isProtected || isLoginRoute) {
    const hasAuthCookie = request.cookies.getAll().some(c => c.name.includes('-auth-token'));
    let user = null;

    if (hasAuthCookie) {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }

    // Expose client_auth cookie for instant client-side auth checks
    response.cookies.set({
      name: 'client_auth',
      value: user ? 'true' : 'false',
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    if (user && isLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/profile';
      return NextResponse.redirect(url);
    }

    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};