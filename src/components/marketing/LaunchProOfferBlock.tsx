import type { AppLocale } from "@/i18n/config";

import { isLaunchOfferActive } from "@/lib/launchOffer";

import { PLAN_MONTHLY_USD } from "@/lib/planPricing";

import { PLAN_LIMITS } from "@/lib/planLimits";

import { LaunchOfferChips } from "@/components/marketing/LaunchOfferChips";

import { LaunchPriceDisplay } from "@/components/marketing/LaunchPriceDisplay";

import { cn } from "@/lib/utils";



type Props = {

  locale: AppLocale;

  size?: "md" | "lg" | "hero";

  align?: "left" | "center" | "right";

  className?: string;

  showPerTrack?: boolean;

};



function perTrackHint(locale: AppLocale): string {

  const per = PLAN_MONTHLY_USD.pro / PLAN_LIMITS.pro;

  return locale === "fr" ? `≈ $${per.toFixed(2)} / track` : `≈ $${per.toFixed(2)} / track`;

}



export function LaunchProOfferBlock({

  locale,

  size = "lg",

  align = "left",

  className,

  showPerTrack = true,

}: Props) {

  if (!isLaunchOfferActive()) return null;



  return (

    <div className={cn("pk-launch-pro-block", className)}>

      <LaunchPriceDisplay

        tier="pro"

        locale={locale}

        size={size}

        align={align}

        showPerMonth

        variant="card"

      />

      <LaunchOfferChips locale={locale} className="mt-2.5" />

      {showPerTrack ? (

        <p className="pk-launch-pro-block__per-track">{perTrackHint(locale)}</p>

      ) : null}

    </div>

  );

}

