import type { AppLocale } from "@/i18n/config";
import { PLAN_LIMITS } from "@/lib/planLimits";
import { planPriceLabel } from "@/lib/planPricing";

export type CroTrustItem = {
  id: string;
  label: string;
};

export function croTrustBarItems(locale: AppLocale): CroTrustItem[] {
  const isFr = locale === "fr";
  if (isFr) {
    return [
      { id: "no-card", label: "Sans carte bancaire" },
      { id: "free", label: `${PLAN_LIMITS.free} générations / mois` },
      { id: "stripe", label: "Paiement Stripe sécurisé" },
      { id: "cancel", label: "Annulable à tout moment" },
    ];
  }
  return [
    { id: "no-card", label: "No credit card required" },
    { id: "free", label: `${PLAN_LIMITS.free} free tracks / month` },
    { id: "stripe", label: "Secure Stripe checkout" },
    { id: "cancel", label: "Cancel anytime" },
  ];
}

export function croAuthHeadline(locale: AppLocale, mode: "login" | "signup"): string {
  const isFr = locale === "fr";
  if (mode === "login") {
    return isFr ? "Bon retour — ton studio t'attend." : "Welcome back — your studio is ready.";
  }
  return isFr
    ? `Crée ton compte — ${PLAN_LIMITS.free} générations gratuites ce mois-ci.`
    : `Create your account — ${PLAN_LIMITS.free} free generations this month.`;
}

export function croPricingHero(locale: AppLocale): { eyebrow: string; title: string; lead: string } {
  const isFr = locale === "fr";
  const proPrice = planPriceLabel("pro", isFr ? "fr" : "en", { suffix: true });
  if (isFr) {
    return {
      eyebrow: "Tarifs transparents",
      title: "Commence free. Monétise dès Pro.",
      lead: `${PLAN_LIMITS.free} générations offertes chaque mois — upgrade en un clic (${proPrice}) pour WAV, droits commerciaux et export Spotify Ready.`,
    };
  }
  return {
    eyebrow: "Transparent pricing",
    title: "Start free. Earn on Pro.",
    lead: `${PLAN_LIMITS.free} free generations every month — upgrade in one click (${proPrice}) for WAV, commercial rights, and Spotify Ready exports.`,
  };
}

export function croPricingTeaser(locale: AppLocale): { eyebrow: string; title: string; lead: string } {
  const isFr = locale === "fr";
  if (isFr) {
    return {
      eyebrow: "Zero risque",
      title: "Free pour tester. Pro pour sortir.",
      lead: `${PLAN_LIMITS.free} générations gratuites chaque mois — pas de piège, pas de carte pour commencer.`,
    };
  }
  return {
    eyebrow: "Zero risk",
    title: "Free to test. Pro to release.",
    lead: `${PLAN_LIMITS.free} free generations every month — no tricks, no card to start.`,
  };
}

export function croStickyCta(locale: AppLocale): { title: string; sub: string; button: string } {
  const isFr = locale === "fr";
  return isFr
    ? { title: "Ta prochaine track t'attend", sub: "Gratuit · sans carte · 60 s", button: "Créer free" }
    : { title: "Your next track is waiting", sub: "Free · no card · ~60 sec", button: "Start free" };
}

export function croLandingFaqs(locale: AppLocale): { q: string; a: string }[] {
  const isFr = locale === "fr";
  if (isFr) {
    return [
      {
        q: "Combien de temps pour la première génération ?",
        a: "La plupart des morceaux sont prêts en 20 à 60 secondes selon le mode (Song, Type Beat ou Remix).",
      },
      {
        q: "Dois-je entrer une carte bancaire ?",
        a: `Non — le plan Free (${PLAN_LIMITS.free} générations/mois) ne demande aucune carte. Tu upgrades seulement si tu veux WAV ou droits commerciaux.`,
      },
    ];
  }
  return [
    {
      q: "How fast is the first generation?",
      a: "Most tracks are ready in 20–60 seconds depending on mode (Song, Type Beat, or Remix).",
    },
    {
      q: "Do I need a credit card?",
      a: `No — the Free plan (${PLAN_LIMITS.free} generations/month) requires no card. Upgrade only when you want WAV or commercial rights.`,
    },
  ];
}
