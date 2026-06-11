import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import type { PublicLoopRow } from "@/lib/publicLoops";
import { CommunityTrackCard } from "@/components/community/CommunityTrackCard";

type RatingStats = { sum: number; count: number; myRating: number | null };

type Props = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  items: PublicLoopRow[];
  isFr: boolean;
  currentId: string | null;
  isPlaying: boolean;
  resolvingId: string | null;
  ratingsById: Record<string, RatingStats>;
  commentsById: Record<string, number>;
  isNew: (createdAt: string) => boolean;
  isMineRow?: (row: PublicLoopRow) => boolean;
  onPlay: (row: PublicLoopRow, index: number) => void;
  onRemix: (row: PublicLoopRow) => void;
  onRate: (loopId: string, stars: number) => void;
  onSeeAll?: () => void;
};

export function CommunityRail({
  title,
  subtitle,
  icon,
  items,
  isFr,
  currentId,
  isPlaying,
  resolvingId,
  ratingsById,
  commentsById,
  isNew,
  isMineRow,
  onPlay,
  onRemix,
  onRate,
  onSeeAll,
}: Props) {
  if (!items.length) return null;

  return (
    <section className="pk-community-rail">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-base font-semibold text-white">
            {icon}
            {title}
          </div>
          {subtitle ? <p className="mt-0.5 text-[11px] font-medium text-white/40">{subtitle}</p> : null}
        </div>
        {onSeeAll ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="pk-accent-link pk-accent-link--bright inline-flex items-center gap-1 text-xs font-semibold"
          >
            {isFr ? "Tout voir" : "See all"}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div className="pk-community-rail__track mt-3">
        {items.map((row, idx) => (
          <CommunityTrackCard
            key={row.id}
            row={row}
            isFr={isFr}
            variant="rail"
            isActive={currentId === row.id}
            isPlaying={isPlaying}
            resolving={resolvingId === row.id}
            rating={ratingsById[row.id]}
            commentCount={commentsById[row.id] ?? 0}
            isNew={row.created_at ? isNew(row.created_at) : false}
            isMine={isMineRow?.(row)}
            onPlay={() => onPlay(row, idx)}
            onRemix={() => onRemix(row)}
            onRate={(stars) => onRate(row.id, stars)}
            slotIndex={idx}
          />
        ))}
      </div>
    </section>
  );
}
