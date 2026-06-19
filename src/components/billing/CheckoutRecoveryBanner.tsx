import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { AppLocale } from "@/i18n/config";
import { runCheckoutWithAuth, type PaidPlan } from "@/lib/billing";
import { clearCheckoutAbandoned, readCheckoutAbandoned, syncCheckoutAbandonNurture } from "@/lib/checkoutRecovery";
import { captureMarketingLead } from "@/lib/emailCapture";
import { getCheckoutRecoveryCopy } from "@/lib/launchOffer";
import { trackClientEvent } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
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
  const user = useAuthStore((s) => s.user);
  const abandoned = useMemo(() => readCheckoutAbandoned(), []);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailDone, setEmailDone] = useState(false);

  const plan = abandoned?.plan;
  const show =
    !dismissed &&
    isPaidPlan(plan) &&
    (!currentPlan || currentPlan === "free" || currentPlan === plan);

  useEffect(() => {
    if (!show || !isPaidPlan(plan)) return;
    if (user) {
      syncCheckoutAbandonNurture(plan, locale, location);
    }
  }, [locale, location, plan, show, user]);

  const captureEmail = useCallback(
    async (source: "inline" | "dismiss") => {
      if (!isPaidPlan(plan)) return false;
      const trimmed = email.trim();
      if (!trimmed) return false;
      setEmailLoading(true);
      const result = await captureMarketingLead({
        email: trimmed,
        locale,
        source: "checkout_abandon",
        props: {
          abandoned_plan: plan,
          abandoned_at: new Date().toISOString(),
          abandon_location: location,
          capture_surface: source,
        },
      });
      setEmailLoading(false);
      if (!result.ok) {
        toast.error(locale === "fr" ? "Email invalide ou erreur." : "Invalid email or error.");
        return false;
      }
      setEmailDone(true);
      trackClientEvent("checkout_abandon_email_capture", { plan, location, source });
      toast.success(
        locale === "fr" ? "On t'envoie un rappel avec le bonus 🔥" : "We'll send a reminder with your bonus 🔥",
      );
      return true;
    },
    [email, locale, location, plan],
  );

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

  const dismiss = useCallback(async () => {
    if (email.trim() && !emailDone) {
      await captureEmail("dismiss");
    }
    clearCheckoutAbandoned();
    setDismissed(true);
    toast.success(copy.dismissToast);
  }, [captureEmail, copy.dismissToast, email, emailDone]);

  if (!show) return null;

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const showEmailCapture = !user && !emailDone;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            onClick={() => void dismiss()}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
          >
            {copy.later}
          </button>
        </div>
      </div>

      {showEmailCapture ? (
        <div className="border-t border-white/10 pt-3">
          <p className="mb-2 text-[11px] text-white/50">{copy.emailHint}</p>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void captureEmail("inline");
            }}
          >
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={copy.emailPlaceholder}
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-xs text-white outline-none placeholder:text-white/35 focus:border-violet-400/50"
            />
            <button
              type="submit"
              disabled={emailLoading}
              className="shrink-0 rounded-lg border border-violet-400/40 bg-violet-500/20 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/30 disabled:opacity-60"
            >
              {emailLoading ? copy.loading : copy.emailSubmit}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
