import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Gift, Sparkles } from "lucide-react";
import { burstConfetti } from "@/lib/delight/confetti";
import { playLootOpen, playLootSpinTick, playLootTeaser, playLootWin } from "@/lib/delight/lootSfx";
import { useLootRevealStore } from "@/stores/lootRevealStore";
import { useLocaleStore } from "@/stores/localeStore";
import { cn } from "@/lib/utils";

const ITEM_W = 96;
const SPIN_SPEED = 16;
const AUTO_STOP_MS = 2200;
const STOP_MS = 520;

type ReelItem = { id: string; label: string; sub: string; win?: boolean };
type Phase = "teaser" | "spin" | "stopping" | "won";

function buildSegment(winCredits: number, locale: "en" | "fr"): ReelItem[] {
  const decoys: ReelItem[] = [
    { id: "d1", label: "+1", sub: "GEN" },
    { id: "d2", label: "XP", sub: "BOOST" },
    { id: "d3", label: "+2", sub: "GEN" },
    { id: "d4", label: "🔥", sub: "STREAK" },
    { id: "d5", label: "+1", sub: "GEN" },
    { id: "d6", label: "✦", sub: "LUCK" },
  ];
  const win: ReelItem = {
    id: "win",
    label: `+${winCredits}`,
    sub: locale === "fr" ? "GÉNÉ" : "GENS",
    win: true,
  };
  return [...decoys.slice(0, 3), win, ...decoys.slice(3)];
}

function tripleStrip(segment: ReelItem[]): ReelItem[] {
  return [
    ...segment.map((item, i) => ({ ...item, id: `${item.id}-a-${i}` })),
    ...segment.map((item, i) => ({ ...item, id: `${item.id}-b-${i}` })),
    ...segment.map((item, i) => ({ ...item, id: `${item.id}-c-${i}` })),
  ];
}

function nextStopTarget(currentOffset: number, segment: ReelItem[], viewportCenter: number): number {
  const winIdx = segment.findIndex((r) => r.win);
  const idx = winIdx >= 0 ? winIdx : Math.floor(segment.length / 2);
  const segmentW = segment.length * ITEM_W;
  const winCenter = idx * ITEM_W + ITEM_W / 2;
  let target = winCenter - viewportCenter;
  while (target <= currentOffset + ITEM_W * 2) target += segmentW;
  return target;
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function LootRevealModal() {
  const open = useLootRevealStore((s) => s.open);
  const payload = useLootRevealStore((s) => s.payload);
  const closeLoot = useLootRevealStore((s) => s.closeLoot);
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";

  const [phase, setPhase] = useState<Phase>("teaser");
  const [offset, setOffset] = useState(0);
  const [viewportCenter, setViewportCenter] = useState(210);

  const phaseRef = useRef<Phase>("teaser");
  const offsetRef = useRef(0);
  const targetRef = useRef(0);
  const rafRef = useRef(0);
  const confettiRef = useRef(false);
  const teaserSfxRef = useRef(false);
  const stopAnimRef = useRef({ from: 0, to: 0, start: 0 });
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const segment = useMemo(
    () => (payload ? buildSegment(Math.max(1, payload.credits), locale) : []),
    [locale, payload],
  );
  const reel = useMemo(() => (segment.length ? tripleStrip(segment) : []), [segment]);
  const segmentWidth = segment.length * ITEM_W;

  const title = useMemo(() => {
    if (!payload) return "";
    if (payload.kind === "daily") return isFr ? "Loot du jour" : "Daily loot";
    if (payload.kind === "level") return isFr ? `Level ${payload.level ?? "UP"}` : `Level ${payload.level ?? "UP"}`;
    if (payload.kind === "referral" && payload.referralRole === "referrer") {
      return isFr ? "Nouveau filleul !" : "New referral!";
    }
    if (payload.kind === "referral") return isFr ? "Parrainage activé" : "Referral unlocked";
    return isFr ? "Bonus débloqué" : "Bonus unlocked";
  }, [isFr, payload]);

  const teaserLine = useMemo(() => {
    if (!payload) return "";
    if (payload.kind === "referral" && payload.referralRole === "referrer") {
      return isFr
        ? "Quelqu'un vient de rejoindre via ton lien — ouvre le coffre."
        : "Someone joined with your link — open the chest.";
    }
    return isFr ? "Ta récompense t'attend — ouvre le coffre." : "Your reward is ready — open the chest.";
  }, [isFr, payload]);

  const setPhaseSafe = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const measureViewport = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w > 0) setViewportCenter(w / 2);
  }, []);

  const revealWon = useCallback(() => {
    if (confettiRef.current) return;
    confettiRef.current = true;
    setPhaseSafe("won");
    playLootWin();
    burstConfetti({ count: 70, originY: 0.42 });
  }, [setPhaseSafe]);

  const beginStop = useCallback(() => {
    if (phaseRef.current !== "spin" || !segment.length) return;
    targetRef.current = nextStopTarget(offsetRef.current, segment, viewportCenter);
    stopAnimRef.current = {
      from: offsetRef.current,
      to: targetRef.current,
      start: performance.now(),
    };
    setPhaseSafe("stopping");
  }, [segment, setPhaseSafe, viewportCenter]);

  const beginSpin = useCallback(() => {
    if (!segment.length || phaseRef.current !== "teaser") return;
    playLootOpen();
    offsetRef.current = 0;
    setOffset(0);
    if (prefersReducedMotion()) {
      targetRef.current = nextStopTarget(0, segment, viewportCenter);
      offsetRef.current = targetRef.current;
      setOffset(targetRef.current);
      window.setTimeout(() => revealWon(), 160);
      return;
    }
    setPhaseSafe("spin");
  }, [revealWon, segment, setPhaseSafe, viewportCenter]);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    confettiRef.current = false;
    teaserSfxRef.current = false;
    offsetRef.current = 0;
    targetRef.current = 0;
    setOffset(0);
    setPhaseSafe("teaser");
  }, [setPhaseSafe]);

  useEffect(() => {
    if (!open || !payload || !segment.length) {
      reset();
      return;
    }
    reset();
  }, [open, payload, reset, segment.length]);

  useEffect(() => {
    if (!open || phase !== "teaser" || teaserSfxRef.current) return;
    teaserSfxRef.current = true;
    const t = window.setTimeout(() => playLootTeaser(), 180);
    return () => window.clearTimeout(t);
  }, [open, phase]);

  useEffect(() => {
    if (!open) return;
    measureViewport();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measureViewport) : null;
    if (viewportRef.current && ro) ro.observe(viewportRef.current);
    window.addEventListener("resize", measureViewport, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measureViewport);
    };
  }, [measureViewport, open, phase]);

  useEffect(() => {
    if (phase !== "spin") return;
    const timer = window.setTimeout(() => beginStop(), AUTO_STOP_MS);
    return () => window.clearTimeout(timer);
  }, [beginStop, phase]);

  useEffect(() => {
    if (phase !== "spin" && phase !== "stopping") return;

    const tick = (now: number) => {
      if (phaseRef.current === "spin") {
        offsetRef.current = (offsetRef.current + SPIN_SPEED) % segmentWidth;
        setOffset(offsetRef.current);
        playLootSpinTick();
      } else if (phaseRef.current === "stopping") {
        const { from, to, start } = stopAnimRef.current;
        const t = Math.min(1, (now - start) / STOP_MS);
        const eased = 1 - (1 - t) ** 4;
        offsetRef.current = from + (to - from) * eased;
        setOffset(offsetRef.current);
        if (t >= 1) {
          revealWon();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, revealWon, segmentWidth]);

  const onPrimary = () => {
    if (phase === "teaser") beginSpin();
    else if (phase === "spin") beginStop();
    else if (phase === "won") closeLoot();
  };

  if (!open || !payload || typeof document === "undefined") return null;

  const showReel = phase !== "teaser";

  return createPortal(
    <div
      className="pk-loot-overlay fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget && phase === "won") closeLoot();
      }}
    >
      <div className="pk-loot-modal w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#07070f] shadow-[0_0_120px_rgba(124,58,237,0.35),0_24px_80px_rgba(0,0,0,0.65)] sm:max-w-xl">
        <div className="relative border-b border-white/10 bg-gradient-to-r from-violet-600/25 via-[#0c0c18] to-cyan-500/20 px-6 py-4 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(167,139,250,0.18),transparent_55%)]" />
          <div className="relative text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300/85">ProducerHit rewards</div>
          <h2 className="relative mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
          {phase === "teaser" ? (
            <p className="relative mt-2 text-sm text-white/50">{teaserLine}</p>
          ) : phase === "won" ? null : (
            <p className="relative mt-2 text-xs text-white/45">
              {phase === "stopping"
                ? isFr
                  ? "Verrouillage…"
                  : "Locking in…"
                : isFr
                  ? "Stop ou laisse tourner"
                  : "Stop or let it roll"}
            </p>
          )}
        </div>

        <div className="relative px-4 py-6 sm:px-6 sm:py-7">
          {!showReel ? (
            <div className="flex flex-col items-center py-4 sm:py-6">
              <button
                type="button"
                onClick={beginSpin}
                className="pk-loot-chest group relative flex h-40 w-40 flex-col items-center justify-center rounded-[2rem] border border-violet-400/35 bg-gradient-to-br from-violet-600/30 via-[#12121f] to-cyan-500/20 shadow-[0_0_60px_rgba(124,58,237,0.35)] transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98] sm:h-44 sm:w-44"
                aria-label={isFr ? "Ouvrir le loot" : "Open loot"}
              >
                <span className="pk-loot-chest__ring pointer-events-none absolute inset-0 rounded-[2rem]" aria-hidden />
                <span className="pk-loot-chest__glow pointer-events-none absolute -inset-3 rounded-[2.4rem] opacity-70" aria-hidden />
                <Gift className="relative z-[1] h-14 w-14 text-violet-100 drop-shadow-[0_0_18px_rgba(167,139,250,0.65)] transition-transform duration-500 group-hover:-translate-y-1 sm:h-16 sm:w-16" />
                <Sparkles className="absolute right-5 top-5 h-4 w-4 text-cyan-300/80 pk-loot-sparkle" aria-hidden />
                <Sparkles className="absolute bottom-6 left-5 h-3 w-3 text-fuchsia-300/70 pk-loot-sparkle pk-loot-sparkle--delay" aria-hidden />
              </button>
              <p className="mt-5 text-center text-sm font-semibold text-white/70">
                {isFr ? "Appuie pour révéler ton loot" : "Tap to reveal your loot"}
              </p>
            </div>
          ) : (
            <>
              <div
                ref={viewportRef}
                className="pk-loot-reel-viewport relative mx-auto w-full max-w-[440px] overflow-hidden rounded-2xl border border-white/8 bg-black/40"
              >
                <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-14 bg-gradient-to-r from-[#07070f] via-[#07070f]/90 to-transparent sm:w-20" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-14 bg-gradient-to-l from-[#07070f] via-[#07070f]/90 to-transparent sm:w-20" />
                <div
                  className="pointer-events-none absolute inset-y-2 left-1/2 z-30 w-[96px] -translate-x-1/2 rounded-2xl border-2 border-cyan-400/70 bg-cyan-400/[0.06] shadow-[0_0_32px_rgba(34,211,238,0.35),inset_0_0_24px_rgba(34,211,238,0.08)]"
                  aria-hidden
                />
                <div className="py-2">
                  <div className="flex will-change-transform" style={{ transform: `translate3d(${-offset}px,0,0)` }}>
                    {reel.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "pk-loot-reel-item flex h-[96px] w-[96px] shrink-0 flex-col items-center justify-center border-r border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent",
                          item.win && phase === "won" && "pk-loot-reel-item--win",
                        )}
                      >
                        <span className="text-2xl font-black tabular-nums tracking-tight text-white">{item.label}</span>
                        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">{item.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {phase === "won" ? (
                <div className="pk-loot-win mt-6 text-center">
                  <div className="text-4xl font-black tabular-nums bg-gradient-to-r from-cyan-200 via-violet-200 to-fuchsia-300 bg-clip-text text-transparent sm:text-5xl">
                    +{payload.credits}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white/85">
                    {isFr ? "générations free ce mois-ci" : "free gens this month"}
                  </div>
                  {payload.xp ? <div className="mt-2 text-xs font-medium text-violet-300/90">+{payload.xp} XP</div> : null}
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="border-t border-white/10 bg-black/20 p-4">
          <button
            type="button"
            onClick={onPrimary}
            disabled={phase === "stopping"}
            className={cn(
              "w-full rounded-full py-3.5 text-sm font-bold transition-all disabled:opacity-60",
              phase === "teaser"
                ? "pk-loot-cta-pulse bg-gradient-to-r from-violet-600 via-violet-500 to-cyan-500 text-white shadow-[0_0_40px_rgba(124,58,237,0.35)] hover:brightness-110"
                : phase === "won"
                  ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:brightness-110"
                  : "bg-white/10 text-white hover:bg-white/15",
            )}
          >
            {phase === "teaser"
              ? isFr
                ? "Ouvrir le loot ✦"
                : "Open loot ✦"
              : phase === "won"
                ? "Let's cook →"
                : phase === "stopping"
                  ? isFr
                    ? "Verrouillage…"
                    : "Locking…"
                  : isFr
                    ? "Stop ✦"
                    : "Stop ✦"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
