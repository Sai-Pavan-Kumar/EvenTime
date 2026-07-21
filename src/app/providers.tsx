"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

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

function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url += `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

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
      <PostHogPageview />
      <RouteProgressBar />
      {children}
    </PHProvider>
  );
}