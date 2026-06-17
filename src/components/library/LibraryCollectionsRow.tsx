import type { LucideIcon } from "lucide-react";
import { Disc3, ListMusic, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LibraryCollection } from "@/lib/libraryCurations";

type Props = {
  collection: LibraryCollection;
  isFr: boolean;
  active: boolean;
  onSelect: (id: string | null) => void;
};

export function LibraryCollectionCard({ collection, isFr, active, onSelect }: Props) {
  const title = isFr ? collection.titleFr : collection.titleEn;
  const subtitle = isFr ? collection.subtitleFr : collection.subtitleEn;
  const isMixtape = collection.kind === "mixtape";
  const kindLabel = isMixtape ? (isFr ? "Mixtape" : "Mixtape") : isFr ? "Playlist" : "Playlist";
  const KindIcon = isMixtape ? Disc3 : ListMusic;

  return (
    <button
      type="button"
      className={cn(
        "pk-library-collection-card",
        `pk-library-collection-card--${collection.element}`,
        isMixtape && "pk-library-collection-card--mixtape",
        active && "pk-library-collection-card--active",
      )}
      onClick={() => onSelect(active ? null : collection.id)}
      aria-pressed={active}
    >
      <span
        className="pk-library-collection-card__cover"
        data-pk-cover-variant={collection.coverVariant}
        aria-hidden
      >
        <span className="pk-library-collection-card__cover-bloom" />
        <span className="pk-library-collection-card__cover-mesh" />
        <span className="pk-library-collection-card__cover-grain" />
        <span className="pk-library-collection-card__cover-shine" />
        <span className="pk-library-collection-card__kind-badge">
          <KindIcon className="h-4 w-4" aria-hidden />
        </span>
        <span className="pk-library-collection-card__play">
          <Play className="h-3.5 w-3.5 fill-current" />
        </span>
      </span>
      <span className="pk-library-collection-card__meta">
        <span className="pk-library-collection-card__kind">{kindLabel}</span>
        <span className="pk-library-collection-card__title">{title}</span>
        <span className="pk-library-collection-card__subtitle">{subtitle}</span>
        <span className="pk-library-collection-card__count">
          {collection.trackCount} {isFr ? "morceaux" : "tracks"}
        </span>
      </span>
    </button>
  );
}

type RowProps = {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  collections: LibraryCollection[];
  activeId: string | null;
  isFr: boolean;
  onSelect: (id: string | null) => void;
};

export function LibraryCollectionsRow({ title, subtitle, icon: RowIcon, collections, activeId, isFr, onSelect }: RowProps) {
  if (!collections.length) return null;

  return (
    <section className="pk-library-collections-row">
      <div className="pk-library-collections-row__head">
        <div className="pk-library-collections-row__title-wrap">
          <span className="pk-library-collections-row__icon" aria-hidden>
            <RowIcon className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="pk-library-collections-row__title">{title}</h2>
            {subtitle ? <p className="pk-library-collections-row__subtitle">{subtitle}</p> : null}
          </div>
        </div>
      </div>
      <div className="pk-library-collections-scroll">
        {collections.map((c) => (
          <LibraryCollectionCard
            key={c.id}
            collection={c}
            isFr={isFr}
            active={activeId === c.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
