import { useMemo } from "react";
import { Info, MessageCircle, Pause, Play, Sparkles, Star } from "lucide-react";
import { ProfileAuthorChip } from "@/components/profile/ProfileAuthorChip";
import { StoredLoopCover } from "@/components/cover/StoredLoopCover";
import { resolveCommunityDisplayCoverUrl, resolvePublicRowCoverUrl } from "@/lib/coverArt";
import { displayProducerInfluence } from "@/lib/beatInfluence";
import { useLazyPinterestCover } from "@/hooks/useLazyPinterestCover";
import { COVER_SURFACE_CLASS, cn } from "@/lib/utils";
import type { PublicLoopRow } from "@/lib/publicLoops";
import type { AppLocale } from "@/i18n/config";
import { buildCommunityHubUiCopy } from "@/i18n/communityHubUiCatalog";
import { buildPublicLoopPageCopy } from "@/i18n/publicLoopPageCatalog";

type RatingStats = { sum: number; count: number; myRating: number | null };

type Props = {
  row: PublicLoopRow;
  locale: AppLocale;
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
  onOpenDetail?: (focusComments?: boolean) => void;
  slotIndex?: number;
};

function CardSocialFooter({
  compact,
  locale,
  rating,
  commentCount,
  resolving,
  onRate,
  onRemix,
  onOpenDetail,
}: {
  compact: boolean;
  locale: AppLocale;
  rating?: RatingStats;
  commentCount: number;
  resolving: boolean;
  onRate: (stars: number) => void;
  onRemix: () => void;
  onOpenDetail?: (focusComments?: boolean) => void;
}) {
  const hub = useMemo(() => buildCommunityHubUiCopy(locale), [locale]);
  const loop = useMemo(() => buildPublicLoopPageCopy(locale), [locale]);
  const my = rating?.myRating ?? 0;
  const avg = rating && rating.count > 0 ? (rating.sum / rating.count).toFixed(1) : null;

  return (
    <div
      className={cn(
        "pk-community-card__social",
        compact ? "pk-community-card__social--rail" : "pk-community-card__social--grid",
      )}
    >
      <div className="pk-community-card__stars-row">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const star = i + 1;
            return (
              <button
                key={star}
                type="button"
                onClick={() => onRate(star)}
                className="rounded p-0.5 transition-colors hover:bg-white/5"
                aria-label={loop.rateStar(star)}
              >
                <Star
                  className={cn(
                    compact ? "h-3 w-3" : "h-3.5 w-3.5",
                    star <= my ? "fill-yellow-400 text-yellow-400" : "text-white/22",
                  )}
                />
              </button>
            );
          })}
        </div>
        {avg ? (
          <span className="pk-community-card__avg">
            <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" aria-hidden />
            {avg}
          </span>
        ) : null}
      </div>

      <div className="pk-community-card__actions">
        <button
          type="button"
          onClick={() => onOpenDetail?.(true)}
          className="pk-community-card__action pk-community-card__action--comment"
          aria-label={hub.comment}
          title={hub.comment}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {commentCount > 0 ? <span>{commentCount}</span> : null}
        </button>
        <button
          type="button"
          onClick={onRemix}
          disabled={resolving}
          className="pk-community-card__action pk-community-card__action--remix"
          aria-label="Remix"
          title="Remix"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onOpenDetail?.(false)}
          className="pk-community-card__action"
          aria-label={hub.open}
          title={hub.open}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function CommunityTrackCard({
  row,
  locale,
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
  onOpenDetail,
  slotIndex = 0,
}: Props) {
  const hub = useMemo(() => buildCommunityHubUiCopy(locale), [locale]);
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
  const producerInfluence = displayProducerInfluence(row.influence);
  const playingNow = isActive && isPlaying;
  const compact = variant === "rail";
  const trackName = row.name ?? hub.untitled;

  return (
    <article
      ref={coverRef}
      className={cn(
        "pk-community-card group",
        compact ? "pk-community-card--rail" : "pk-community-card--grid",
        playingNow && "pk-community-card--playing",
      )}
    >
      <button
        type="button"
        onClick={onPlay}
        className="pk-community-card__cover-btn w-full text-left"
        aria-label={playingNow ? hub.ariaPause(trackName) : hub.ariaPlay(trackName)}
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
            {producerInfluence ? (
              <span className="pk-community-card__influence rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                {producerInfluence}
              </span>
            ) : null}
            {isMine ? (
              <span className="pk-accent-badge rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                {hub.yours}
              </span>
            ) : null}
            {isNew ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {hub.badgeNew}
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
        <button type="button" onClick={() => onOpenDetail?.(false)} className="w-full text-left">
          <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-[var(--pk-community-accent,#a5f3fc)]">
            {trackName}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-white/50">
            {producerInfluence ? (
              <span className="text-[var(--pk-community-accent,#a5f3fc)]/90">{producerInfluence}</span>
            ) : null}
            {row.mood ? (
              <>
                {producerInfluence ? <span aria-hidden>·</span> : null}
                <span>{row.mood}</span>
              </>
            ) : null}
            {(row.bpm ?? 0) > 0 ? (
              <>
                {row.mood ? <span aria-hidden>·</span> : null}
                <span>{row.bpm} BPM</span>
              </>
            ) : null}
          </div>
        </button>
        {row.author ? (
          <div className="mt-2">
            <ProfileAuthorChip author={row.author} locale={locale} size="sm" hideAvatar />
          </div>
        ) : null}

        <CardSocialFooter
          compact={compact}
          locale={locale}
          rating={rating}
          commentCount={commentCount}
          resolving={resolving}
          onRate={onRate}
          onRemix={onRemix}
          onOpenDetail={onOpenDetail}
        />
      </div>
    </article>
  );
}
