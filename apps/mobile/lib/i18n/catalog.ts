import type { AppLocale } from "@producerhit/shared";
import type { IapPaidPlan } from "@/lib/iapCatalog";
import { MOBILE_MESSAGES } from "./messages.generated";

export type I18nKey = keyof typeof MOBILE_MESSAGES;

export type { AppLocale };

export function t(locale: AppLocale, key: I18nKey): string {
  const table = MOBILE_MESSAGES[key];
  if (!table) return String(key);
  return table[locale] ?? table.en ?? String(key);
}

export function tf(locale: AppLocale, key: I18nKey, vars: Record<string, string | number>): string {
  let out = t(locale, key);
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(`{${k}}`, String(v)).replace(`\${${k}}`, String(v));
  }
  return out;
}

const PAYWALL_TIER_LABEL: Record<IapPaidPlan, I18nKey> = {
  pro: "paywallTierPro",
  studio: "paywallTierStudio",
  plus: "paywallTierPlus",
};

const PAYWALL_TIER_FEATURES: Record<IapPaidPlan, readonly I18nKey[]> = {
  pro: ["paywallProFeature1", "paywallProFeature2", "paywallProFeature3"],
  studio: ["paywallStudioFeature1", "paywallStudioFeature2", "paywallStudioFeature3", "paywallStudioFeature4"],
  plus: ["paywallPlusFeature1", "paywallPlusFeature2", "paywallPlusFeature3", "paywallPlusFeature4"],
};

export function paywallTierLabel(locale: AppLocale, plan: IapPaidPlan): string {
  return t(locale, PAYWALL_TIER_LABEL[plan]);
}

export function paywallTierFeatures(locale: AppLocale, plan: IapPaidPlan): string[] {
  return PAYWALL_TIER_FEATURES[plan].map((key) => t(locale, key));
}

/** @deprecated Use paywallTierFeatures(locale, 'pro') */
export function paywallFeatures(locale: AppLocale): string[] {
  return paywallTierFeatures(locale, "pro");
}

export function jobStatusLabelI18n(locale: AppLocale, status: string, isSong = false): string {
  switch (status) {
    case "pending":
      return t(locale, "statusQueued");
    case "running":
      return isSong ? t(locale, "statusWritingVocals") : t(locale, "statusComposing");
    case "completed":
      return t(locale, "statusReady");
    case "failed":
      return t(locale, "statusFailed");
    default:
      return isSong ? t(locale, "composingSong") : t(locale, "generatingBeat");
  }
}

export function onboardingSlides(locale: AppLocale) {
  return [
    {
      id: "welcome" as const,
      title: t(locale, "onb1Title"),
      body: t(locale, "onb1Body"),
    },
    {
      id: "beats" as const,
      title: t(locale, "onb2Title"),
      body: t(locale, "onb2Body"),
    },
    {
      id: "sync" as const,
      title: t(locale, "onb3Title"),
      body: t(locale, "onb3Body"),
    },
    {
      id: "personalize" as const,
      title: t(locale, "onb4Title"),
      body: t(locale, "onb4Body"),
    },
  ];
}

export const ACTIVATION_STEP_KEYS = [
  "checkTour",
  "checkFirstGen",
  "checkLibrary",
  "checkCommunity",
  "checkReferral",
] as const satisfies readonly I18nKey[];

export const ACTIVATION_STEP_IDS = [
  "tour_done",
  "first_beat",
  "library_visit",
  "community_visit",
  "referral_share",
] as const;

export type ActivationStepId = (typeof ACTIVATION_STEP_IDS)[number];
