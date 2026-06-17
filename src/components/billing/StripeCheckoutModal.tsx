import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Lock, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  checkoutSessionIdFromClientSecret,
  confirmCheckoutSession,
  waitForPlanActivation,
} from "@/lib/billing";
import { useStripeCheckoutStore } from "@/stores/stripeCheckoutStore";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { useVisualThemeStore } from "@/stores/visualThemeStore";
import { useCloudAccentStore } from "@/stores/cloudAccentStore";
import { cn } from "@/lib/utils";
import { clearCheckoutAbandoned, markCheckoutAbandoned } from "@/lib/checkoutRecovery";
import { trackClientEvent } from "@/lib/supabaseClient";
import "@/styles/stripe-checkout-modal.css";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";

const PLAN_PERKS_FR: Record<string, string[]> = {
  pro: ["Droits commerciaux", "Export WAV", "Plus de générations"],
  studio: ["Stems & mastering", "Volume pro", "Workflow accéléré"],
  plus: ["Priorité serveur", "Stems complets", "Quota maximum"],
};

const PLAN_PERKS_EN: Record<string, string[]> = {
  pro: ["Commercial rights", "WAV export", "More generations"],
  studio: ["Stems & mastering", "Pro volume", "Faster workflow"],
  plus: ["Priority queue", "Full stems", "Max quota"],
};

export function StripeCheckoutModal() {
  const open = useStripeCheckoutStore((s) => s.open);
  const clientSecret = useStripeCheckoutStore((s) => s.clientSecret);
  const returnUrl = useStripeCheckoutStore((s) => s.returnUrl);
  const plan = useStripeCheckoutStore((s) => s.plan);
  const closeCheckout = useStripeCheckoutStore((s) => s.closeCheckout);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const locale = useLocaleStore((s) => s.locale);
  const visualTheme = useVisualThemeStore((s) => s.theme);
  const cloudAccent = useCloudAccentStore((s) => s.accent);
  const isFr = locale === "fr";
  const [activating, setActivating] = useState(false);

  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !clientSecret || typeof document === "undefined") return null;

  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "";
  const perks = plan ? (isFr ? PLAN_PERKS_FR[plan] : PLAN_PERKS_EN[plan]) ?? [] : [];

  const handleCloseCheckout = () => {
    if (plan && !activating) {
      markCheckoutAbandoned(plan, "embedded_modal");
      trackClientEvent("checkout_abandoned", { plan, ui_mode: "embedded" });
    }
    closeCheckout();
  };

  const handleComplete = () => {
    setActivating(true);
    void (async () => {
      const sessionId = checkoutSessionIdFromClientSecret(clientSecret);
      if (sessionId) {
        await confirmCheckoutSession(sessionId).catch(() => undefined);
      }
      const activatedPlan = await waitForPlanActivation(refreshProfile, plan ?? undefined);
      if (activatedPlan) {
        clearCheckoutAbandoned();
        toast.success(isFr ? `Plan activé : ${activatedPlan}` : `Plan activated: ${activatedPlan}`);
      } else {
        toast(
          isFr
            ? "Paiement reçu — activation en cours (quelques secondes)."
            : "Payment received — activation in progress (a few seconds).",
        );
      }
      closeCheckout();
      if (returnUrl) window.location.href = returnUrl;
    })();
  };

  return createPortal(
    <div
      className="pk-stripe-checkout-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pk-stripe-checkout-title"
    >
      <div
        className={cn(
          "pk-stripe-checkout",
          plan && `pk-stripe-checkout--${plan}`,
          `pk-stripe-checkout--theme-${visualTheme}`,
        )}
        data-pk-visual-theme={visualTheme}
        data-pk-cloud-accent={visualTheme === "cloud" ? cloudAccent : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pk-stripe-checkout__glow" aria-hidden />

        <button
          type="button"
          className="pk-stripe-checkout__close"
          aria-label={isFr ? "Fermer" : "Close"}
          onClick={handleCloseCheckout}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="pk-stripe-checkout__layout">
          <aside className="pk-stripe-checkout__aside">
            <header className="pk-stripe-checkout__header">
              <p className="pk-stripe-checkout__eyebrow">
                {isFr ? "Paiement sécurisé" : "Secure checkout"}
              </p>
              <h2 id="pk-stripe-checkout-title" className="pk-stripe-checkout__title">
                {planLabel ? `ProducerHit ${planLabel}` : isFr ? "Abonnement" : "Subscription"}
              </h2>
              <p className="pk-stripe-checkout__subtitle">
                {isFr
                  ? "Récap et paiement gérés par Stripe — une seule source."
                  : "Summary and payment handled by Stripe — single source of truth."}
              </p>

              {perks.length ? (
                <ul className="pk-stripe-checkout__perks">
                  {perks.map((perk) => (
                    <li key={perk} className="pk-stripe-checkout__perk">
                      <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
                      {perk}
                    </li>
                  ))}
                </ul>
              ) : null}
            </header>

            <footer className="pk-stripe-checkout__footer pk-stripe-checkout__footer--aside">
              <Lock className="h-3 w-3 shrink-0" aria-hidden />
              {isFr ? "Apple Pay · Google Pay · Carte · Stripe" : "Apple Pay · Google Pay · Card · Stripe"}
            </footer>
          </aside>

          <div className="pk-stripe-checkout__form-wrap">
            {activating ? (
              <div className="pk-stripe-checkout__activating" role="status">
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                <p>{isFr ? "Activation de ton plan…" : "Activating your plan…"}</p>
              </div>
            ) : null}
            <div className={cn("pk-stripe-checkout__form", activating && "pk-stripe-checkout__form--hidden")}>
              {!publishableKey || !stripePromise ? (
                <p className="pk-stripe-checkout__error">
                  {isFr
                    ? "Clé Stripe publishable manquante (VITE_STRIPE_PUBLISHABLE_KEY)."
                    : "Missing Stripe publishable key (VITE_STRIPE_PUBLISHABLE_KEY)."}
                </p>
              ) : (
                <EmbeddedCheckoutProvider
                  key={clientSecret}
                  stripe={stripePromise}
                  options={{ clientSecret, onComplete: handleComplete }}
                >
                  <EmbeddedCheckout className="pk-stripe-checkout__mount" />
                </EmbeddedCheckoutProvider>
              )}
            </div>
          </div>
        </div>

        <footer className="pk-stripe-checkout__footer pk-stripe-checkout__footer--mobile">
          <Lock className="h-3 w-3 shrink-0" aria-hidden />
          {isFr ? "Apple Pay · Google Pay · Carte · Stripe" : "Apple Pay · Google Pay · Card · Stripe"}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
