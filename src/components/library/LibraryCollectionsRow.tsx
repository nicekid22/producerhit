import type { LucideIcon } from "lucide-react";
import { Disc3, ListMusic, Play } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import {
  buildLibrarySection,
  libraryCollectionSubtitle,
  libraryCollectionTitle,
} from "@/i18n/libraryCatalog";
import { cn } from "@/lib/utils";
import type { LibraryCollection } from "@/lib/libraryCurations";

type Props = {
  collection: LibraryCollection;
  locale: AppLocale;
  active: boolean;
  onSelect: (id: string | null) => void;
};

export function LibraryCollectionCard({ collection, locale, active, onSelect }: Props) {
  const lb = buildLibrarySection(locale);
  const title = libraryCollectionTitle(collection, locale);
  const subtitle = libraryCollectionSubtitle(collection, locale);
  const isMixtape = collection.kind === "mixtape";
  const kindLabel = isMixtape ? lb.kindMixtape : lb.kindPlaylist;
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
          {collection.trackCount} {lb.trackCount}
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
  locale: AppLocale;
  onSelect: (id: string | null) => void;
};

export function LibraryCollectionsRow({ title, subtitle, icon: RowIcon, collections, activeId, locale, onSelect }: RowProps) {
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
            locale={locale}
            active={activeId === c.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
