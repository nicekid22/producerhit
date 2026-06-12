import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { isRecommendedPlan, pricingCtaHref, pricingCtaMeta, type PlanTier } from "@/lib/billing";
import { getPricingPlans } from "@/lib/pricingContent";
import { PricingPlanButton } from "@/components/pricing/PricingPlanButton";
import { planPriceLabel } from "@/lib/planPricing";
import { PLAN_LIMITS } from "@/lib/planLimits";

type Props = {
  locale: "en" | "fr";
  user: boolean;
  currentPlan: string;
};

const TEASER_TIERS: PlanTier[] = ["free", "pro"];

export function LandingPricingTeaser({ locale, user, currentPlan }: Props) {
  const isFr = locale === "fr";
  const plans = getPricingPlans(locale).filter((p) => TEASER_TIERS.includes(p.tier));

  return (
    <section id="pricing" className="pk-landing-pricing-teaser" aria-labelledby="pk-landing-pricing-title">
      <div className="pk-landing-section-head text-center">
        <h2 id="pk-landing-pricing-title" className="pk-landing-section-head__title">
          <span className="pk-prism-holo-text">{isFr ? "Commence free. Passe Pro quand tu veux." : "Start free. Go Pro when you’re ready."}</span>
        </h2>
        <p className="pk-landing-section-head__lead mx-auto mt-3 max-w-lg">
          {isFr
            ? `${PLAN_LIMITS.free} générations offertes chaque mois. Upgrade en un clic — pas de piège.`
            : `${PLAN_LIMITS.free} free generations every month. Upgrade in one click — no tricks.`}
        </p>
      </div>

      <div className="pk-landing-pricing-teaser__grid mt-8 grid gap-4 sm:mt-10 md:grid-cols-2">
        {plans.map((p) => {
          const recommended = isRecommendedPlan(p.tier, currentPlan);
          const cta = pricingCtaMeta(p.tier, currentPlan, locale, { isLoggedIn: user });
          const ctaHref = pricingCtaHref(p.tier, currentPlan, user);

          return (
            <article
              key={p.tier}
              className={[
                "pk-landing-pricing-teaser__card pk-prism-card relative flex h-full flex-col p-6 sm:p-7",
                recommended ? "pk-landing-pricing-teaser__card--featured" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="pk-pricing-tier__ribbon relative mb-1 min-h-[1.625rem] shrink-0 w-full">
                {recommended ? (
                  <div className="pk-pricing-tier__badge absolute left-1/2 top-0 flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    {isFr ? "Recommandé" : "Recommended"}
                  </div>
                ) : null}
              </div>

              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <p className="mt-1 text-xs text-white/48">{p.tagline}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold tracking-tight text-white">{p.price}</div>
                  {p.tier !== "free" ? (
                    <div className="text-[10px] font-medium text-white/40">/{isFr ? "mois" : "mo"}</div>
                  ) : null}
                </div>
              </div>

              <ul className="mt-5 flex-1 space-y-2.5 border-t border-white/[0.07] pt-5">
                {p.highlights.slice(0, 4).map((line) => (
                  <li key={line} className="text-[13px] leading-snug text-white/62">
                    {line}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <PricingPlanButton tier={p.tier} cta={cta} to={ctaHref} />
              </div>
            </article>
          );
        })}
      </div>

      <p className="pk-landing-pricing-teaser__footnote mt-6 text-center text-sm text-white/45">
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
