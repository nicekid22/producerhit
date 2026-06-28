import type { PlanTier } from "@/lib/billing";
import type { AppLocale } from "@/i18n/config";
import { PLAN_LIMITS } from "@/lib/planLimits";
import {
  LOOP_AUDIO_RETENTION_DAYS_FREE,
  LOOP_AUDIO_RETENTION_DAYS_PRO,
  LOOP_AUDIO_RETENTION_DAYS_STUDIO,
  hostedAudioRetentionDaysLabel,
  hostedAudioRetentionSummary,
  plusPermanentAudioBenefit,
} from "@/lib/loopAudioRetention";
import { planPriceLabel } from "@/lib/planPricing";
import {
  buildPricingPageSection,
  formatGenPerMonth,
  pricingFaqsFromCatalog,
  PRICING_CATALOG,
} from "@/i18n/pricingCatalog";
import { pickL } from "@/i18n/localized";

export type PricingPlanContent = {
  tier: PlanTier;
  name: string;
  tagline: string;
  price: string;
  highlights: string[];
};

export type PricingCompareCell = boolean | string;

export type PricingCompareRow = {
  label: string;
  free: PricingCompareCell;
  pro: PricingCompareCell;
  studio: PricingCompareCell;
  plus: PricingCompareCell;
};

export function getPricingPlans(locale: AppLocale): PricingPlanContent[] {
  const s = buildPricingPageSection(locale);
  const gen = (n: number) => formatGenPerMonth(locale, n);

  return [
    {
      tier: "free",
      name: "Free",
      tagline: s.freeTagline,
      price: planPriceLabel("free"),
      highlights: [
        gen(PLAN_LIMITS.free),
        s.mp3Personal,
        s.cloudLibrary,
        hostedAudioRetentionDaysLabel(locale, "free"),
        s.noCommercial,
      ],
    },
    {
      tier: "pro",
      name: "Pro",
      tagline: s.proTagline,
      price: planPriceLabel("pro"),
      highlights: [
        gen(PLAN_LIMITS.pro),
        s.wavSpotify,
        s.commercialIncluded,
        s.proMasteringPreview,
        s.modesAll,
        s.cloudPublicLinks,
      ],
    },
    {
      tier: "studio",
      name: "Studio",
      tagline: s.studioTagline,
      price: planPriceLabel("studio"),
      highlights: [
        gen(PLAN_LIMITS.studio),
        s.allProMastering,
        s.parallelVersions,
        hostedAudioRetentionDaysLabel(locale, "studio"),
        s.verticalVideo,
        s.releasesClients,
        locale === "fr"
          ? "Pack distribution + Academy (valeur 497 $)"
          : "Distribution pack + Academy ($497 value)",
      ],
    },
    {
      tier: "plus",
      name: "Plus",
      tagline: s.plusTagline,
      price: planPriceLabel("plus"),
      highlights: [
        gen(PLAN_LIMITS.plus),
        plusPermanentAudioBenefit(locale),
        s.priorityQueue,
        s.stemsZip,
        s.allStudio,
        locale === "fr"
          ? "Pack distribution + Academy (valeur 497 $)"
          : "Distribution pack + Academy ($497 value)",
      ],
    },
  ];
}

export function getPricingCompareRows(locale: AppLocale): PricingCompareRow[] {
  const s = buildPricingPageSection(locale);
  const day = pickL(PRICING_CATALOG.daySuffix, locale);
  const yes = true;
  const no = false;

  return [
    {
      label: s.compareGenMonth,
      free: String(PLAN_LIMITS.free),
      pro: String(PLAN_LIMITS.pro),
      studio: String(PLAN_LIMITS.studio),
      plus: String(PLAN_LIMITS.plus),
    },
    { label: s.compareCommercial, free: no, pro: yes, studio: yes, plus: yes },
    { label: "MP3", free: yes, pro: yes, studio: yes, plus: yes },
    { label: "WAV", free: no, pro: yes, studio: yes, plus: yes },
    { label: s.compareModes, free: yes, pro: yes, studio: yes, plus: yes },
    { label: s.compareParallel, free: no, pro: no, studio: yes, plus: yes },
    {
      label: s.compareMastering,
      free: s.preview,
      pro: no,
      studio: yes,
      plus: yes,
    },
    { label: s.compareStems, free: no, pro: no, studio: no, plus: yes },
    {
      label: locale === "fr" ? "Pack distribution + Academy" : "Distribution pack + Academy",
      free: no,
      pro: no,
      studio: "2/mo",
      plus: "5/mo",
    },
    {
      label: s.comparePriority,
      free: no,
      pro: yes,
      studio: yes,
      plus: s.max,
    },
    {
      label: s.compareHosted,
      free: `${LOOP_AUDIO_RETENTION_DAYS_FREE}${day}`,
      pro: `${LOOP_AUDIO_RETENTION_DAYS_PRO}${day}`,
      studio: `${LOOP_AUDIO_RETENTION_DAYS_STUDIO}${day}`,
      plus: s.permanent,
    },
  ];
}

export function getPricingFaqs(locale: AppLocale) {
  return pricingFaqsFromCatalog(locale, hostedAudioRetentionSummary(locale));
}
