import { Link } from "react-router-dom";

import { useCallback, useState } from "react";

import { Check, Sparkles } from "lucide-react";

import { LandingSectionHead } from "@/components/landing/LandingSectionHead";

import {

  isRecommendedPlan,

  pricingCtaHref,

  pricingCtaMeta,

  runCheckoutWithAuth,

  type PaidPlan,

  type PlanTier,

} from "@/lib/billing";

import { getPricingPlans } from "@/lib/pricingContent";

import { PricingPlanButton } from "@/components/pricing/PricingPlanButton";

import { croPricingTeaser } from "@/lib/croTrustCopy";

import { useT } from "@/i18n";

import { LaunchPriceDisplay } from "@/components/marketing/LaunchPriceDisplay";

import { isLaunchOfferActive } from "@/lib/launchOffer";

import { trackClientEvent } from "@/lib/supabaseClient";

import { cn } from "@/lib/utils";



import type { AppLocale } from "@/i18n/config";

type Props = {

  locale: AppLocale;

  user: boolean;

  currentPlan: string;

};



const TEASER_TIERS: PlanTier[] = ["pro", "free"];



export function LandingPricingTeaser({ locale, user, currentPlan }: Props) {

  const { m } = useT();

  const teaser = croPricingTeaser(locale);

  const launchActive = isLaunchOfferActive();

  const plans = getPricingPlans(locale).filter((p) => TEASER_TIERS.includes(p.tier));

  const [loadingTier, setLoadingTier] = useState<PaidPlan | null>(null);



  const handlePlanAction = useCallback(

    async (tier: PlanTier) => {

      const meta = pricingCtaMeta(tier, currentPlan, locale, { isLoggedIn: user });

      if (meta.disabled || meta.kind !== "upgrade") {

        if (meta.kind === "start_free") {

          window.location.href = user ? "/dashboard" : "/auth";

        }

        return;

      }



      trackClientEvent("pricing_cta_click", {

        tier,

        kind: meta.kind,

        current_plan: currentPlan,

        location: "landing_pricing_teaser",

      });



      const paid = tier as PaidPlan;

      setLoadingTier(paid);

      try {

        await runCheckoutWithAuth({ plan: paid, location: "landing_pricing_teaser", locale });

      } finally {

        setLoadingTier(null);

      }

    },

    [currentPlan, locale, user],

  );



  return (

    <section id="pricing" className="pk-landing-pricing-teaser" aria-labelledby="pk-landing-pricing-title">

      <LandingSectionHead

        id="pk-landing-pricing-title"

        eyebrow={teaser.eyebrow}

        title={teaser.title}

        lead={teaser.lead}

      />



      <div className="pk-landing-pricing-teaser__grid mt-10 grid gap-5 md:grid-cols-2 sm:mt-12">

        {plans.map((p) => {

          const isPro = p.tier === "pro";

          const recommended = isRecommendedPlan(p.tier, currentPlan);

          const cta = pricingCtaMeta(p.tier, currentPlan, locale, { isLoggedIn: user });

          const ctaHref = pricingCtaHref(p.tier, currentPlan, user);

          const isCurrent = cta.kind === "current";

          const isUpgrade = cta.kind === "upgrade";

          const busy = loadingTier === p.tier;



          return (

            <article

              key={p.tier}

              className={cn(

                "pk-landing-pricing-teaser__card pk-pricing-tier pk-prism-card relative flex h-full flex-col p-6 sm:p-7",

                isPro ? "pk-landing-pricing-teaser__card--pro" : "pk-landing-pricing-teaser__card--free",

                isPro && launchActive && "pk-landing-pricing-teaser__card--launch",

                recommended && "pk-landing-pricing-teaser__card--featured pk-pricing-tier--featured",

                isCurrent && "pk-pricing-tier--current",

              )}

            >

              <div className="pk-pricing-tier__ribbon relative mb-2 min-h-[1.625rem] shrink-0 w-full">

                {isPro ? (

                  <div className="pk-pricing-tier__badge pk-landing-pricing-teaser__launch-badge absolute left-1/2 top-0 flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">

                    <Sparkles className="h-3 w-3" aria-hidden />

                    {launchActive ? m.cro.pricingTeaserLaunchBadge : m.cro.pricingTeaserPopular}

                  </div>

                ) : null}

                {isCurrent ? (

                  <span className="pk-pricing-tier__active absolute right-0 top-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">

                    {m.cro.pricingTeaserCurrent}

                  </span>

                ) : null}

              </div>



              <div className="relative z-[1] flex flex-col gap-4">

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <h3 className="text-xl font-bold tracking-tight text-white">{p.name}</h3>

                    <p className="mt-1 text-xs text-white/48">{p.tagline}</p>

                  </div>

                  {isPro ? (

                    <LaunchPriceDisplay tier="pro" locale={locale} size="lg" variant="card" showPerMonth />

                  ) : (

                    <div className="pk-landing-pricing-teaser__price-free text-2xl font-extrabold tabular-nums text-white">

                      {p.price}

                    </div>

                  )}

                </div>



              </div>



              <ul className="pk-landing-pricing-teaser__features relative z-[1] flex-1 space-y-2">

                {p.highlights.slice(0, isPro ? 4 : 3).map((line) => (

                  <li key={line} className="pk-landing-pricing-teaser__feature">

                    <Check className="pk-landing-pricing-teaser__feature-icon h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />

                    <span>{line}</span>

                  </li>

                ))}

              </ul>



              <div className="pk-landing-pricing-teaser__cta-wrap relative z-[1]">

                <PricingPlanButton

                  tier={p.tier}

                  cta={cta}

                  busy={busy}

                  to={isUpgrade ? undefined : ctaHref}

                  onClick={isUpgrade ? () => void handlePlanAction(p.tier) : undefined}

                />

              </div>



            </article>

          );

        })}

      </div>



      <p className="pk-landing-pricing-teaser__footnote mt-10 text-center text-xs text-white/42">

        {m.cro.pricingTeaserStudioPlus}

        <Link to="/pricing" className="font-semibold text-[var(--prism-cyan)] hover:text-white">

          {m.cro.pricingTeaserAllPlans}

        </Link>

      </p>

    </section>

  );

}

