"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
// PostHog $pageview auto-fire DISABLED — was generating ~9M billed events/month at 2M scale.
// To track a user action, call posthog.capture('event_name') explicitly at the call-site only.

function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Any link click anywhere in the app starts the bar instantly
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || link.target === "_blank") return;
      NProgress.start();
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Once the new page's content is actually here, stop the bar
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}

// PostHogPageview removed — firing $pageview on every navigation was billing ₹1.5 lakh/month at 2M users.

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: "/ingest",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: "identified_only", // don't create profiles for anonymous guests until they sign in — keeps free tier usage lower
      capture_pageview: false, // we manually track pageviews below (needed for Next.js App Router client-side navigation)
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <RouteProgressBar />
      </Suspense>
      {children}
    </PHProvider>
  );
}