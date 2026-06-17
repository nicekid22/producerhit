import type { AppLocale } from "@/i18n/config";

import { launchPriceAnchor, isLaunchOfferActive } from "@/lib/launchOffer";

import type { PlanTier } from "@/lib/billing";

import { PLAN_BILLING_CURRENCY } from "@/lib/planPricing";

import { cn } from "@/lib/utils";



type Props = {

  tier: PlanTier;

  locale: AppLocale;

  size?: "sm" | "md" | "lg" | "hero";

  className?: string;

  showPerMonth?: boolean;

  showSavings?: boolean;

  align?: "left" | "right" | "center";

  /** card = même typo que Studio/Plus · hero = bannière / paywall */

  variant?: "card" | "hero";

};



export function LaunchPriceDisplay({

  tier,

  locale,

  size = "md",

  className,

  showPerMonth = true,

  showSavings = false,

  align = "left",

  variant = "card",

}: Props) {

  if (tier === "free") return null;



  const anchor = launchPriceAnchor(tier);

  const isFr = locale === "fr";

  const isHero = size === "hero" || variant === "hero";

  const launchActive = isLaunchOfferActive() && tier === "pro";

  const savings = anchor.anchor - anchor.current;



  if (!launchActive) {

    return (

      <div className={cn("flex items-end gap-1.5", className)}>

        <span className="pk-pricing-tier__price text-[2rem] font-bold leading-none tracking-tight text-white sm:text-[2.15rem]">

          ${anchor.current}

        </span>

        {showPerMonth ? (

          <span className="pb-1 text-xs font-medium text-white/40">

            /{isFr ? "mois" : "mo"} · {PLAN_BILLING_CURRENCY}

          </span>

        ) : null}

      </div>

    );

  }



  return (

    <div

      className={cn(

        "pk-launch-price",

        isHero && "pk-launch-price--hero",

        size === "lg" && "pk-launch-price--lg",

        size === "sm" && "pk-launch-price--sm",

        align === "center" && "pk-launch-price--center",

        align === "left" && "pk-launch-price--left",

        variant === "card" && "pk-launch-price--card",

        className,

      )}

    >

      <div className="pk-launch-price__row pk-launch-price__row--card">

        <span className="pk-launch-price__anchor-card" aria-label={isFr ? "Prix habituel 12 dollars" : "Regular price 12 dollars"}>

          ${anchor.anchor}

        </span>

        <span className="pk-pricing-tier__price pk-launch-price__amount-card">

          ${anchor.current}

        </span>

        {showPerMonth ? (

          <span className="pk-launch-price__period-card">

            /{isFr ? "mois" : "mo"} · {PLAN_BILLING_CURRENCY}

          </span>

        ) : null}

        {showSavings && savings > 0 ? (

          <span className="pk-launch-price__save-note">

            {isFr ? `−${savings} $/mois` : `−$${savings}/mo`}

          </span>

        ) : null}

      </div>

    </div>

  );

}

