import { getAttributionProps } from "@/lib/attribution";
import { getOrCreateSessionId } from "@/lib/sessionId";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";

export type CaptureLeadResult = { ok: boolean; error?: string };

export async function captureMarketingLead(args: {
  email: string;
  locale: string;
  source?: string;
}): Promise<CaptureLeadResult> {
  const email = args.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "invalid_email" };
  }

  const attribution = getAttributionProps();
  try {
    const { data, error } = await supabase.rpc("capture_marketing_lead", {
      p_email: email,
      p_locale: args.locale,
      p_source: args.source ?? "landing",
      p_session_id: getOrCreateSessionId(),
      p_utm_source: attribution.utm_source ?? null,
      p_utm_medium: attribution.utm_medium ?? null,
      p_utm_campaign: attribution.utm_campaign ?? null,
      p_utm_content: attribution.utm_content ?? null,
    });
    if (error) return { ok: false, error: error.message };
    const row = data as { ok?: boolean; error?: string } | null;
    if (!row?.ok) return { ok: false, error: row?.error ?? "failed" };

    trackClientEvent("email_capture", { source: args.source ?? "landing", email_domain: email.split("@")[1] ?? "" });
    return { ok: true };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function syncUserAttributionToServer(): Promise<boolean> {
  const attribution = getAttributionProps();
  if (!Object.keys(attribution).length) return false;
  try {
    const { data, error } = await supabase.rpc("sync_user_attribution", {
      p_attribution: { ...attribution, synced_at: new Date().toISOString() },
    });
    if (error) return false;
    return Boolean((data as { ok?: boolean } | null)?.ok);
  } catch {
    return false;
  }
}
