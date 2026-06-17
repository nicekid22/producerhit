import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Lock, Sparkles, Waves } from "lucide-react";
import { CoachMascot } from "@/components/onboarding/CoachMascot";
import { useWavFormatCoachStore } from "@/stores/wavFormatCoachStore";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import type { AppLocale } from "@/i18n/config";
type Props = {
  locale: AppLocale;
  onPrepareTarget: () => void;
  onTryWav: () => void;
  onUpgradePro: () => void;
};

type Rect = { top: number; left: number; width: number; height: number };

function measureTarget(): Rect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector('[data-coach="audio-format"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function WavFormatCoach({ locale, onPrepareTarget, onTryWav, onUpgradePro }: Props) {
  const isFr = locale === "fr";
  const visible = useWavFormatCoachStore((s) => s.visible);
  const mode = useWavFormatCoachStore((s) => s.mode);
  const dismiss = useWavFormatCoachStore((s) => s.dismiss);

  const isPro = mode === "pro";
  const isFree = mode === "free";

  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [bubbleStyle, setBubbleStyle] = useState<React.CSSProperties>({});

  const refresh = useCallback(() => {
    onPrepareTarget();
    window.setTimeout(() => setTargetRect(measureTarget()), 180);
  }, [onPrepareTarget]);

  useLayoutEffect(() => {
    if (!visible) return;
    refresh();
  }, [visible, refresh]);

  useEffect(() => {
    if (!visible) return;
    const onResize = () => refresh();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [visible, refresh]);

  useLayoutEffect(() => {
    if (!visible) return;
    const bubbleW = Math.min(360, window.innerWidth - 32);
    if (!targetRect) {
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
    let top = targetRect.top - 16;
    let left = targetRect.left + targetRect.width / 2 - bubbleW / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - bubbleW - 16));
    top = Math.max(16, top - 210);
    setBubbleStyle({
      position: "fixed",
      top,
      left,
      width: bubbleW,
      zIndex: 120,
    });
  }, [visible, targetRect]);

  if (!visible || !mode) return null;

  const title = isPro
    ? isFr
      ? "Psst… le switch WAV 🎵"
      : "Psst… the WAV switch 🎵"
    : isFr
      ? "WAV = mode studio 🔐"
      : "WAV = studio mode 🔐";

  const body = isPro
    ? isFr
      ? "Tu es Pro — ce petit toggle change tout. MP3 pour partager vite, WAV pour une release propre (Spotify Ready)."
      : "You're on Pro — this tiny toggle changes everything. MP3 for quick shares, WAV for a clean release (Spotify Ready)."
    : isFr
      ? "Passe Pro et débloque le toggle WAV sur chaque génération. Qualité distributeur, sans prise de tête."
      : "Go Pro to unlock the WAV toggle on every generation. Distributor-grade quality, zero hassle.";

  return createPortal(
    <div className="pk-wav-coach-root" role="dialog" aria-modal="true" aria-labelledby="pk-wav-coach-title">
      <button
        type="button"
        className="pk-wav-coach-backdrop fixed inset-0 z-[110] bg-black/40 backdrop-blur-[1px]"
        aria-label={isFr ? "Fermer" : "Close"}
        onClick={() => dismiss()}
      />
      {targetRect ? (
        <div
          className="pk-wav-coach-spotlight pointer-events-none fixed z-[115] rounded-2xl ring-2 ring-fuchsia-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.42)]"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      ) : null}

      <div className={cn("pk-wav-coach-bubble", isFree && "pk-wav-coach-bubble--free")} style={bubbleStyle}>
        <div className="pk-wav-coach-bubble__tail" aria-hidden />
        <div className="flex gap-3">
          <CoachMascot size="lg" className="pk-wav-coach-mascot" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300/80">
              {isFr ? "Tip studio" : "Studio tip"}
            </p>
            <h2 id="pk-wav-coach-title" className="mt-1 text-lg font-extrabold leading-tight text-white">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{body}</p>
          </div>
        </div>

        <div className="pk-wav-coach-demo mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
          <span className="text-xs font-semibold text-white/55">{isFr ? "Format" : "Format"}</span>
          <div className="pk-wav-coach-toggle flex rounded-full border border-white/12 bg-black/30 p-0.5">
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white">MP3</span>
            <span
              className={cn(
                "relative flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold transition-all",
                isPro ? "bg-gradient-to-r from-violet-500 to-cyan-400 text-white pk-wav-coach-toggle__wav--on" : "text-white/35",
              )}
            >
              {isFree ? <Lock className="h-3 w-3" aria-hidden /> : <Waves className="h-3 w-3" aria-hidden />}
              WAV
              {isFree ? <span className="pk-wav-coach-sparkle" aria-hidden>✨</span> : null}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1" onClick={() => dismiss()}>
            {isFr ? "Plus tard" : "Later"}
          </Button>
          {isPro ? (
            <Button
              variant="primary"
              size="sm"
              className="pk-wav-coach-cta flex-1"
              onClick={() => {
                onTryWav();
                dismiss();
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isFr ? "Passer en WAV" : "Switch to WAV"}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="pk-wav-coach-cta flex-1"
              onClick={() => {
                dismiss();
                onUpgradePro();
              }}
            >
              {isFr ? "Débloquer avec Pro" : "Unlock with Pro"}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
