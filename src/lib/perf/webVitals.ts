import { onCLS, onINP, onLCP, type Metric } from "web-vitals";

const SAMPLE_RATE = 0.1;

function shouldSample(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const key = "pk_web_vitals_sample";
    const stored = window.sessionStorage.getItem(key);
    if (stored === "1") return true;
    if (stored === "0") return false;
    const hit = Math.random() < SAMPLE_RATE;
    window.sessionStorage.setItem(key, hit ? "1" : "0");
    return hit;
  } catch {
    return Math.random() < SAMPLE_RATE;
  }
}

function sendToGa4(metric: Metric): void {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", metric.name, {
    value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    event_category: "Web Vitals",
    event_label: metric.id,
    non_interaction: true,
  });
}

/** RUM Core Web Vitals → GA4 (échantillon 10 %). */
export function initWebVitalsReporting(): void {
  if (typeof window === "undefined" || !shouldSample()) return;
  onCLS(sendToGa4);
  onINP(sendToGa4);
  onLCP(sendToGa4);
}
