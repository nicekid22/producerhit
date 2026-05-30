import { Loader2, Pause, Play, Shuffle, Sparkles } from "lucide-react";
import { ProfileAuthorChip } from "@/components/profile/ProfileAuthorChip";
import { publicRowToCoverLoop, resolveCoverImageUrl } from "@/lib/coverArt";
import { coverGradient } from "@/lib/utils";
import type { PublicLoopRow } from "@/lib/publicLoops";

type Props = {
  row: PublicLoopRow;
  isFr: boolean;
  isActive: boolean;
  isPlaying: boolean;
  resolving: boolean;
  onPlay: () => void;
  onShuffle: () => void;
  onRemix: () => void;
};

export function CommunityFeatured({
  row,
  isFr,
  isActive,
  isPlaying,
  resolving,
  onPlay,
  onShuffle,
  onRemix,
}: Props) {
  const loop = publicRowToCoverLoop(row);
  const bg = coverGradient(loop);
  const coverUrl = resolveCoverImageUrl(loop);
  const playingNow = isActive && isPlaying;

  return (
    <section className="pk-community-featured">
      <div className="pk-community-featured__glow" aria-hidden />
      <div className="relative z-[1] flex flex-col gap-5 md:flex-row md:items-center">
        <button
          type="button"
          onClick={onPlay}
          className="pk-community-featured__cover group relative shrink-0 overflow-hidden rounded-2xl border border-white/10 text-left"
          style={{ background: bg }}
        >
          <img
            src={coverUrl}
            alt=""
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:scale-[1.03]"
            onLoad={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur-md">
              {playingNow ? <Pause className="h-6 w-6" fill="currentColor" /> : <Play className="ml-0.5 h-6 w-6" fill="currentColor" />}
            </span>
          </div>
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
            {isFr ? "À la une" : "Featured"}
          </p>
          <h2 className="mt-2 truncate text-2xl font-bold tracking-tight text-white md:text-3xl">{row.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/55">
            {row.genre ? <span className="pk-prism-vibe-chip">{row.genre}</span> : null}
            {row.mood ? <span className="pk-prism-vibe-chip">{row.mood}</span> : null}
            {(row.bpm ?? 0) > 0 ? <span className="pk-prism-vibe-chip">{row.bpm} BPM</span> : null}
          </div>
          {row.author ? (
            <div className="mt-3">
              <ProfileAuthorChip author={row.author} isFr={isFr} />
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onPlay}
              disabled={resolving}
              className="pk-prism-btn inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60"
            >
              {resolving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : playingNow ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="h-4 w-4" fill="currentColor" />
              )}
              {playingNow ? (isFr ? "Pause" : "Pause") : isFr ? "Écouter" : "Play"}
            </button>
            <button
              type="button"
              onClick={onShuffle}
              className="pk-glass-btn pk-glass-btn--ghost inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
            >
              <Shuffle className="h-4 w-4" />
              Shuffle
            </button>
            <button
              type="button"
              onClick={onRemix}
              disabled={resolving}
              className="pk-glass-btn pk-glass-btn--ghost inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 text-cyan-300" />
              Remix
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
