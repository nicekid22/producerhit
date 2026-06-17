import { Link } from "react-router-dom";
import { Check, Shield, Sparkles, Zap } from "lucide-react";
import { isRecommendedPlan, pricingCtaHref, pricingCtaMeta, type PlanTier } from "@/lib/billing";
import { getPricingPlans } from "@/lib/pricingContent";
import { PricingPlanButton } from "@/components/pricing/PricingPlanButton";
import { PLAN_MONTHLY_USD, planPriceLabel } from "@/lib/planPricing";
import { PLAN_LIMITS } from "@/lib/planLimits";
import { croPricingTeaser } from "@/lib/croTrustCopy";
import { cn } from "@/lib/utils";

import type { AppLocale } from "@/i18n/config";
type Props = {
  locale: AppLocale;
  user: boolean;
  currentPlan: string;
};

const TEASER_TIERS: PlanTier[] = ["pro", "free"];

function perGenerationHint(locale: AppLocale): string {
  const per = PLAN_MONTHLY_USD.pro / PLAN_LIMITS.pro;
  return locale === "fr"
    ? `≈ $${per.toFixed(2)} / génération — moins qu’un café`
    : `≈ $${per.toFixed(2)} per track — less than a coffee`;
}

export function LandingPricingTeaser({ locale, user, currentPlan }: Props) {
  const isFr = locale === "fr";
  const teaser = croPricingTeaser(locale);
  const plans = getPricingPlans(locale).filter((p) => TEASER_TIERS.includes(p.tier));
  const trustPills = isFr
    ? ["Sans engagement", "Annulable à tout moment", "Paiement sécurisé"]
    : ["No commitment", "Cancel anytime", "Secure checkout"];

  return (
    <section id="pricing" className="pk-landing-pricing-teaser" aria-labelledby="pk-landing-pricing-title">
      <div className="pk-landing-section-head text-center">
        <p className="pk-landing-section-head__eyebrow mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
          {teaser.eyebrow}
        </p>
        <h2 id="pk-landing-pricing-title" className="pk-landing-section-head__title">
          <span className="pk-prism-holo-text">{teaser.title}</span>
        </h2>
        <p className="pk-landing-section-head__lead mx-auto mt-3 max-w-lg">
          {teaser.lead}
        </p>

        <div className="pk-landing-pricing-teaser__trust mt-5">
          {trustPills.map((pill) => (
            <span key={pill} className="pk-landing-pricing-teaser__trust-pill">
              <Shield className="h-3 w-3 opacity-70" aria-hidden />
              {pill}
            </span>
          ))}
        </div>
      </div>

      <div className="pk-landing-pricing-teaser__grid mt-8 grid gap-4 sm:mt-10 md:grid-cols-2">
        {plans.map((p) => {
          const isPro = p.tier === "pro";
          const recommended = isRecommendedPlan(p.tier, currentPlan);
          const cta = pricingCtaMeta(p.tier, currentPlan, locale, { isLoggedIn: user });
          const ctaHref = pricingCtaHref(p.tier, currentPlan, user);
          const isCurrent = cta.kind === "current";

          return (
            <article
              key={p.tier}
              className={cn(
                "pk-landing-pricing-teaser__card pk-pricing-tier pk-prism-card relative flex h-full flex-col p-6 sm:p-7",
                isPro ? "pk-landing-pricing-teaser__card--pro" : "pk-landing-pricing-teaser__card--free",
                recommended && "pk-landing-pricing-teaser__card--featured pk-pricing-tier--featured",
                isCurrent && "pk-pricing-tier--current",
              )}
            >
              {isPro ? <div className="pk-landing-pricing-teaser__glow" aria-hidden /> : null}

              <div className="pk-pricing-tier__ribbon relative mb-1 min-h-[1.625rem] shrink-0 w-full">
                {isPro ? (
                  <div className="pk-pricing-tier__badge absolute left-1/2 top-0 flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    {isFr ? "Le plus populaire" : "Most popular"}
                  </div>
                ) : recommended ? (
                  <div className="pk-pricing-tier__badge absolute left-1/2 top-0 flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    {isFr ? "Recommandé" : "Recommended"}
                  </div>
                ) : null}
                {isCurrent ? (
                  <span className="pk-pricing-tier__active absolute right-0 top-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                    {isFr ? "Actuel" : "Current"}
                  </span>
                ) : null}
              </div>

              <div className="relative z-[1] flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <p className="mt-1 text-xs text-white/50">{p.tagline}</p>
                  {isPro ? (
                    <p className="pk-landing-pricing-teaser__value">{perGenerationHint(locale)}</p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className={cn(
                      "pk-landing-pricing-teaser__price font-extrabold tracking-tight text-white",
                      !isPro && "text-2xl",
                    )}
                  >
                    {p.price}
                  </div>
                  {p.tier !== "free" ? (
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
                      /{isFr ? "mois" : "mo"}
                    </div>
                  ) : null}
                </div>
              </div>

              {isPro ? (
                <p className="relative z-[1] mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold leading-snug text-white/72">
                  <Zap className="mr-1 inline h-3.5 w-3.5 text-[var(--prism-cyan)]" aria-hidden />
                  {isFr
                    ? "WAV + droits commerciaux — prêt à sortir sur Spotify & YouTube."
                    : "WAV + commercial rights — ready for Spotify & YouTube."}
                </p>
              ) : null}

              <ul className="pk-landing-pricing-teaser__features relative z-[1] flex-1 space-y-2.5">
                {p.highlights.slice(0, isPro ? 5 : 4).map((line) => (
                  <li key={line} className="pk-landing-pricing-teaser__feature">
                    <Check className="pk-landing-pricing-teaser__feature-icon h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="pk-landing-pricing-teaser__cta-wrap relative z-[1]">
                <PricingPlanButton tier={p.tier} cta={cta} to={ctaHref} />
              </div>
            </article>
          );
        })}
      </div>

      <p className="pk-landing-pricing-teaser__footnote mt-8 text-center text-sm text-white/50">
        {isFr ? "Studio & Plus pour volume, stems et audio permanent — " : "Studio & Plus for volume, stems & permanent audio — "}
        <Link to="/pricing" className="font-semibold text-[var(--prism-cyan)] hover:text-white">
          {isFr
            ? `voir tous les plans (${planPriceLabel("studio", "fr", { suffix: true })}+)`
            : `compare all plans (${planPriceLabel("studio", "en", { suffix: true })}+)`}
        </Link>
      </p>
    </section>
  );
}
