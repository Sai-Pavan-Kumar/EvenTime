import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

// TODO: Replace 'unsafe-inline' with nonce-based CSP after launch
// See: https://nextjs.org/docs/app/building-your-application/configuring/content-security
const nextConfig: NextConfig = {
  transpilePackages: ['leaflet', 'react-leaflet'],
   turbopack: {},
  images: {
     formats: ["image/avif", "image/webp"],
     remotePatterns: [
       { protocol: 'https', hostname: 'cdn.sbhub.in', pathname: '/**' },
       { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
       { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
       { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
     ],
     deviceSizes: [375, 640, 750, 828, 1080, 1200],
  },
  async headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf)$)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
                    {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://www.clarity.ms https://www.googletagmanager.com https://static.cloudflareinsights.com https://browser.sentry-cdn.com`,
              "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
              "font-src 'self' https://api.fontshare.com https://cdn.fontshare.com https://cdn.sbhub.in",
              "img-src 'self' data: blob: https://cdn.sbhub.in https://lh3.googleusercontent.com https://images.unsplash.com https://avatars.githubusercontent.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org",
              "connect-src 'self' ws: wss: https://*.supabase.co https://*.r2.cloudflarestorage.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://*.sentry.io https://*.clarity.ms https://*.google-analytics.com https://*.analytics.google.com https://cloudflareinsights.com",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          
        ],
      },
    ]
  }
};

// NEW: Export the configuration wrapped with PWA
export default withSentryConfig(withPWA(nextConfig), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "eventime",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  }
});
