import { useEffect, useRef, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import { Link } from "react-router-dom";
import { ThemeBrandMark } from "@/components/ThemeBrandMark";
import { cn } from "@/lib/utils";

type StudioMode = "song" | "beat" | "remix";

type Props = {
  mode: StudioMode;
  locale: AppLocale;
  remixRecreate?: boolean;
  className?: string;
  compact?: boolean;
  /** Mobile : logo fixe, sans anim logo↔mode (évite chevauchement) */
  staticMode?: boolean;
};

function modeLabel(mode: StudioMode, locale: AppLocale): string {
  if (mode === "song") return locale === "fr" ? "Chanson" : "Song";
  if (mode === "beat") return "Beat";
  return "Remix";
}

export function DashboardStudioBrand({
  mode,
  locale,
  remixRecreate = false,
  className,
  compact = false,
  staticMode = false,
}: Props) {
  const [revealed, setRevealed] = useState(staticMode);
  const [displayMode, setDisplayMode] = useState(mode);
  const [modeSwap, setModeSwap] = useState(false);
  const initialRevealDone = useRef(staticMode);
  const prevMode = useRef(mode);

  useEffect(() => {
    if (staticMode) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setRevealed(true);
      initialRevealDone.current = true;
      return;
    }

    const revealTimer = window.setTimeout(() => {
      setRevealed(true);
      initialRevealDone.current = true;
    }, 900);

    return () => window.clearTimeout(revealTimer);
  }, [staticMode]);

  useEffect(() => {
    if (staticMode) {
      setDisplayMode(mode);
      prevMode.current = mode;
      return;
    }

    if (!initialRevealDone.current || prevMode.current === mode) {
      prevMode.current = mode;
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplayMode(mode);
      prevMode.current = mode;
      return;
    }

    setModeSwap(true);
    const swapTimer = window.setTimeout(() => {
      setDisplayMode(mode);
      setModeSwap(false);
      prevMode.current = mode;
    }, 220);

    return () => window.clearTimeout(swapTimer);
  }, [mode, staticMode]);

  const label = modeLabel(displayMode, locale);

  if (staticMode) {
    return (
      <div className={cn("pk-dashboard-studio-brand pk-dashboard-studio-brand--static", className)}>
        <Link
          to="/"
          aria-label="ProducerHit home"
          className="pk-dashboard-studio-brand__icon group inline-flex shrink-0 transition-opacity hover:opacity-90"
        >
          <ThemeBrandMark className={compact ? "h-[1.125rem] w-[1.125rem]" : "h-5 w-5"} />
        </Link>
        <span
          className={cn(
            "pk-dashboard-studio-brand__static-wordmark min-w-0 truncate font-semibold tracking-tight",
            compact ? "text-sm" : "text-base",
          )}
        >
          <span className="lowercase">producer</span>
          <span className="pk-dashboard-studio-brand__static-hit lowercase">hit</span>
        </span>
      </div>
    );
  }

  return (
    <div className={cn("pk-dashboard-studio-brand", className)}>
      <Link
        to="/"
        aria-label="ProducerHit home"
        className="pk-dashboard-studio-brand__icon group inline-flex shrink-0 transition-opacity hover:opacity-90"
      >
        <ThemeBrandMark className={compact ? "h-[1.125rem] w-[1.125rem]" : "h-5 w-5"} />
      </Link>

      <div
        className={cn(
          "pk-dashboard-studio-brand__stage relative min-w-0 overflow-hidden",
          compact ? "h-5" : "h-6",
        )}
        aria-live="polite"
      >
        <span
          className={cn(
            "pk-dashboard-studio-brand__logo absolute inset-y-0 left-0 flex items-center font-semibold tracking-tight",
            compact ? "text-sm" : "text-base",
            revealed ? "pk-dashboard-studio-brand__logo--out" : "pk-dashboard-studio-brand__logo--in",
          )}
        >
          <span className="lowercase text-white/90">producer</span>
          <span className="pk-prism-holo-text lowercase">hit</span>
        </span>

        <span
          className={cn(
            "pk-dashboard-studio-brand__mode absolute inset-y-0 left-0 flex items-center font-bold tracking-tight",
            compact ? "text-sm" : "text-base",
            revealed ? "pk-dashboard-studio-brand__mode--in" : "pk-dashboard-studio-brand__mode--out",
            modeSwap && "pk-dashboard-studio-brand__mode--swap",
          )}
        >
          <span className="pk-prism-holo-text lowercase">{label}</span>
        </span>
      </div>
    </div>
  );
}
