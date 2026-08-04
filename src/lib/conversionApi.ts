import { getAttributionProps } from "@/lib/attribution";
import { getOrCreateSessionId } from "@/lib/sessionId";

type ConversionPayload = {
  event_name: string;
  event_id: string;
  props?: Record<string, unknown>;
  page_url?: string;
  user_agent?: string;
};

let pending: ConversionPayload[] = [];
let flushTimer: number | null = null;

/**
 * Server-side conversion tracking (Meta CAPI + TikTok Events API).
 * TODO: migrate to Firebase Cloud Function once track-conversion is ported.
 * Currently disabled — Supabase Edge Function is down after Firebase migration.
 * Client-side pixel tracking (mirrorEventToAdPixels) still works.
 */
async function postConversion(_body: ConversionPayload) {
  // No-op until track-conversion is migrated to Firebase Cloud Functions
}

function scheduleFlush() {
  if (typeof window === "undefined") return;
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    const batch = pending.splice(0, 4);
    for (const item of batch) {
      void postConversion(item);
    }
  }, 800);
}

/** Envoie l'événement vers Meta CAPI + TikTok Events API (Edge, dédupliqué via event_id). */
export function sendServerConversion(eventName: string, eventId: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  pending.push({
    event_name: eventName,
    event_id: eventId,
    props: props ?? {},
    page_url: window.location.href,
    user_agent: navigator.userAgent,
  });
  if (pending.length > 12) pending = pending.slice(-12);
  scheduleFlush();
}
