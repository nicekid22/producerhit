import { Link } from "react-router-dom";
import { MessageCircle, Pause, Play, Sparkles, Star } from "lucide-react";
import { ProfileAuthorChip } from "@/components/profile/ProfileAuthorChip";
import { StoredLoopCover } from "@/components/cover/StoredLoopCover";
import { publicRowToCoverLoop, resolveCommunityDisplayCoverUrl, resolvePublicRowCoverUrl, isPersistedStorageCoverUrl } from "@/lib/coverArt";
import { useLazyPinterestCover } from "@/hooks/useLazyPinterestCover";
import { UNIFIED_STORED_COVERS } from "@/lib/featureFlags";
import { COVER_SURFACE_CLASS, cn } from "@/lib/utils";
import type { PublicLoopRow } from "@/lib/publicLoops";

type RatingStats = { sum: number; count: number; myRating: number | null };

type Props = {
  row: PublicLoopRow;
  isFr: boolean;
  variant?: "grid" | "rail";
  isActive: boolean;
  isPlaying: boolean;
  resolving: boolean;
  rating?: RatingStats;
  commentCount?: number;
  isNew?: boolean;
  isMine?: boolean;
  onPlay: () => void;
  onRemix: () => void;
  onRate: (stars: number) => void;
  slotIndex?: number;
};

export function CommunityTrackCard({
  row,
  isFr,
  variant = "grid",
  isActive,
  isPlaying,
  resolving,
  rating,
  commentCount = 0,
  isNew,
  isMine,
  onPlay,
  onRemix,
  onRate,
  slotIndex = 0,
}: Props) {
  const loop = publicRowToCoverLoop(row);
  const storedCover = resolvePublicRowCoverUrl(row);
  const needsLazyPinterest = !storedCover.startsWith("http");
  const { ref: coverRef, url: lazyCover } = useLazyPinterestCover(
    { id: row.id, genre: row.genre, mood: row.mood, name: row.name, prompt: row.prompt },
    slotIndex,
    needsLazyPinterest,
  );
  const coverUrl = storedCover.startsWith("http")
    ? storedCover
    : lazyCover?.startsWith("http")
      ? lazyCover
      : resolveCommunityDisplayCoverUrl(row);
  const playingNow = isActive && isPlaying;
  const avg = rating && rating.count > 0 ? (rating.sum / rating.count).toFixed(1) : null;
  const compact = variant === "rail";

  return (
    <article
      ref={coverRef}
      className={[
        "pk-community-card group",
        compact ? "pk-community-card--rail" : "pk-community-card--grid",
        playingNow ? "pk-community-card--playing" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onPlay}
        className="pk-community-card__cover-btn w-full text-left"
        aria-label={playingNow ? (isFr ? `Pause ${row.name}` : `Pause ${row.name}`) : isFr ? `Écouter ${row.name}` : `Play ${row.name}`}
      >
        <div className={cn("pk-community-card__cover relative overflow-hidden rounded-2xl", COVER_SURFACE_CLASS)}>
          <StoredLoopCover coverUrl={coverUrl} className="absolute inset-0 h-full w-full" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {row.genre ? (
              <span className="rounded-full border border-white/15 bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                {row.genre}
              </span>
            ) : null}
            {isMine ? (
              <span className="pk-accent-badge rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                {isFr ? "Ton son" : "Yours"}
              </span>
            ) : null}
            {isNew ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {isFr ? "Nouveau" : "New"}
              </span>
            ) : null}
          </div>
          <div className="pk-community-card__play-wrap">
            <span
              className={cn(
                "pk-community-card__play",
                resolving && "pk-community-card__play--loading",
                playingNow && "pk-community-card__play--active",
              )}
              aria-hidden
            >
              <span className="pk-community-card__play-icon">
                {playingNow ? (
                  <Pause className="h-4 w-4" fill="currentColor" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
                )}
              </span>
            </span>
          </div>
        </div>
      </button>

      <div className="pk-community-card__body mt-3 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-white">{row.name ?? "Untitled"}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-white/50">
              {row.mood ? <span>{row.mood}</span> : null}
              {(row.bpm ?? 0) > 0 ? (
                <>
                  {row.mood ? <span aria-hidden>·</span> : null}
                  <span>{row.bpm} BPM</span>
                </>
              ) : null}
            </div>
            {row.author ? (
              <div className="mt-2">
                <ProfileAuthorChip author={row.author} isFr={isFr} size="sm" hideAvatar />
              </div>
            ) : null}
          </div>
          {avg ? (
            <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold text-white/80">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {avg}
            </div>
          ) : null}
        </div>

        {!compact ? (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const star = i + 1;
                  const my = rating?.myRating ?? 0;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => onRate(star)}
                      className="rounded p-0.5 transition-colors hover:bg-white/5"
                      aria-label={isFr ? `Noter ${star}/5` : `Rate ${star}/5`}
                    >
                      <Star className={star <= my ? "h-3.5 w-3.5 fill-yellow-400 text-yellow-400" : "h-3.5 w-3.5 text-white/20"} />
                    </button>
                  );
                })}
              </div>
              <Link
                to={`/loop/${row.id}#comments`}
                className="pk-accent-link inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {commentCount > 0
                  ? commentCount
                  : isFr
                    ? "Commenter"
                    : "Comment"}
              </Link>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onRemix}
                disabled={resolving}
                className="pk-community-card__remix-btn inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-white/75 transition-colors hover:text-white disabled:opacity-50"
              >
                <Sparkles className="pk-community-card__remix-icon h-3 w-3" />
                Remix
              </button>
              <Link
                to={`/loop/${row.id}`}
                className="inline-flex h-8 items-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-white/75 transition-colors hover:border-white/20 hover:text-white"
              >
                {isFr ? "Voir" : "View"}
              </Link>
            </div>
          </div>
        ) : commentCount > 0 ? (
          <Link
            to={`/loop/${row.id}#comments`}
            className="pk-accent-link mt-2 inline-flex items-center gap-1 text-[10px] font-semibold"
          >
            <MessageCircle className="h-3 w-3" />
            {commentCount}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
