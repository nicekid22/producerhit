import { trackClientEvent } from "@/lib/supabaseClient";

const SESSION_FLAGS_KEY = "producerhit_funnel_once_v1";

function readFlags(): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(SESSION_FLAGS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

function writeFlags(flags: Set<string>) {
  try {
    window.sessionStorage.setItem(SESSION_FLAGS_KEY, JSON.stringify([...flags]));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Fire a funnel event at most once per browser tab session. */
export function trackFunnelOnce(name: string, props?: Record<string, unknown>) {
  const flags = readFlags();
  if (flags.has(name)) return;
  flags.add(name);
  writeFlags(flags);
  trackClientEvent(name, props);
}

export function trackLandingView(props?: Record<string, unknown>) {
  trackFunnelOnce("landing_view", props);
}

export function trackDashboardReady(props?: Record<string, unknown>) {
  trackFunnelOnce("dashboard_ready", props);
}

export function trackFirstAudioPlay(props?: Record<string, unknown>) {
  trackFunnelOnce("first_audio_play", props);
}
