import type { AppLocale } from "@/i18n/config";
import { PLAN_MONTHLY_USD } from "@/lib/planPricing";
import { PLAN_LIMITS } from "@/lib/planLimits";
/** Prix public futur affiché (ancrage) — Stripe reste à PLAN_MONTHLY_USD.pro. */
export const LAUNCH_ANCHOR_USD = {
  pro: 12,
  studio: 32,
  plus: 59,
} as const;

/** Bonus crédits offerts (copy + future webhook — pas de changement prix Stripe). */
export const LAUNCH_BONUS_CREDITS = {
  proFirstMonth: 20,
  checkoutRecovery: 5,
} as const;

/** Fin de la fenêtre « tarif lancement » (affichage urgence). */
export const LAUNCH_OFFER_END_ISO = "2026-07-31T23:59:59Z";

export type LaunchOfferCopy = {
  badge: string;
  headline: string;
  subline: string;
  founderLock: string;
  bonusLine: string;
  urgencyLine: string;
  ctaHint: string;
};

function daysUntilLaunchEnd(now = Date.now()): number {
  const end = new Date(LAUNCH_OFFER_END_ISO).getTime();
  return Math.max(0, Math.ceil((end - now) / (24 * 60 * 60 * 1000)));
}

export function isLaunchOfferActive(now = Date.now()): boolean {
  return now < new Date(LAUNCH_OFFER_END_ISO).getTime();
}

export function getLaunchOfferCopy(locale: AppLocale): LaunchOfferCopy {
  const isFr = locale === "fr";
  const proNow = PLAN_MONTHLY_USD.pro;
  const proFuture = LAUNCH_ANCHOR_USD.pro;
  const bonus = LAUNCH_BONUS_CREDITS.proFirstMonth;
  const days = daysUntilLaunchEnd();

  if (isFr) {
    return {
      badge: "Tarif lancement",
      headline: `Pro à ${proNow} $/mois — prix fondateur verrouillé`,
      subline: `Prix public prévu : ${proFuture} $/mois pour les nouveaux inscrits.`,
      founderLock: "Abonne-toi maintenant → ton tarif reste à 8 $ tant que tu restes abonné.",
      bonusLine: `+${bonus} générations bonus offertes le 1er mois Pro`,
      urgencyLine: days > 0 ? `Fenêtre lancement : encore ${days} jour${days > 1 ? "s" : ""}` : "Dernières heures tarif lancement",
      ctaHint: "Annulable à tout moment · Stripe sécurisé",
    };
  }

  return {
    badge: "Launch pricing",
    headline: `Pro at $${proNow}/mo — founder rate locked in`,
    subline: `Public price planned: $${proFuture}/mo for new signups later.`,
    founderLock: "Subscribe now → your rate stays $8 as long as you stay subscribed.",
    bonusLine: `+${bonus} bonus generations on your first Pro month`,
    urgencyLine: days > 0 ? `Launch window: ${days} day${days > 1 ? "s" : ""} left` : "Final hours — launch pricing",
    ctaHint: "Cancel anytime · Secure Stripe checkout",
  };
}

export type LaunchOfferMicro = {
  locked: string;
  bonus: string;
  future: string;
  urgency: string;
};

export function getLaunchOfferMicro(locale: AppLocale): LaunchOfferMicro {
  const isFr = locale === "fr";
  const bonus = LAUNCH_BONUS_CREDITS.proFirstMonth;
  const days = daysUntilLaunchEnd();
  return {
    locked: isFr ? "8 $ verrouillés" : "$8 locked",
    bonus: isFr ? `+${bonus} gen` : `+${bonus} tracks`,
    future: isFr ? "12 $ bientôt" : "$12 soon",
    urgency: days > 0 ? (isFr ? `${days}j` : `${days}d`) : isFr ? "24h" : "24h",
  };
}

export function launchPerTrackUsd(): number {
  return PLAN_MONTHLY_USD.pro / PLAN_LIMITS.pro;
}

export function launchPriceAnchor(
  tier: keyof typeof PLAN_MONTHLY_USD,
): { current: number; anchor: number } {
  return {
    current: PLAN_MONTHLY_USD[tier],
    anchor: LAUNCH_ANCHOR_USD[tier],
  };
}
