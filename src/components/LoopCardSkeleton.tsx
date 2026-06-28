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
      className="pk-gen-loading-card pk-gen-loading-card--compact relative overflow-hidden rounded-xl border border-pk-accent/30 bg-pk-panel px-3 py-2.5 shadow-[0_0_16px_rgba(124,58,237,0.1)]"
      role="status"
      aria-live="polite"
    >
      <div className="pk-gen-loading-shimmer pointer-events-none absolute inset-0 z-[1] opacity-40" aria-hidden />
      <div className="relative z-[2] flex items-center gap-2.5">
        <div className="pk-gen-loading-icon-box relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          <PkIconLoader icon="generator" size="xs" inline className="relative z-[1]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold leading-tight text-pk-text">{title}</div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] leading-snug text-pk-muted">
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
