import { getAttributionProps } from "@/lib/attribution";
import { getOrCreateSessionId } from "@/lib/sessionId";
import { supabase } from "@/lib/supabaseClient";

type ConversionPayload = {
  event_name: string;
  event_id: string;
  props?: Record<string, unknown>;
  page_url?: string;
  user_agent?: string;
};

let pending: ConversionPayload[] = [];
let flushTimer: number | null = null;

async function postConversion(body: ConversionPayload) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!supabaseUrl || !anonKey) return;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token ?? anonKey;

  await fetch(`${supabaseUrl}/functions/v1/track-conversion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
    body: JSON.stringify({
      ...body,
      session_id: getOrCreateSessionId(),
      attribution: getAttributionProps(),
    }),
  }).catch(() => undefined);
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
