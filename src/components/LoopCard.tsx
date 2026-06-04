import { Bookmark, Download, RefreshCcw, Play, Pause, Loader2 } from "lucide-react";
import { cn, COVER_SURFACE_CLASS } from "@/lib/utils";
import { coverImageKeyFromLoop, resolveLoopDisplayCoverUrl } from "@/lib/coverArt";
import { loopCardClass, loopCoverClass, loopPlayButtonClass, loopToggleButtonClass } from "@/lib/loopCardUi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Loop } from "@/types/loop";
import { WaveformVisualizer } from "@/components/WaveformVisualizer";

export function LoopCard({
  loop,
  isActive,
  isPlaying,
  progress,
  durationLabel,
  onPlayPause,
  onSeek,
  onSave,
  onDownloadWav,
  onRegenerate,
  onDelete,
  isDownloading,
}: {
  loop: Loop;
  isActive: boolean;
  isPlaying: boolean;
  progress: number;
  durationLabel: string;
  onPlayPause: () => void;
  onSeek: (pct: number) => void;
  onSave: () => void;
  onDownloadWav: () => void;
  onRegenerate: () => void;
  onDelete?: () => void;
  isDownloading?: boolean;
}) {
  return (
    <div className={cn("rounded-pk border border-pk-border bg-pk-panel p-4", loopCardClass(isActive, isActive && isPlaying))}>
      <div className="flex gap-3">
        <div
          className={cn(
            "relative h-12 w-12 shrink-0 rounded-pk p-[2px]",
            loopCoverClass(isActive, isActive && isPlaying),
          )}
          aria-hidden
        >
          <div className={cn("relative h-full w-full overflow-hidden rounded-[6px]", COVER_SURFACE_CLASS)}>
          {resolveLoopDisplayCoverUrl(loop).startsWith("http") ? (
          <img
            key={coverImageKeyFromLoop(loop)}
            src={resolveLoopDisplayCoverUrl(loop)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            style={{ display: "block", opacity: 0 }}
            onLoad={(e) => {
              e.currentTarget.style.display = "block";
              e.currentTarget.style.opacity = "1";
              e.currentTarget.dataset.retry = "0";
            }}
            onError={(e) => {
              const img = e.currentTarget;
              img.style.opacity = "0";
              const retry = Number(img.dataset.retry ?? "0");
              if (retry < 4) {
                img.dataset.retry = String(retry + 1);
                const url = resolveLoopDisplayCoverUrl(loop);
                window.setTimeout(() => {
                  img.style.display = "block";
                  img.style.opacity = "0";
                  img.src = "";
                  img.src = url;
                }, 800 * (retry + 1));
                return;
              }
              img.style.display = "none";
            }}
          />
          ) : null}
          </div>
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{loop.name}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>{loop.genre}</Badge>
            <Badge variant="muted">{loop.mood}</Badge>
            <Badge variant="muted">{loop.bpm} BPM</Badge>
          </div>
          <div className="mt-2 text-xs text-pk-muted">
            {loop.key} {loop.scale}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <WaveformVisualizer isPlaying={isActive && isPlaying} barCount={40} />
      </div>

      <div
        className="mt-2 h-2 w-full cursor-pointer rounded-full bg-black/30"
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          onSeek(pct);
        }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div className="h-2 rounded-full bg-pk-accent" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-pk-muted">
        <div>{loop.loopLength}</div>
        <div>{durationLabel}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          className={loopPlayButtonClass(isActive, isActive && isPlaying)}
          onClick={onPlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className={loopToggleButtonClass(loop.isSaved)}
          onClick={onSave}
          title={loop.isSaved ? "Unsave" : "Save"}
          aria-pressed={loop.isSaved}
        >
          <Bookmark className={cn("h-4 w-4", loop.isSaved && "fill-current")} />
          Save
        </Button>
        <Button variant="secondary" size="sm" onClick={onDownloadWav} disabled={isDownloading} title="Download">
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download
        </Button>
        <Button variant="ghost" size="sm" onClick={onRegenerate} title="Regenerate">
          <RefreshCcw className="h-4 w-4" />
          Variation
        </Button>
        {onDelete ? (
          <Button variant="danger" size="sm" onClick={onDelete} title="Delete">
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}

