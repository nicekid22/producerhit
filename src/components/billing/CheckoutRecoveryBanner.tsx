import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { AppLocale } from "@/i18n/config";
import { runCheckoutWithAuth, type PaidPlan } from "@/lib/billing";
import { clearCheckoutAbandoned, readCheckoutAbandoned } from "@/lib/checkoutRecovery";
import { getCheckoutRecoveryCopy } from "@/lib/launchOffer";
import { trackClientEvent } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  location: string;
  className?: string;
  /** Masquer si l'utilisateur est déjà sur ce plan ou supérieur */
  currentPlan?: string;
};

function isPaidPlan(value: string | undefined): value is PaidPlan {
  return value === "pro" || value === "studio" || value === "plus";
}

export function CheckoutRecoveryBanner({ locale, location, className, currentPlan }: Props) {
  const copy = getCheckoutRecoveryCopy(locale);
  const abandoned = useMemo(() => readCheckoutAbandoned(), []);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  const plan = abandoned?.plan;
  const show =
    !dismissed &&
    isPaidPlan(plan) &&
    (!currentPlan || currentPlan === "free" || currentPlan === plan);

  const resume = useCallback(async () => {
    if (!isPaidPlan(plan)) return;
    trackClientEvent("checkout_resume_click", { plan, location });
    setLoading(true);
    try {
      await runCheckoutWithAuth({ plan, location, locale });
    } finally {
      setLoading(false);
    }
  }, [locale, location, plan]);

  if (!show) return null;

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <p className="text-sm font-semibold text-white">
          {copy.titlePrefix} {planLabel}
        </p>
        <p className="mt-0.5 text-xs text-white/60">{copy.body}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void resume()}
          className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {loading ? copy.loading : copy.resume}
        </button>
        <button
          type="button"
          onClick={() => {
            clearCheckoutAbandoned();
            setDismissed(true);
            toast.success(copy.dismissToast);
          }}
          className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
        >
          {copy.later}
        </button>
      </div>
    </div>
  );
}
