import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { WaveformLoader } from "@/components/WaveformVisualizer";

export function LoopCardSkeleton({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="relative overflow-hidden rounded-pk border border-pk-accent/30 bg-pk-panel p-4 shadow-[0_0_24px_rgba(124,58,237,0.14)]">
      <div className="relative flex gap-3">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-pk border border-pk-accent/25 bg-pk-accent/10">
          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(124,58,237,0.45), transparent 55%)" }} />
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
          <div className="mt-2 text-xs text-pk-muted">{sub || "Création en cours…"}</div>
        </div>
      </div>

      <div className="relative mt-3">
        <WaveformLoader height={28} active />
      </div>

      <div className="relative mt-2 flex items-center justify-between text-xs text-pk-muted opacity-50">
        <div className="h-3 w-10 bg-pk-border/50 rounded animate-pulse" />
        <div className="h-3 w-8 bg-pk-border/50 rounded animate-pulse" />
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2 opacity-50">
        <div className="h-8 w-20 bg-pk-border/50 rounded-md animate-pulse" />
        <div className="h-8 w-20 bg-pk-border/50 rounded-md animate-pulse" />
        <div className="h-8 w-20 bg-pk-border/50 rounded-md animate-pulse" />
      </div>
    </div>
  );
}
