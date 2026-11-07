"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINK_HOVER = "transition-colors hover:text-brand-soft";
const SCROLL_JITTER_PX = 4;
const NAV_HIDDEN_CLASS = "footer-nav-hidden";

const PAGE_LINKS = [
  { href: "/about", label: "About" },
  { href: "/cities", label: "Cities" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
  </svg>
);

const SOCIAL_LINKS = [
  { href: "https://www.instagram.com/the_surfboard", label: "EvenTime on Instagram", Icon: InstagramIcon },
  { href: "https://www.youtube.com/@the_surfboard?sub_confirmation=1", label: "EvenTime on YouTube", Icon: YoutubeIcon },
];

// Waits for a downward scroll instead of hiding on sight: on a short page the footer is
// visible at load, and the navbar must not vanish before the visitor has done anything.
function useHideNavAtFooter(footerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    const root = document.documentElement;
    let footerVisible = false;
    let scrollingDown = false;
    let lastScrollY = window.scrollY;
    const syncNav = () => root.classList.toggle(NAV_HIDDEN_CLASS, footerVisible && scrollingDown);

    // A jump to the bottom fires the scroll before the observer, so both have to re-check.
    const observer = new IntersectionObserver(([entry]) => {
      footerVisible = entry.isIntersecting;
      syncNav();
    });
    observer.observe(footer);

    const handleScroll = () => {
      const delta = window.scrollY - lastScrollY;
      if (Math.abs(delta) < SCROLL_JITTER_PX) return;
      lastScrollY = window.scrollY;
      scrollingDown = delta > 0;
      syncNav();
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      root.classList.remove(NAV_HIDDEN_CLASS);
    };
  }, [footerRef]);
}

export function Footer() {
  const pathname = usePathname();
  const isSearchPage = pathname === "/search";
  const footerRef = useRef<HTMLElement>(null);
  const [creditsOpen, setCreditsOpen] = useState(false);
  useHideNavAtFooter(footerRef);

  return (
    <footer
      ref={footerRef}
      // The negative margin cancels the body padding kept for the phone tab bar, which would otherwise show as a white strip here.
      className={`site-footer mt-auto -mb-20 sm:mb-0 w-full bg-brand-ink text-surface-card flex flex-col items-center gap-3 text-center pt-[clamp(32px,4vw,56px)] pb-[clamp(24px,2.5vw,32px)] ${isSearchPage ? "hidden sm:flex" : ""}`}
    >
      <div className="footer-wordmark" aria-hidden="true">EvenTime</div>

      <p className="px-4 text-lg sm:text-xl font-bold">The directory for events.</p>

      <nav aria-label="Footer" className="px-4 flex flex-wrap justify-center gap-x-6">
        {PAGE_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className={`min-h-11 inline-flex items-center text-base font-medium ${LINK_HOVER}`}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-4 flex flex-wrap items-center justify-center gap-x-3 text-sm">
        <span>© {new Date().getFullYear()} EvenTime</span>
        <button
          type="button"
          aria-expanded={creditsOpen}
          aria-controls="footer-credits"
          onClick={() => setCreditsOpen((open) => !open)}
          className={`min-h-11 cursor-pointer ${LINK_HOVER}`}
        >
          Credits
        </button>
        {SOCIAL_LINKS.map(({ href, label, Icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="w-11 h-11 rounded-full inline-flex items-center justify-center transition-colors hover:bg-brand-deep"
          >
            <Icon />
          </a>
        ))}
        {creditsOpen && (
          <p id="footer-credits" className="basis-full">
            Weather data:{" "}
            <a href="https://api.met.no/doc/License" target="_blank" rel="noopener noreferrer" className={`font-bold ${LINK_HOVER}`}>
              MET Norway, CC BY 4.0
            </a>
          </p>
        )}
      </div>

      <p className="whitespace-nowrap text-[clamp(14px,4.4vw,24px)]">
        Made by{" "}
        <a href="https://thesurfboard.in" className={`font-bold ${LINK_HOVER}`}>The SurfBoard</a>
        . Built for humans.
      </p>
    </footer>
  );
}
