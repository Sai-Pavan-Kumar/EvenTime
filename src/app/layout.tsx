import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "./providers";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import LaunchScreen from "@/components/layout/LaunchScreen";
import { Footer } from "@/components/layout/Footer";
import { DevToolsGuard } from "@/components/layout/DevToolsGuard";
import { SpeedInsights } from "@vercel/speed-insights/next"
import NextTopLoader from "nextjs-toploader";
import Script from "next/script";

// SurfBoard brand font, self-hosted so the strict CSP only needs font-src 'self'.
// One variable file covers every weight; next/font hashes the URL, so a font change can never be served stale.
const brandFont = localFont({
  src: "./fonts/OverusedGrotesk-VF.woff2",
  weight: "300 900",
  display: "swap",
  variable: "--font-brand-face",
  adjustFontFallback: "Arial",
});

// Code font, only for the character counters on forms, so it is not preloaded.
const codeFont = localFont({
  src: "./fonts/GeistMono-VF.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-code-face",
  preload: false,
});

// 2. Update the SEO metadata for EvenTime (With OpenGraph & Twitter tags)
export const metadata: Metadata = {
  title: "EvenTime | Discover Tech, Startup & Career Events",
  description: "India's cleanest directory for hackathons, startup meetups, professional workshops, technical events and many more.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.webp",
    apple: "/icon-192.webp",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EvenTime",
  },
  openGraph: {
    title: "EvenTime | Discover Tech, Startup & Career Events",
    description: "India's cleanest directory for hackathons, startup meetups, professional workshops, technical events and many more.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://eventime.thesurfboard.in",
    siteName: "EvenTime",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://eventime.thesurfboard.in"}/api/og`,
        width: 1200,
        height: 630,
        alt: "EvenTime — Discover Tech, Startup & Career Events",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EvenTime | Discover Tech, Startup & Career Events",
    description: "India's cleanest directory for hackathons, startup meetups, professional workshops, technical events and many more.",
    images: [`${process.env.NEXT_PUBLIC_APP_URL || "https://eventime.thesurfboard.in"}/api/og`],
  },
  verification: {
    google: "M2Cu6l_l0OOEs5qm6PRROSH2Pm5QGRlDj-RNYaRUKDM",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      // Expose the font variables on <html> so the Tailwind v4 theme tokens can use them
      className={cn("h-full antialiased scroll-smooth", brandFont.variable, codeFont.variable)}
      data-scroll-behavior="smooth"
    >
      <head>
        {/* LIGHTSPEED OPTIMIZATION: Preconnect to the R2 image CDN */}
        <link rel="preconnect" href="https://cdn.sbhub.in" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.sbhub.in" />
        
        {/* Microsoft Clarity */}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="microsoft-clarity" strategy="lazyOnload">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `}
          </Script>
        )}

        {/* Google Analytics GA4 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="lazyOnload" />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "EvenTime",
              url: process.env.NEXT_PUBLIC_APP_URL || "https://eventime.thesurfboard.in",
              logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://eventime.thesurfboard.in"}/logo1.webp`,
              sameAs: [],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "EvenTime",
              url: process.env.NEXT_PUBLIC_APP_URL || "https://eventime.thesurfboard.in",
              potentialAction: {
                "@type": "SearchAction",
                target: `${process.env.NEXT_PUBLIC_APP_URL || "https://eventime.thesurfboard.in"}/?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans pb-20 sm:pb-0">
        <NextTopLoader 
          color="#6C47FF"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #6C47FF,0 0 5px #6C47FF"
        />
        <LaunchScreen /> {/* Added LaunchScreen component here */}
        
        <AuthProvider>
          <DevToolsGuard />
          <PostHogProvider>
            {/* Wrap children in a flex-1 container to push the footer to the bottom of the page */}
            <div className="flex-1 w-full flex flex-col">
              {children}
            </div>
            
            <Footer /> {/* Render the Footer globally */}
          </PostHogProvider>
        </AuthProvider>
        
        <Toaster richColors position="top-right" closeButton />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}