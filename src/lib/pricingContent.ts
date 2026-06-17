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
import { COMMERCIAL_RIGHTS_FAQ, planPriceLabel } from "@/lib/planPricing";

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
  const isFr = locale === "fr";
  const gen = (n: number) =>
    isFr ? `${n} générations / mois` : `${n} generations / month`;

  return [
    {
      tier: "free",
      name: "Free",
      tagline: isFr ? "Découvrir le studio" : "Explore the studio",
      price: planPriceLabel("free"),
      highlights: [
        gen(PLAN_LIMITS.free),
        isFr ? "Export MP3 — usage personnel" : "MP3 export — personal use",
        isFr ? "Bibliothèque cloud + player" : "Cloud library + player",
        hostedAudioRetentionDaysLabel(locale, "free"),
        isFr ? "Pas de droits commerciaux" : "No commercial rights",
      ],
    },
    {
      tier: "pro",
      name: "Pro",
      tagline: isFr ? "Sortir et monétiser" : "Release and monetize",
      price: planPriceLabel("pro"),
      highlights: [
        gen(PLAN_LIMITS.pro),
        isFr ? "Export WAV + MP3 Spotify Ready" : "WAV + MP3 Spotify Ready",
        isFr ? "Droits commerciaux inclus" : "Commercial rights included",
        hostedAudioRetentionDaysLabel(locale, "pro"),
        isFr ? "Song, Type Beat & Remix" : "Song, Type Beat & Remix",
        isFr ? "Bibliothèque cloud + liens publics" : "Cloud library + public links",
      ],
    },
    {
      tier: "studio",
      name: "Studio",
      tagline: isFr ? "Production intensive" : "Heavy production",
      price: planPriceLabel("studio"),
      highlights: [
        gen(PLAN_LIMITS.studio),
        isFr ? "Tout Pro + mastering complet" : "Everything in Pro + full mastering",
        isFr ? "Versions ×2 en parallèle" : "Parallel ×2 versions",
        hostedAudioRetentionDaysLabel(locale, "studio"),
        isFr ? "Export vidéo vertical" : "Vertical video export",
        isFr ? "Idéal releases & clients" : "Built for releases & clients",
      ],
    },
    {
      tier: "plus",
      name: "Plus",
      tagline: isFr ? "Volume & stems pro" : "Volume & pro stems",
      price: planPriceLabel("plus"),
      highlights: [
        gen(PLAN_LIMITS.plus),
        plusPermanentAudioBenefit(locale),
        isFr ? "File prioritaire — génération rapide" : "Priority queue — faster generation",
        isFr ? "Stems séparés ZIP (ACE)" : "Separate stems ZIP (ACE)",
        isFr ? "Tout Studio inclus" : "Everything in Studio",
      ],
    },
  ];
}

export function getPricingCompareRows(locale: AppLocale): PricingCompareRow[] {
  const isFr = locale === "fr";
  const yes = true;
  const no = false;

  return [
    {
      label: isFr ? "Générations / mois" : "Generations / month",
      free: String(PLAN_LIMITS.free),
      pro: String(PLAN_LIMITS.pro),
      studio: String(PLAN_LIMITS.studio),
      plus: String(PLAN_LIMITS.plus),
    },
    {
      label: isFr ? "Droits commerciaux" : "Commercial rights",
      free: no,
      pro: yes,
      studio: yes,
      plus: yes,
    },
    {
      label: "MP3",
      free: yes,
      pro: yes,
      studio: yes,
      plus: yes,
    },
    {
      label: "WAV",
      free: no,
      pro: yes,
      studio: yes,
      plus: yes,
    },
    {
      label: isFr ? "Song + Beat + Remix" : "Song + Beat + Remix",
      free: yes,
      pro: yes,
      studio: yes,
      plus: yes,
    },
    {
      label: isFr ? "Versions ×2 parallèles" : "Parallel ×2 versions",
      free: no,
      pro: no,
      studio: yes,
      plus: yes,
    },
    {
      label: isFr ? "Mastering Studio" : "Mastering Studio",
      free: isFr ? "Preview" : "Preview",
      pro: no,
      studio: yes,
      plus: yes,
    },
    {
      label: isFr ? "Stems ZIP" : "Stems ZIP",
      free: no,
      pro: no,
      studio: no,
      plus: yes,
    },
    {
      label: isFr ? "Priorité génération" : "Generation priority",
      free: no,
      pro: no,
      studio: no,
      plus: yes,
    },
    {
      label: isFr ? "Audio hébergé" : "Hosted audio",
      free: `${LOOP_AUDIO_RETENTION_DAYS_FREE}${isFr ? " j" : "d"}`,
      pro: `${LOOP_AUDIO_RETENTION_DAYS_PRO}${isFr ? " j" : "d"}`,
      studio: `${LOOP_AUDIO_RETENTION_DAYS_STUDIO}${isFr ? " j" : "d"}`,
      plus: isFr ? "Permanent" : "Permanent",
    },
  ];
}

export function getPricingFaqs(locale: AppLocale) {
  const isFr = locale === "fr";
  return [
    COMMERCIAL_RIGHTS_FAQ[isFr ? "fr" : "en"],
    {
      q: isFr ? "Quand mes crédits sont-ils activés ?" : "When are credits activated?",
      a: isFr
        ? "Immédiatement après paiement Stripe. Plan et quota mis à jour en quelques secondes."
        : "Immediately after Stripe payment. Plan and quota update within seconds.",
    },
    {
      q: isFr ? "Passer à un plan supérieur ?" : "Upgrade to a higher plan?",
      a: isFr
        ? "Un clic sur « Passer Pro / Studio / Plus » — paiement Stripe sécurisé, crédits activés immédiatement, facturation au prorata. Annulation possible à tout moment depuis Paramètres."
        : "One click on « Upgrade to Pro / Studio / Plus » — secure Stripe checkout, credits unlock instantly, prorated billing. Cancel anytime from Settings.",
    },
    {
      q: isFr ? "Export stems (Plus)" : "Stems export (Plus)",
      a: isFr
        ? "Archive ZIP des pistes séparées quand ACE les fournit — bouton Stems dans ta bibliothèque."
        : "Separate tracks ZIP when ACE provides them — Stems button in your library.",
    },
    {
      q: isFr ? "Les liens audio expirent-ils ?" : "Do hosted audio links expire?",
      a: hostedAudioRetentionSummary(isFr ? "fr" : "en"),
    },
  ];
}
