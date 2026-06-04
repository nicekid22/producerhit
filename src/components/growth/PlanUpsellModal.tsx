import { useEffect } from "react";
import { Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { buildPricingUrl } from "@/lib/billing";
import { getUpsellCopy, shouldShowPlanUpsell, type UpsellReason } from "@/lib/growthUpsell";
import { trackClientEvent } from "@/lib/supabaseClient";
import type { PaidPlanId } from "@/lib/planEntitlements";

type Props = {
  open: boolean;
  reason: UpsellReason | null;
  locale: "en" | "fr";
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
  const navigate = useNavigate();
  if (!reason) return null;

  const ctx = { source, plan, remaining, totalLimit, usedThisMonth };
  const visible = shouldShowPlanUpsell(plan, reason, ctx);

  useEffect(() => {
    if (open && !visible) onClose();
  }, [open, visible, onClose]);

  if (!visible) return null;

  const copy = getUpsellCopy(reason, locale, plan, ctx);

  const trackDismiss = () => {
    trackClientEvent("upgrade_prompt_dismissed", { source, reason, plan });
    onClose();
  };

  const goPricing = (target: PaidPlanId | null, checkout: boolean) => {
    trackClientEvent("upgrade_click", {
      source,
      reason,
      location: "plan_upsell_modal",
      plan: target ?? "pricing",
    });
    onClose();
    if (!target) {
      navigate("/settings");
      return;
    }
    navigate(buildPricingUrl(target, checkout));
  };

  return (
    <Modal open={open} title={copy.title} description={copy.description} confirmText={copy.primaryLabel} onClose={trackDismiss} onConfirm={() => goPricing(copy.targetPlan, true)} hideFooter>
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/12 to-cyan-500/8 p-4">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(167,139,250,0.2),transparent_50%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,0.12),transparent_45%)]"
            aria-hidden
          />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
              {reason === "credits_exhausted" || reason === "limit_reached" ? (
                <Zap className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>
            <div className="text-xs text-white/55">
              {locale === "fr" ? "Débloque la suite de ton workflow producteur" : "Unlock the rest of your producer workflow"}
            </div>
          </div>
          <ul className="relative mt-3 space-y-1.5 text-xs text-white/70">
            {copy.bullets.map((line) => (
              <li key={line}>✓ {line}</li>
            ))}
          </ul>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="primary" size="sm" onClick={() => goPricing(copy.targetPlan, true)}>
            {copy.primaryLabel}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (reason === "post_generation" || reason === "credits_low") {
                trackDismiss();
                return;
              }
              goPricing(copy.targetPlan, false);
            }}
          >
            {copy.secondaryLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
