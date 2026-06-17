import { getAttribution, type Attribution } from "@/lib/attribution";
import { buildGrowthUrl, type GrowthChannel } from "@/lib/growthLinks";

export type CampaignPreset =
  | "launch"
  | "signup"
  | "pricing"
  | "referral_invite"
  | "viral_loop"
  | "newsletter"
  | "retargeting";

const CAMPAIGN_PRESETS: Record<CampaignPreset, { campaign: string; content?: string }> = {
  launch: { campaign: "launch_2026" },
  signup: { campaign: "signup" },
  pricing: { campaign: "pricing_teaser" },
  referral_invite: { campaign: "invite" },
  viral_loop: { campaign: "public_track" },
  newsletter: { campaign: "newsletter_capture" },
  retargeting: { campaign: "retarget_warm" },
};

/** URL growth avec preset campagne + attribution courante optionnelle. */
export function buildCampaignUrl(
  path: string,
  channel: GrowthChannel,
  preset: CampaignPreset,
  opts?: { ref?: string; content?: string },
): string {
  const p = CAMPAIGN_PRESETS[preset];
  return buildGrowthUrl(path, channel, {
    campaign: p.campaign,
    content: opts?.content ?? p.content,
    ref: opts?.ref,
  });
}

/** Ajoute les UTMs first-touch à une URL existante (sans écraser les params déjà présents). */
export function appendAttributionToUrl(rawUrl: string, attribution = getAttribution()): string {
  if (!attribution) return rawUrl;
  try {
    const url = new URL(rawUrl, typeof window !== "undefined" ? window.location.origin : "https://www.producerhit.com");
    const keys: (keyof Attribution)[] = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "ref",
      "gclid",
      "fbclid",
    ];
    for (const key of keys) {
      const val = attribution[key];
      if (typeof val === "string" && val && !url.searchParams.has(key)) {
        url.searchParams.set(key, val);
      }
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

export function attributionSummary(attribution = getAttribution()): string {
  if (!attribution) return "direct";
  const parts = [
    attribution.utm_source,
    attribution.utm_medium,
    attribution.utm_campaign,
  ].filter(Boolean);
  return parts.length ? parts.join(" / ") : attribution.ref ? `ref:${attribution.ref}` : "direct";
}
