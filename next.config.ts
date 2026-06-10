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
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,  // tighten after audit
              "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
              "font-src 'self' https://api.fontshare.com https://cdn.sbhub.in",
              "img-src 'self' data: https://cdn.sbhub.in https://lh3.googleusercontent.com https://images.unsplash.com https://avatars.githubusercontent.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org",
              "connect-src 'self' https://*.supabase.co https://*.r2.cloudflarestorage.com https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          
        ],
      },
    ]
  }
};

// NEW: Export the configuration wrapped with PWA
export default withPWA(nextConfig);