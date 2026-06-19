import { Sparkles } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import type { PaidPlan } from "@/lib/billing";
import { planPriceLabel } from "@/lib/planPricing";
import { isLaunchOfferActive } from "@/lib/launchOffer";

type Props = {
  locale: AppLocale;
  plan: PaidPlan;
};

export function AuthCheckoutIntentBanner({ locale, plan }: Props) {
  const isFr = locale === "fr";
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const price = planPriceLabel(plan, locale, { suffix: true });
  const launch = isLaunchOfferActive() && plan === "pro";

  return (
    <div className="mb-4 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-white">
            {isFr ? `Finalise ${planLabel} après connexion` : `Finish ${planLabel} after sign-in`}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/60">
            {launch
              ? isFr
                ? `Pro lancement ${price} · checkout Stripe juste après login`
                : `Launch Pro ${price} · Stripe checkout right after login`
              : isFr
                ? `${planLabel} ${price} · paiement sécurisé Stripe après connexion`
                : `${planLabel} ${price} · secure Stripe checkout after login`}
          </p>
        </div>
      </div>
    </div>
  );
}
