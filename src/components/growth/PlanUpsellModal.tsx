import { useEffect, useState } from "react";
import { Check, Lock, Sparkles, X, Zap } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { buildAuthNextUrl, runCheckoutWithAuth, runCreditPackCheckout } from "@/lib/billing";
import { getCreditPackCtaLabel } from "@/lib/creditPacks";
import { getUpsellCopy, shouldShowPlanUpsell, type UpsellReason } from "@/lib/growthUpsell";
import { planPriceLabel } from "@/lib/planPricing";
import { LaunchOfferChips } from "@/components/marketing/LaunchOfferChips";
import { LaunchPriceDisplay } from "@/components/marketing/LaunchPriceDisplay";
import { producerWhispers } from "@/lib/producerLegends";
import { trackClientEvent } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import type { PaidPlanId } from "@/lib/planEntitlements";
import { cn } from "@/lib/utils";
import { useVisualThemeStore } from "@/stores/visualThemeStore";
import "@/styles/paywall-modal.css";

import type { AppLocale } from "@/i18n/config";
import { buildPlanUpsellModalCopy } from "@/i18n/planUpsellModalCatalog";
type Props = {
  open: boolean;
  reason: UpsellReason | null;
  locale: AppLocale;
  plan: string;
  source: string;
  remaining?: number;
  totalLimit?: number;
  usedThisMonth?: number;
  onClose: () => void;
};

export function PlanUpsellModal({
  open,
  reason,
  locale,
  plan,
  source,
  remaining,
  totalLimit,
  usedThisMonth,
  onClose,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const visualTheme = useVisualThemeStore((s) => s.theme);
  const [busy, setBusy] = useState(false);
  const ctx = { source, plan, remaining, totalLimit, usedThisMonth };
  const visible = reason ? shouldShowPlanUpsell(plan, reason, ctx) : false;
  const ui = buildPlanUpsellModalCopy(locale);

  useEffect(() => {
    if (!reason) return;
    if (open && !visible) onClose();
  }, [open, visible, onClose, reason]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!reason || !visible || !open || typeof document === "undefined") return null;

  const copy = getUpsellCopy(reason, locale, plan, ctx);
  const targetPlan = copy.targetPlan;
  const whisper = producerWhispers(locale).find((w) => w.kind === "workflow") ?? producerWhispers(locale)[0];
  const showLaunch = targetPlan === "pro";

  const trackDismiss = () => {
    trackClientEvent("upgrade_prompt_dismissed", { source, reason, plan });
    onClose();
  };

  const startUpgrade = async (target: PaidPlanId | null) => {
    if (!target) {
      onClose();
      window.location.href = "/settings";
      return;
    }

    trackClientEvent("upgrade_click", {
      source,
      reason,
      location: "plan_upsell_modal",
      plan: target,
    });

    if (!user) {
      onClose();
      window.location.href = buildAuthNextUrl(target);
      return;
    }

    setBusy(true);
    try {
      await runCheckoutWithAuth({ plan: target, location: `upsell_${reason}`, locale });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const urgent = reason === "credits_exhausted" || reason === "limit_reached";
  const showCreditPack = urgent && !!user;

  const startCreditPack = async () => {
    trackClientEvent("credit_pack_click", { source, reason, location: "plan_upsell_modal" });
    setBusy(true);
    try {
      await runCreditPackCheckout({ product: "credit_pack_50", location: `upsell_${reason}`, locale });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const primaryAction = async () => {
    if (targetPlan) {
      await startUpgrade(targetPlan);
      return;
    }
    if (showCreditPack) {
      await startCreditPack();
      return;
    }
    await startUpgrade(null);
  };

  const primaryLabel =
    !targetPlan && showCreditPack ? getCreditPackCtaLabel(locale) : copy.primaryLabel;

  return createPortal(
    <div
      className="pk-paywall-backdrop fixed inset-0 z-[210] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pk-paywall-title"
      onClick={trackDismiss}
    >
      <div
        className={cn(
          "pk-paywall pk-veil-modal-panel relative w-full max-w-md overflow-hidden rounded-t-[1.5rem] sm:rounded-[1.5rem]",
          `pk-paywall--theme-${visualTheme}`,
          showLaunch && "pk-paywall--launch",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pk-paywall__glow" aria-hidden />

        <button
          type="button"
          className="pk-paywall__close absolute z-20 inline-flex h-9 w-9 items-center justify-center rounded-full transition"
          aria-label={ui.close}
          onClick={trackDismiss}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="relative px-6 pb-6 pt-9 sm:px-7 sm:pb-7 sm:pt-9">
          <div className="flex items-center gap-3 pr-9">
            <div
              className={cn(
                "pk-paywall__icon flex h-12 w-12 items-center justify-center rounded-2xl",
                urgent && "pk-paywall__icon--urgent",
              )}
            >
              {urgent ? <Zap className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <p className="pk-paywall__eyebrow text-[11px] font-semibold uppercase tracking-[0.16em]">
                {ui.eyebrow(urgent)}
              </p>
              {!showLaunch && targetPlan ? (
                <p className="pk-paywall__price mt-0.5 text-sm font-bold tabular-nums">
                  {planPriceLabel(targetPlan, locale, { suffix: true })}
                  <span className="pk-paywall__price-note ml-1 text-xs font-medium">
                    {ui.cancelAnytime}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          <h2 id="pk-paywall-title" className="pk-paywall__title mt-5 text-balance text-xl font-bold leading-snug tracking-tight sm:text-[1.35rem]">
            {copy.title}
          </h2>

          {showLaunch ? (
            <div className="pk-paywall__price-hero">
              <LaunchPriceDisplay tier="pro" locale={locale} size="hero" variant="hero" align="center" />
              <LaunchOfferChips locale={locale} className="text-center" compact />
            </div>
          ) : (
            <p className="pk-paywall__desc mt-2 text-sm leading-relaxed">{copy.description}</p>
          )}

          {showLaunch ? (
            <p className="pk-paywall__desc mt-3 text-center text-sm leading-relaxed">{copy.description}</p>
          ) : null}

          {showLaunch && whisper ? (
            <p className="pk-paywall__legend-foot">{`"${whisper.quote}" — ${whisper.who}`}</p>
          ) : null}

          <ul className="mt-5 space-y-2.5">
            {copy.bullets.slice(0, showLaunch ? 3 : 4).map((line) => (
              <li key={line} className="pk-paywall__bullet flex items-start gap-2.5 text-sm">
                <span className="pk-paywall__check mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                  <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2.5">
            <Button
              variant="primary"
              size="md"
              className={cn(
                "pk-paywall__cta-primary h-12 w-full rounded-full text-sm font-bold",
                showLaunch && "pk-pro-cta",
              )}
              disabled={busy}
              onClick={() => void primaryAction()}
            >
              {busy ? ui.openingCheckout : primaryLabel}
            </Button>
            {targetPlan && showCreditPack ? (
              <Button
                variant="secondary"
                size="md"
                className="pk-paywall__cta-secondary h-11 w-full rounded-full text-sm font-semibold"
                disabled={busy}
                onClick={() => void startCreditPack()}
              >
                {getCreditPackCtaLabel(locale)}
              </Button>
            ) : null}
            <button
              type="button"
              className="pk-paywall__secondary w-full py-2 text-center text-xs font-semibold transition"
              disabled={busy}
              onClick={trackDismiss}
            >
              {copy.secondaryLabel}
            </button>
          </div>

          <p className="pk-paywall__footer mt-4 flex items-center justify-center gap-1.5 text-[11px]">
            <Lock className="h-3 w-3 shrink-0" aria-hidden />
            {ui.stripeFooter}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
