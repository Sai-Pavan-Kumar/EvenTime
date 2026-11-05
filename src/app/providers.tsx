"use client";

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

// Long enough for a slow phone to finish starting the page, so analytics never compete with the first tap.
const POSTHOG_DELAY_MS = 5000;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  // PostHog is ~80 KB gzipped. On a one-bar network that alone delays the first screen,
  // so it is fetched only once the browser is idle, after the page is already usable.
  useEffect(() => {
    // The session recorder is another ~68 KB. On 2G/3G or Data Saver that bandwidth belongs to the page.
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
    const isSlowNetwork = Boolean(connection?.saveData) || ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "");

    const initPostHog = () => {
      import("posthog-js").then(({ default: posthog }) => {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
          api_host: "/ingest",
          ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
          person_profiles: "identified_only", // don't create profiles for anonymous guests until they sign in — keeps free tier usage lower
          capture_pageview: false,
          disable_session_recording: isSlowNetwork,
          // Not used, and it downloads its own script on every visit.
          disable_surveys: true,
        });
      });
    };
    let idleId: number | undefined;
    const timeoutId = setTimeout(() => {
      if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(initPostHog, { timeout: 5000 });
      else initPostHog();
    }, POSTHOG_DELAY_MS);
    return () => {
      clearTimeout(timeoutId);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
    };
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <RouteProgressBar />
      </Suspense>
      {children}
    </>
  );
}