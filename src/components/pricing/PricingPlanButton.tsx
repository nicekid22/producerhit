import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Crown, Loader2, Sparkles, Zap } from "lucide-react";
import type { PlanTier, PricingCtaMeta } from "@/lib/billing";
import { cn } from "@/lib/utils";

type Props = {
  tier: PlanTier;
  cta: PricingCtaMeta;
  busy?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  to?: string;
};

function CtaIcon({ tier, kind }: { tier: PlanTier; kind: PricingCtaMeta["kind"] }) {
  if (kind !== "upgrade") return null;
  if (tier === "plus") return <Crown className="h-4 w-4 shrink-0 opacity-95" aria-hidden />;
  if (tier === "studio") return <Sparkles className="h-4 w-4 shrink-0 opacity-95" aria-hidden />;
  return <Zap className="h-4 w-4 shrink-0 opacity-95" aria-hidden />;
}

function ButtonContent({ tier, cta, busy }: { tier: PlanTier; cta: PricingCtaMeta; busy: boolean }) {
  if (busy) {
    return <Loader2 className="h-4 w-4 animate-spin" aria-hidden />;
  }
  return (
    <>
      <CtaIcon tier={tier} kind={cta.kind} />
      <span className="truncate text-center">{cta.label}</span>
    </>
  );
}

export function PricingPlanButton({ tier, cta, busy = false, disabled = false, onClick, to }: Props) {
  const isDisabled = disabled || busy || cta.disabled;
  const href = !isDisabled ? to : undefined;

  const renderAction = (
    className: string,
    content: ReactNode,
    extra?: { type?: "button"; onClick?: () => void },
  ) => {
    if (isDisabled) {
      return (
        <button type="button" disabled className={className}>
          {content}
        </button>
      );
    }
    if (href) {
      return (
        <Link to={href} className={className}>
          {content}
        </Link>
      );
    }
    return (
      <button type="button" onClick={extra?.onClick ?? onClick} className={className}>
        {content}
      </button>
    );
  };

  if (cta.kind === "upgrade") {
    return (
      <div className="pk-pricing-gen-cta-shell relative w-full">
        <span className="pk-landing-gen__cta-field" aria-hidden />
        {renderAction(
          cn(
            "pk-landing-gen__cta pk-pricing-gen-cta group flex w-full items-center justify-center rounded-xl px-5",
            busy ? "is-generating" : "",
          ),
          <>
            <span className="pk-landing-gen__cta-rim" aria-hidden />
            <span className="pk-landing-gen__cta-spark" aria-hidden />
            <span className="pk-landing-gen__cta-spark pk-landing-gen__cta-spark--alt" aria-hidden />
            <span className="pk-landing-gen__cta-glass" aria-hidden>
              <span className="pk-landing-gen__cta-liquid" aria-hidden />
              <span className="pk-landing-gen__cta-shine" aria-hidden />
            </span>
            <span className="pk-landing-gen__cta-inner inline-flex max-w-full items-center justify-center gap-2">
              <ButtonContent tier={tier} cta={cta} busy={busy} />
            </span>
          </>,
        )}
      </div>
    );
  }

  if (cta.kind === "start_free") {
    return renderAction(
      "pk-pricing-plan-btn pk-pricing-plan-btn--muted flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold",
      <ButtonContent tier={tier} cta={cta} busy={busy} />,
      { onClick },
    );
  }

  return renderAction(
    cn(
      "pk-pricing-plan-btn flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold",
      cta.kind === "current" || cta.kind === "included"
        ? "pk-pricing-plan-btn--current"
        : "pk-pricing-plan-btn--muted",
    ),
    <ButtonContent tier={tier} cta={cta} busy={busy} />,
  );
}
