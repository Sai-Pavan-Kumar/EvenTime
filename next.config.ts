import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // Investors and students open the site on one bar of signal. Caching every page and its
  // JS/CSS as people browse means the second visit renders from the phone, not the network.
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // By default every file in /public is precached: 24 MB of city photos on the very first visit,
  // which never finishes on a weak signal. Images are cached on demand instead, as people see them.
  publicExcludes: ["!noprecache/**/*", "!**/*.{webp,png,jpg,jpeg,gif,svg,mp4}"],
  disable: process.env.NODE_ENV === "development",
});

// See: https://nextjs.org/docs/app/building-your-application/configuring/content-security
const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['leaflet', 'react-leaflet'],
   turbopack: {},
  // Builds run on webpack (see package.json): next-pwa and Sentry tree-shaking are both webpack-only.
  webpack(config, { webpack, isServer }) {
    if (!isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          __SENTRY_DEBUG__: false,
          __SENTRY_TRACING__: false,
        })
      );
    }
    return config;
  },
  cacheLife: {
    events: {
      stale: 600,
      revalidate: 600,
      expire: 3600,
    },
    leaderboard: {
      stale: 600,
      revalidate: 600,
      expire: 3600,
    },
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  images: {
     // Vercel Hobby allows 5K transformations/month, then new images fail with 402 (not a bill,
     // but broken images). Every /public image is pre-sized with sharp instead (originals in
     // design-assets/public-originals/), and uploads/avatars are already small, so the optimizer is off.
     unoptimized: true,
     formats: ["image/avif", "image/webp"],
     remotePatterns: [
       { protocol: 'https', hostname: 'cdn.sbhub.in', pathname: '/**' },
       { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
       { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
       { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
       { protocol: 'https', hostname: 'images.lumacdn.com', pathname: '/**' },
       { protocol: 'https', hostname: '**.supabase.co', pathname: '/**' },
     ],
     deviceSizes: [375, 640, 750, 828, 1080, 1200],
  },
  async headers() {
    return [
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Access-Control-Allow-Origin", value: "*" },
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
          
        ],
      },
    ]
  }
};

// NEW: Export the configuration wrapped with PWA
export default withPWA(nextConfig);
