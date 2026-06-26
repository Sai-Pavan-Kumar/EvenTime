import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import LaunchScreen from "@/components/layout/LaunchScreen";
import { Footer } from "@/components/layout/Footer";
import NextTopLoader from "nextjs-toploader";

// 1. Load Outfit font for your headings
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

// 2. Update the SEO metadata for EvenTime (With OpenGraph & Twitter tags)
export const metadata: Metadata = {
  title: "EvenTime | Discover Tech, Startup & Career Events",
  description: "India's cleanest directory for hackathons, startup meetups, professional workshops, technical events and many more.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EvenTime",
  },
  openGraph: {
    title: "EvenTime | Discover Tech, Startup & Career Events",
    description: "India's cleanest directory for hackathons, startup meetups, professional workshops, technical events and many more.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://et.sbhub.in",
    siteName: "EvenTime",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://et.sbhub.in"}/api/og?title=Discover%20Tech%20%26%20Startup%20Events&category=EvenTime`,
        width: 1200,
        height: 630,
        alt: "EvenTime Platform",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
   twitter: {
    card: "summary_large_image",
    title: "EvenTime | Discover Tech, Startup & Career Events",
    description: "India's cleanest directory for hackathons, startup meetups, professional workshops, technical events and many more.",
  },
  verification: {
    google: "hx3YHWYDGc-OJVUDE7Ck0bEuk-ZcYeybIQkjqq1OIxI",
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
      // 3. Inject the Outfit variable into the HTML so Tailwind v4 can use it
      className={cn("h-full antialiased scroll-smooth", outfit.variable)}
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Forcing the browser to load Switzer directly */}
        <link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap" rel="stylesheet" />
        {/* LIGHTSPEED OPTIMIZATION: Preconnect to R2 CDN & preload hero image */}
        <link rel="preconnect" href="https://cdn.sbhub.in" crossOrigin="anonymous" />
        <link rel="preload" href="/hero-section-v2.png" as="image" />
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
        
        {/* Wrap children in a flex-1 container to push the footer to the bottom of the page */}        <div className="flex-1 w-full flex flex-col">
          {children}
        </div>
        
        <Footer /> {/* Render the Footer globally */}
        
        <Toaster />
      </body>
    </html>
  );
}