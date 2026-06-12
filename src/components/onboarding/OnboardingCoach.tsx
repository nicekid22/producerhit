import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CoachMascot } from "@/components/onboarding/CoachMascot";
import { coachStepCopy, type CoachStepId } from "@/lib/onboarding/coachSteps";
import { useOnboardingCoachStore } from "@/stores/onboardingCoachStore";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = {
  locale: "en" | "fr";
};

type Rect = { top: number; left: number; width: number; height: number };

function measureTarget(selector: string | undefined): Rect | null {
  if (!selector || typeof document === "undefined") return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function OnboardingCoach({ locale }: Props) {
  const isFr = locale === "fr";
  const visible = useOnboardingCoachStore((s) => s.visible);
  const phase = useOnboardingCoachStore((s) => s.phase);
  const stepIndex = useOnboardingCoachStore((s) => s.stepIndex);
  const next = useOnboardingCoachStore((s) => s.next);
  const skip = useOnboardingCoachStore((s) => s.skip);
  const currentStep = useOnboardingCoachStore((s) => s.currentStep());

  const stepId = (currentStep?.id ?? "welcome") as CoachStepId;
  const copy = coachStepCopy(stepId, isFr);
  const celebrate = Boolean(currentStep?.celebrate);
  const isCenter = !currentStep?.target || currentStep.placement === "center";

  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [bubbleStyle, setBubbleStyle] = useState<React.CSSProperties>({});

  const refresh = useCallback(() => {
    const rect = isCenter ? null : measureTarget(currentStep?.target);
    setTargetRect(rect);
  }, [currentStep?.target, isCenter]);

  useLayoutEffect(() => {
    if (!visible) return;
    refresh();
    const t = window.setTimeout(refresh, 120);
    return () => window.clearTimeout(t);
  }, [visible, stepIndex, phase, refresh, isCenter]);

  useEffect(() => {
    if (!visible) return;
    const onScroll = () => refresh();
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [visible, refresh]);

  useLayoutEffect(() => {
    if (!visible) return;
    const pad = 12;
    const bubbleW = Math.min(340, window.innerWidth - 32);
    if (isCenter || !targetRect) {
      setBubbleStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        width: bubbleW,
        transform: "translate(-50%, -50%)",
        zIndex: 120,
      });
      return;
    }
    const placement = currentStep?.placement ?? "bottom";
    let top = targetRect.top + targetRect.height + pad;
    let left = targetRect.left + targetRect.width / 2 - bubbleW / 2;
    if (placement === "top") top = targetRect.top - pad;
    if (placement === "right") {
      left = targetRect.left + targetRect.width + pad;
      top = targetRect.top + targetRect.height / 2;
    }
    left = Math.max(16, Math.min(left, window.innerWidth - bubbleW - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - 220));
    setBubbleStyle({
      position: "fixed",
      top,
      left,
      width: bubbleW,
      zIndex: 120,
      transform: placement === "top" ? "translateY(-100%)" : undefined,
    });
  }, [visible, targetRect, isCenter, currentStep?.placement]);

  if (!visible || phase === "idle") return null;

  const tourSteps = phase === "tour" ? 4 : 2;
  const stepNum = stepIndex + 1;

  return createPortal(
    <div className="pk-coach-root" role="dialog" aria-modal="true" aria-labelledby="pk-coach-title">
      <button
        type="button"
        className="pk-coach-backdrop fixed inset-0 z-[110] bg-black/55 backdrop-blur-[2px]"
        aria-label={isFr ? "Fermer" : "Close"}
        onClick={skip}
      />
      {targetRect ? (
        <div
          className="pk-coach-spotlight pointer-events-none fixed z-[115] rounded-2xl ring-2 ring-cyan-400/80 ring-offset-2 ring-offset-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      ) : null}
      <div className={cn("pk-coach-bubble rounded-2xl border border-white/12 bg-[#12121a]/95 p-4 shadow-2xl", celebrate && "pk-coach-bubble--celebrate")} style={bubbleStyle}>
        <div className="flex gap-3">
          <CoachMascot size={celebrate ? "lg" : "md"} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
              {isFr ? "Coach studio" : "Studio coach"} · {stepNum}/{tourSteps}
            </p>
            <h2 id="pk-coach-title" className="mt-1 text-base font-bold text-white">
              {copy.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/65">{copy.body}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {copy.skip ? (
            <Button variant="secondary" size="sm" className="flex-1" onClick={skip}>
              {copy.skip}
            </Button>
          ) : null}
          <Button variant="primary" size="sm" className={copy.skip ? "flex-1" : "w-full"} onClick={next}>
            {copy.cta}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
