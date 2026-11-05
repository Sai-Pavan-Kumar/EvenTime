// Sentry for the browser, loaded lazily on purpose.
// @sentry/nextjs is ~170 KB gzipped on the client, mostly replay and feedback code we never use.
// webpackExports keeps only what is named here; every other import of this package must name its
// exports too, or webpack keeps the whole thing again. It also competed with the first screen, so it is fetched
// once the page is idle. Tradeoff: an error in the first ~2 seconds of a visit is not reported.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

const SENTRY_DSN =
  "https://406d5a849bdd607eabf555d6a1759de3@o4511663740747776.ingest.us.sentry.io/4511663740944384";

function initSentry() {
  import(/* webpackExports: ["init"] */ "@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      enableLogs: true,
      // DPDP/GDPR: IPs and request bodies stay out of Sentry.
      sendDefaultPii: false,
    });
  });
}

if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(initSentry, { timeout: 5000 });
  } else {
    setTimeout(initSentry, 3000);
  }
}
