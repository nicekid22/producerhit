import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { GenerationProgressBar } from "@/components/ui/GenerationProgressBar";

export function LoopCardSkeleton({
  title,
  sub,
  hint,
  progressPct,
  progressLabel,
}: {
  title: string;
  sub?: string;
  hint?: string;
  /** Estimation locale (ACE ne renvoie pas de % réel). */
  progressPct?: number;
  progressLabel?: string;
}) {
  const hasProgress = typeof progressPct === "number";
  const statusLine = sub || "Création en cours…";

  return (
    <div
      className="pk-gen-loading-card pk-gen-loading-card--compact relative overflow-hidden rounded-[1.25rem] border border-purple-400/25 bg-white/[0.04] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_16px_rgba(139,92,246,0.08),0_4px_6px_rgba(0,0,0,0.15)] backdrop-blur-xl"
      role="status"
      aria-live="polite"
    >
      <div className="pk-gen-loading-shimmer pointer-events-none absolute inset-0 z-[1] opacity-40" aria-hidden />
      <div className="relative z-[2] flex items-center gap-2.5">
        <div className="pk-gen-loading-icon-box relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.06]">
          <PkIconLoader icon="generator" size="xs" inline className="relative z-[1]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold leading-tight text-white/90">{title}</div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] leading-snug text-white/50">
            <span className="min-w-0 truncate">{statusLine}</span>
            {hasProgress ? (
              <span className="pk-gen-loading-pct shrink-0 tabular-nums font-semibold text-pk-accent/90">
                {progressPct} %
              </span>
            ) : null}
          </div>
          {hint ? (
            <div className="mt-0.5 truncate text-[10px] leading-snug text-pk-muted/75">{hint}</div>
          ) : null}
        </div>
      </div>

      {hasProgress ? (
        <div className="relative z-[2] mt-2">
          <GenerationProgressBar
            percent={progressPct}
            label={progressLabel}
            className="[&_.pk-generation-progress-track]:h-1"
          />
        </div>
      ) : null}
    </div>
  );
}
