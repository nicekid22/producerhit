import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureAttributionFromUrl } from "@/lib/attribution";
import { GA_MEASUREMENT_ID, isGa4ScriptPresent } from "@/lib/googleAnalytics";
import { scheduleThirdPartyAnalytics } from "@/lib/deferredAnalytics";
import { deferUntilIdle } from "@/lib/perf/defer";
import { initWebVitalsReporting } from "@/lib/perf/webVitals";
import { flushEventQueue, trackClientEvent } from "@/lib/supabaseClient";
import { trackLandingView } from "@/lib/growthFunnelEvents";

function loadGa4(id: string) {
  if (typeof window === "undefined") return;
  if (isGa4ScriptPresent(id)) return;
  if (document.getElementById("pk-ga4")) return;

  const s1 = document.createElement("script");
  s1.id = "pk-ga4";
  s1.async = true;
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s1);

  const s2 = document.createElement("script");
  s2.text = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id.replace(/'/g, "")}', { send_page_view: false });
  `;
  document.head.appendChild(s2);
}

/** Captures UTM/ref on every navigation + GA4 page views (SPA). */
export function GrowthBootstrap() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    captureAttributionFromUrl(search, pathname);
    trackClientEvent("page_view", { page: pathname });
    if (pathname === "/") {
      trackLandingView({ via: "router" });
    }
  }, [pathname, search]);

  useEffect(() => {
    const flushIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      void flushEventQueue();
    };
    flushIfVisible();
    const timer = window.setInterval(flushIfVisible, 180_000);
    document.addEventListener("visibilitychange", flushIfVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", flushIfVisible);
    };
  }, []);

  useEffect(() => {
    deferUntilIdle(() => {
      scheduleThirdPartyAnalytics();
      if (!GA_MEASUREMENT_ID) return;
      loadGa4(GA_MEASUREMENT_ID);
      initWebVitalsReporting();
    });
  }, []);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    w.gtag?.("event", "page_view", { page_path: pathname + search, page_title: document.title });
  }, [pathname, search]);

  return null;
}
