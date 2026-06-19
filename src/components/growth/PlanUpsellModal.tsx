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
      className="fixed inset-0 z-[210] flex items-end justify-center bg-black/72 p-0 backdrop-blur-md sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pk-paywall-title"
      onClick={trackDismiss}
    >
      <div
        className={cn(
          "pk-paywall relative w-full max-w-md overflow-hidden rounded-t-[1.5rem] border border-white/10 bg-[#0a0812] shadow-[0_32px_100px_rgba(0,0,0,0.72)] sm:rounded-[1.5rem]",
          showLaunch && "pk-paywall--launch",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(157,124,255,0.22),transparent_58%),radial-gradient(ellipse_70%_50%_at_100%_100%,rgba(103,195,255,0.12),transparent_55%)]"
          aria-hidden
        />

        <button
          type="button"
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:text-white"
          aria-label={ui.close}
          onClick={trackDismiss}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="relative px-6 pb-6 pt-8 sm:px-7 sm:pb-7">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl border",
                urgent
                  ? "border-amber-400/30 bg-amber-500/15 text-amber-200"
                  : "border-violet-400/30 bg-violet-500/15 text-violet-200",
              )}
            >
              {urgent ? <Zap className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42">
                {ui.eyebrow(urgent)}
              </p>
              {!showLaunch && targetPlan ? (
                <p className="mt-0.5 text-sm font-bold tabular-nums text-white">
                  {planPriceLabel(targetPlan, locale, { suffix: true })}
                  <span className="ml-1 text-xs font-medium text-white/45">
                    {ui.cancelAnytime}
                  </span>
                </p>
              ) : null}
            </div>
          </div>

          <h2 id="pk-paywall-title" className="mt-5 text-balance text-xl font-bold leading-snug tracking-tight text-white sm:text-[1.35rem]">
            {copy.title}
          </h2>

          {showLaunch ? (
            <div className="pk-paywall__price-hero">
              <LaunchPriceDisplay tier="pro" locale={locale} size="hero" variant="hero" align="center" />
              <LaunchOfferChips locale={locale} className="text-center" compact />
            </div>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-white/58">{copy.description}</p>
          )}

          {showLaunch ? (
            <p className="mt-3 text-center text-sm leading-relaxed text-white/52">{copy.description}</p>
          ) : null}

          {showLaunch && whisper ? (
            <p className="pk-paywall__legend-foot">&ldquo;{whisper.quote}&rdquo; — {whisper.who}</p>
          ) : null}

          <ul className="mt-5 space-y-2.5">
            {copy.bullets.slice(0, showLaunch ? 3 : 4).map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm text-white/78">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/12 text-emerald-300">
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
              className="h-12 w-full rounded-full text-sm font-bold"
              disabled={busy}
              onClick={() => void primaryAction()}
            >
              {busy ? ui.openingCheckout : primaryLabel}
            </Button>
            {targetPlan && showCreditPack ? (
              <Button
                variant="secondary"
                size="md"
                className="h-11 w-full rounded-full text-sm font-semibold"
                disabled={busy}
                onClick={() => void startCreditPack()}
              >
                {getCreditPackCtaLabel(locale)}
              </Button>
            ) : null}
            <button
              type="button"
              className="w-full py-2 text-center text-xs font-semibold text-white/42 transition hover:text-white/70"
              disabled={busy}
              onClick={trackDismiss}
            >
              {copy.secondaryLabel}
            </button>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-white/38">
            <Lock className="h-3 w-3 shrink-0" aria-hidden />
            {ui.stripeFooter}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
