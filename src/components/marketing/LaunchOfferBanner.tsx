import { Sparkles } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import {
  getLaunchOfferCopy,
  getLaunchOfferCtaButton,
  isLaunchOfferActive,
} from "@/lib/launchOffer";
import { LaunchOfferChips } from "@/components/marketing/LaunchOfferChips";
import { LaunchPriceDisplay } from "@/components/marketing/LaunchPriceDisplay";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  variant?: "banner" | "inline";
  className?: string;
  /** Primary CTA — e.g. direct Pro checkout */
  showCta?: boolean;
  ctaLoading?: boolean;
  onCtaClick?: () => void;
};

export function LaunchOfferBanner({
  locale,
  variant = "banner",
  className,
  showCta = false,
  ctaLoading = false,
  onCtaClick,
}: Props) {
  if (!isLaunchOfferActive()) return null;

  const copy = getLaunchOfferCopy(locale);
  const ctaLabel = getLaunchOfferCtaButton(locale);

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
          {showCta && onCtaClick ? (
            <div className="mt-4 flex flex-col items-center gap-1.5 sm:items-start">
              <button
                type="button"
                disabled={ctaLoading}
                onClick={onCtaClick}
                className="pk-launch-offer__cta inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition hover:brightness-110 disabled:opacity-60"
              >
                {ctaLoading ? "…" : ctaLabel}
              </button>
              <p className="text-[11px] text-white/45">{copy.ctaHint}</p>
            </div>
          ) : null}
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
