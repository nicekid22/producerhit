import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { MessageCircle, Pause, Play, Sparkles, Star, X } from "lucide-react";
import { StoredLoopCover } from "@/components/cover/StoredLoopCover";
import { ProfileAuthorChip } from "@/components/profile/ProfileAuthorChip";
import { LoopCommentsSection } from "@/components/community/LoopCommentsSection";
import { resolveCommunityDisplayCoverUrl, resolvePublicRowCoverUrl } from "@/lib/coverArt";
import { displayProducerInfluence } from "@/lib/beatInfluence";
import { COVER_SURFACE_CLASS, cn } from "@/lib/utils";
import type { PublicLoopRow } from "@/lib/publicLoops";

type RatingStats = { sum: number; count: number; myRating: number | null };

type Props = {
  open: boolean;
  onClose: () => void;
  row: PublicLoopRow | null;
  isFr: boolean;
  isActive: boolean;
  isPlaying: boolean;
  resolving: boolean;
  rating?: RatingStats;
  commentCount: number;
  userId: string | null;
  focusComments?: boolean;
  onPlay: () => void;
  onRemix: () => void;
  onRate: (stars: number) => void;
  onCommentCountChange: (count: number) => void;
};

export function CommunityTrackSheet({
  open,
  onClose,
  row,
  isFr,
  isActive,
  isPlaying,
  resolving,
  rating,
  commentCount,
  userId,
  focusComments = false,
  onPlay,
  onRemix,
  onRate,
  onCommentCountChange,
}: Props) {
  const commentsRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    scrollRef.current?.scrollTo(0, 0);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, row?.id]);

  useEffect(() => {
    if (!open || !focusComments || !row) return;
    const timer = window.setTimeout(() => {
      commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [open, focusComments, row?.id]);

  if (!open || !row || typeof document === "undefined") return null;

  const coverUrl = resolvePublicRowCoverUrl(row).startsWith("http")
    ? resolvePublicRowCoverUrl(row)
    : resolveCommunityDisplayCoverUrl(row);
  const playingNow = isActive && isPlaying;
  const avg = rating && rating.count > 0 ? (rating.sum / rating.count).toFixed(1) : null;
  const myRating = rating?.myRating ?? 0;
  const producerInfluence = displayProducerInfluence(row.influence);

  return createPortal(
    <div className="pk-community-sheet fixed inset-0 z-[130]" role="dialog" aria-modal="true" aria-label={row.name ?? "Track"}>
      <button
        type="button"
        className="pk-community-sheet__backdrop absolute inset-0"
        onClick={onClose}
        aria-label={isFr ? "Fermer" : "Close"}
      />

      <div className="pk-community-sheet__panel" onClick={(e) => e.stopPropagation()}>
        <div className="pk-community-sheet__header">
          <div className="pk-community-sheet__grab" aria-hidden />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <MessageCircle className="h-4 w-4 shrink-0 text-[var(--pk-community-accent,#67e8f9)]" aria-hidden />
            <span className="truncate text-sm font-semibold text-white">
              {isFr ? "Dans le flux" : "On the feed"}
            </span>
            <span className="pk-community-sheet__live">{isFr ? "LIVE" : "LIVE"}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pk-community-sheet__close"
            aria-label={isFr ? "Fermer" : "Close"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollRef} className="pk-community-sheet__scroll">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onPlay}
              className={cn("pk-community-sheet__cover relative shrink-0 overflow-hidden rounded-xl", COVER_SURFACE_CLASS)}
              aria-label={playingNow ? (isFr ? "Pause" : "Pause") : isFr ? "Écouter" : "Play"}
            >
              <StoredLoopCover coverUrl={coverUrl} className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="pk-community-sheet__play" aria-hidden>
                {playingNow ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" />}
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold leading-snug text-white">{row.name ?? "Untitled"}</h2>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-medium text-white/55">
                {row.genre ? <span className="rounded-full border border-white/10 px-2 py-0.5">{row.genre}</span> : null}
                {producerInfluence ? (
                  <span className="pk-community-card__influence rounded-full px-2 py-0.5">{producerInfluence}</span>
                ) : null}
                {row.mood ? <span>{row.mood}</span> : null}
                {(row.bpm ?? 0) > 0 ? <span>{row.bpm} BPM</span> : null}
              </div>
              {row.author ? (
                <div className="mt-2">
                  <ProfileAuthorChip author={row.author} isFr={isFr} size="sm" />
                </div>
              ) : null}
            </div>
          </div>

          <div className="pk-community-sheet__rating mt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                  {isFr ? "Note la commu" : "Community rating"}
                </p>
                <div className="mt-1.5 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const star = i + 1;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => onRate(star)}
                        className="rounded p-1 transition-colors hover:bg-white/5"
                        aria-label={isFr ? `Noter ${star}/5` : `Rate ${star}/5`}
                      >
                        <Star
                          className={cn(
                            "h-5 w-5",
                            star <= myRating ? "fill-yellow-400 text-yellow-400" : "text-white/20",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              {avg ? (
                <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-sm font-bold text-white">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {avg}
                  <span className="text-[10px] font-medium text-white/45">({rating?.count})</span>
                </div>
              ) : (
                <p className="text-[11px] font-medium text-white/40">{isFr ? "Sois le premier" : "Be the first"}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRemix}
              disabled={resolving}
              className="pk-community-sheet__remix inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Remix
            </button>
            <Link
              to={`/loop/${row.id}`}
              className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-white/75 hover:text-white"
            >
              {isFr ? "Page complète" : "Full page"}
            </Link>
          </div>

          <div ref={commentsRef} className="pk-community-sheet__comments-wrap mt-5">
            <LoopCommentsSection
              loopId={row.id}
              loopOwnerId={row.user_id ?? ""}
              isFr={isFr}
              userId={userId}
              commentCount={commentCount}
              onCommentCountChange={onCommentCountChange}
              feedSheet
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
