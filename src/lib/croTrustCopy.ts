import type { AppLocale } from "@/i18n/config";
import { getMessages, interpolate } from "@/i18n";
import { PLAN_LIMITS } from "@/lib/planLimits";
import { planPriceLabel } from "@/lib/planPricing";

export type CroTrustItem = {
  id: string;
  label: string;
};

export function croTrustBarItems(locale: AppLocale): CroTrustItem[] {
  const { cro } = getMessages(locale);
  return [
    { id: "no-card", label: cro.trustNoCard },
    { id: "free", label: interpolate(cro.trustFreeMonth, { count: PLAN_LIMITS.free }) },
    { id: "stripe", label: cro.trustStripe },
    { id: "cancel", label: cro.trustCancel },
  ];
}

/** Hero landing — 3 bénéfices free cohérents (pas Stripe / annulation). */
export function croLandingTrustBarItems(locale: AppLocale): CroTrustItem[] {
  const { cro } = getMessages(locale);
  return [
    { id: "no-card", label: cro.trustLandingStart },
    { id: "studio", label: cro.trustLandingStudio },
    { id: "mp3", label: cro.trustLandingMp3 },
  ];
}

export function croAuthHeadline(locale: AppLocale, mode: "login" | "signup"): string {
  const { cro } = getMessages(locale);
  if (mode === "login") return cro.authLoginHeadline;
  return interpolate(cro.authSignupHeadline, { count: PLAN_LIMITS.free });
}

export function croPricingHero(locale: AppLocale): { eyebrow: string; title: string; lead: string } {
  const { cro } = getMessages(locale);
  const proPrice = planPriceLabel("pro", locale, { suffix: true });
  return {
    eyebrow: cro.pricingHeroEyebrow,
    title: cro.pricingHeroTitle,
    lead: interpolate(cro.pricingHeroLead, { count: PLAN_LIMITS.free, proPrice }),
  };
}

export function croPricingTeaser(locale: AppLocale): { eyebrow: string; title: string; lead: string } {
  const { cro } = getMessages(locale);
  return {
    eyebrow: cro.pricingTeaserEyebrow,
    title: cro.pricingTeaserTitle,
    lead: interpolate(cro.pricingTeaserLead, { count: PLAN_LIMITS.free }),
  };
}

export function croStickyCta(locale: AppLocale): { title: string; sub: string; button: string } {
  const { cro } = getMessages(locale);
  return { title: cro.stickyTitle, sub: cro.stickySub, button: cro.stickyButton };
}

export function croLandingFaqs(locale: AppLocale): { q: string; a: string }[] {
  const { cro } = getMessages(locale);
  return [
    { q: cro.faqSpeedQ, a: cro.faqSpeedA },
    {
      q: cro.faqCardQ,
      a: interpolate(cro.faqCardA, { count: PLAN_LIMITS.free }),
    },
  ];
}
