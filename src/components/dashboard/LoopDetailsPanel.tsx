import toast from "react-hot-toast";
import { useMemo } from "react";
import { Clock, Copy, Gauge, Info, KeyRound, Loader2, Sigma } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CoverMedia } from "@/components/CoverMedia";
import { isCoverVideo } from "@/lib/coverMedia";
import { coverImageKeyFromLoop, isPersistedStorageCoverUrl, resolveLoopDisplayCoverUrl } from "@/lib/coverArt";
import { cn, COVER_SURFACE_CLASS } from "@/lib/utils";
import type { Loop } from "@/types/loop";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function LoopDetailsPanel({
  loop,
  locale,
  detailsTitle,
  onDetailsTitleChange,
  savingDetailsTitle,
  onSaveTitle,
  durationSec,
  className,
  isPlayingCover = false,
  compact = false,
}: {
  loop: Loop;
  locale: "fr" | "en";
  detailsTitle: string;
  onDetailsTitleChange: (value: string) => void;
  savingDetailsTitle: boolean;
  onSaveTitle: () => void;
  durationSec?: number | null;
  className?: string;
  /** Cover animée vintage si ce morceau est en lecture */
  isPlayingCover?: boolean;
  /** Mobile bottom sheet — tighter spacing, taller lyrics area */
  compact?: boolean;
}) {
  const isFr = locale === "fr";
  const dur =
    (loop.details?.duration ?? durationSec) as number | null | undefined;
  const durationLabel =
    typeof dur === "number" && isFinite(dur) && dur > 0 ? formatTime(dur) : "—";
  const coverUrl = useMemo(() => resolveLoopDisplayCoverUrl(loop, 768), [loop]);
  const coverKey = useMemo(() => coverImageKeyFromLoop(loop), [loop]);
  const isVideoCover = isCoverVideo(loop, coverUrl);
  const usePhotoCover = !isVideoCover && coverUrl.startsWith("http");

  return (
    <div className={cn("pk-loop-details-panel", className)}>
      <div className={cn("overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]", compact ? "mt-1" : "mt-4")}>
        <div
          className={cn(
            "relative w-full overflow-hidden",
            COVER_SURFACE_CLASS,
            compact ? "aspect-[4/3] max-h-[220px]" : "aspect-square",
          )}
        >
          {usePhotoCover ? (
            <CoverMedia loop={loop} coverUrl={coverUrl} coverKey={coverKey} imageClassName="object-cover" />
          ) : (
            <CoverMedia loop={loop} coverUrl={coverUrl} coverKey={coverKey} imageClassName="object-contain" />
          )}
        </div>
      </div>

      <div className={cn("grid grid-cols-2 gap-2 text-xs", compact ? "mt-3" : "mt-4")}>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5">
          <div className="pk-loop-details-stat-label flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5" />
            BPM
          </div>
          <div className="mt-1 font-semibold text-pk-text">
            {typeof loop.details?.bpm === "number" && loop.details.bpm > 0 ? loop.details.bpm : "—"}
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5">
          <div className="pk-loop-details-stat-label flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {isFr ? "Durée" : "Duration"}
          </div>
          <div className="mt-1 font-semibold text-pk-text">{durationLabel}</div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5">
          <div className="pk-loop-details-stat-label flex items-center gap-1">
            <KeyRound className="h-3.5 w-3.5" />
            {isFr ? "Tonalité" : "Key"}
          </div>
          <div className="mt-1 font-semibold text-pk-text">{loop.details?.keyScale || "—"}</div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5">
          <div className="pk-loop-details-stat-label flex items-center gap-1">
            <Sigma className="h-3.5 w-3.5" />
            {isFr ? "Signature" : "Time Sig"}
          </div>
          <div className="mt-1 font-semibold text-pk-text">{loop.details?.timeSignature || "—"}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-pk-text">
          <Info className="pk-loop-details-stat-label h-4 w-4" />
          {isFr ? "Détails" : "Details"}
        </div>
        <div className="mt-2 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-xs text-pk-text">
          {loop.details?.caption || loop.prompt || "—"}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-pk-text">{isFr ? "Paroles" : "Lyrics"}</div>
          <Button
            variant="secondary"
            size="sm"
            disabled={!loop.details?.lyrics?.trim()}
            onClick={() => {
              const text = loop.details?.lyrics?.trim() ?? "";
              if (!text) return;
              void (async () => {
                try {
                  await navigator.clipboard.writeText(text);
                  toast.success(isFr ? "Paroles copiées" : "Lyrics copied");
                } catch {
                  toast.error(isFr ? "Copie impossible" : "Copy failed");
                }
              })();
            }}
            aria-label={isFr ? "Copier les paroles" : "Copy lyrics"}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <pre
          className={cn(
            "mt-2 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-xs text-pk-text",
            compact ? "max-h-52" : "max-h-40",
          )}
        >
          {loop.details?.lyrics?.trim() ? loop.details.lyrics.trim() : "—"}
        </pre>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold text-pk-text">{isFr ? "Titre" : "Title"}</div>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={detailsTitle}
            onChange={(e) => onDetailsTitleChange(e.target.value)}
            className="w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm font-semibold text-pk-text outline-none placeholder:text-pk-muted focus:border-pk-accent"
            placeholder={isFr ? "Titre…" : "Title…"}
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={savingDetailsTitle || detailsTitle.trim().length === 0 || detailsTitle.trim() === loop.name}
            onClick={onSaveTitle}
          >
            {savingDetailsTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : isFr ? "OK" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
