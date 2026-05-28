import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { captureAttributionFromUrl } from "@/lib/attribution";
import { flushEventQueue, trackClientEvent } from "@/lib/supabaseClient";

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

function loadGa4(id: string) {
  if (typeof window === "undefined") return;
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

/** Captures UTM/ref on every navigation + optional GA4 page views. */
export function GrowthBootstrap() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    captureAttributionFromUrl(search, pathname);
    trackClientEvent("page_view", { page: pathname });
  }, [pathname, search]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void flushEventQueue();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!GA_ID) return;
    loadGa4(GA_ID);
  }, []);

  useEffect(() => {
    if (!GA_ID) return;
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    w.gtag?.("event", "page_view", { page_path: pathname + search, page_title: document.title });
  }, [pathname, search]);

  return null;
}
