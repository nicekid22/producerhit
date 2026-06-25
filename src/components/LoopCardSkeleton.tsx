import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { GenerationProgressBar } from "@/components/ui/GenerationProgressBar";
import { WaveformLoader } from "@/components/WaveformVisualizer";

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
  return (
    <div className="pk-gen-loading-card relative overflow-hidden rounded-pk border border-pk-accent/30 bg-pk-panel p-4 shadow-[0_0_24px_rgba(124,58,237,0.14)]">
      <div className="pk-gen-loading-shimmer pointer-events-none absolute inset-0 z-[1] opacity-40" aria-hidden />
      <div className="relative z-[2] flex gap-3">
        <div className="pk-gen-loading-icon-box relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-pk">
          <PkIconLoader icon="generator" size="xs" inline className="relative z-[1]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate text-sm font-semibold text-pk-text">{title}</div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="h-5 w-16 rounded-full bg-pk-border/60 animate-pulse" />
            <div className="h-5 w-14 rounded-full bg-pk-border/40 animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-pk-border/40 animate-pulse" />
          </div>
          <div className="mt-2 text-xs text-pk-muted">
            {typeof progressPct === "number" ? (
              <>
                {sub || "Création en cours…"}
                <span className="pk-gen-loading-pct ml-1.5 tabular-nums text-pk-accent/90">{progressPct} %</span>
              </>
            ) : (
              sub || "Création en cours…"
            )}
          </div>
          {hint ? <div className="mt-1.5 text-[11px] leading-snug text-pk-muted/80">{hint}</div> : null}
        </div>
      </div>

      {typeof progressPct === "number" ? (
        <div className="relative z-[2] mt-3">
          <GenerationProgressBar percent={progressPct} label={progressLabel} />
        </div>
      ) : null}

      <div className="relative z-[2] mt-3">
        <WaveformLoader height={28} active />
      </div>

      <div className="relative z-[2] mt-2 flex items-center justify-between text-xs text-pk-muted opacity-50">
        <div className="h-3 w-10 bg-pk-border/50 rounded animate-pulse" />
        <div className="h-3 w-8 bg-pk-border/50 rounded animate-pulse" />
      </div>

      <div className="relative z-[2] mt-4 flex flex-wrap gap-2 opacity-50">
        <div className="h-8 w-20 bg-pk-border/50 rounded-md animate-pulse" />
        <div className="h-8 w-20 bg-pk-border/50 rounded-md animate-pulse" />
        <div className="h-8 w-20 bg-pk-border/50 rounded-md animate-pulse" />
      </div>
    </div>
  );
}
