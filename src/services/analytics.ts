// Lightweight GA4 (gtag) wrapper. Fully env-gated: if VITE_GA_MEASUREMENT_ID
// is not set, every function is a no-op so nothing breaks in dev or when the
// site is deployed without analytics configured.

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

export const analyticsEnabled = Boolean(GA_ID);

type GtagArgs = [string, ...unknown[]];
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

let initialized = false;

/** Injects the GA4 script once. Safe to call multiple times. */
export function initAnalytics() {
  if (!GA_ID || initialized || typeof document === 'undefined') return;
  initialized = true;

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: GtagArgs) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  // We send page_view manually on route changes (SPA), so disable the automatic one.
  window.gtag('config', GA_ID, { send_page_view: false });
}

/** Fires a GA4 event. No-op when analytics is not configured. */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', event, params);
}

/** Sends a manual SPA page_view. */
export function trackPageView(path: string) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', { page_path: path, page_location: window.location.href });
}
