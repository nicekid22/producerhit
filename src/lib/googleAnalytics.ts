/** ID de mesure GA4 (ProducerHit). Surcharge possible via VITE_GA_MEASUREMENT_ID sur Vercel. */
export const GA_MEASUREMENT_ID =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() || "G-GF8RTQ0E5J";

/** Snippet gtag pour pages HTML statiques (SEO prerender bots). */
export function googleAnalyticsHeadSnippet(measurementId = GA_MEASUREMENT_ID): string {
  const id = measurementId.replace(/'/g, "");
  return `<!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}', { send_page_view: false });
  </script>`;
}

export function isGa4ScriptPresent(measurementId = GA_MEASUREMENT_ID): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.querySelector(`script[src*="gtag/js?id=${measurementId}"]`));
}
