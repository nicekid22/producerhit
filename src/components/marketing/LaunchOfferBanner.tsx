import { Sparkles } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { getLaunchOfferCopy, isLaunchOfferActive } from "@/lib/launchOffer";
import { LaunchOfferChips } from "@/components/marketing/LaunchOfferChips";
import { LaunchPriceDisplay } from "@/components/marketing/LaunchPriceDisplay";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  variant?: "banner" | "inline";
  className?: string;
};

export function LaunchOfferBanner({ locale, variant = "banner", className }: Props) {
  if (!isLaunchOfferActive()) return null;

  const copy = getLaunchOfferCopy(locale);

  if (variant === "inline") {
    return (
      <span className={cn("pk-launch-offer-inline", className)}>
        <Sparkles className="h-3 w-3" aria-hidden />
        {copy.badge}
      </span>
    );
  }

  return (
    <div className={cn("pk-launch-offer pk-launch-offer--banner", className)}>
      <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div className="min-w-0 flex-1">
          <span className="pk-launch-offer__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {copy.badge}
          </span>
          <h2 className="pk-launch-offer__headline">{copy.headline}</h2>
          <LaunchOfferChips locale={locale} className="mt-2.5 text-left sm:max-w-xl" compact />
        </div>
        <LaunchPriceDisplay
          tier="pro"
          locale={locale}
          size="hero"
          variant="hero"
          align="center"
          className="shrink-0"
        />
      </div>
    </div>
  );
}
