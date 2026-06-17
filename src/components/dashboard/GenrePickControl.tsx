import { useMemo } from "react";
import type { AppLocale } from "@/i18n/config";
import { Dropdown } from "@/components/ui/Dropdown";
import { GenreOptionIcon } from "@/lib/genres/genreIcons";
import { buildPrecisionGenreOptions } from "@/lib/genres/genreMenuOrder";
import {
  FROM_IDEA_GENRE_VALUE,
  genreSelectionHint,
  isFromIdeaGenreSelection,
  isRandomGenreSelection,
  RANDOM_GENRE_VALUE,
} from "@/lib/genres/genrePickMode";
import { cn } from "@/lib/utils";

type GenrePickProps = {
  locale: AppLocale;
  genre: string;
  onGenreChange: (genre: string) => void;
  lastRandomGenre?: string;
  /** Idée / prompt rempli — adapte le libellé d'aide. */
  ideaFilled?: boolean;
  compact?: boolean;
};

export function GenrePickControl({
  locale,
  genre,
  onGenreChange,
  lastRandomGenre,
  ideaFilled = false,
  compact = false,
}: GenrePickProps) {
  const isFr = locale === "fr";

  const genreOptions = useMemo(() => {
    return buildPrecisionGenreOptions(locale).map((o) => ({
      ...o,
      icon: <GenreOptionIcon value={o.value} group={o.group} />,
    }));
  }, [locale]);

  const dropdownValue = isRandomGenreSelection(genre)
    ? RANDOM_GENRE_VALUE
    : isFromIdeaGenreSelection(genre)
      ? FROM_IDEA_GENRE_VALUE
      : genre;

  return (
    <div className={cn("min-w-0 max-w-full", compact ? "gap-2" : "gap-2.5")}>
      <Dropdown
        label={compact ? undefined : isFr ? "Genre" : "Genre"}
        menuTitle={isFr ? "Genre" : "Genre"}
        value={dropdownValue}
        onChange={onGenreChange}
        options={genreOptions}
        placeholder={isFr ? "Sélectionner…" : "Select…"}
      />
      {compact ? null : (
        <p className="text-[11px] leading-relaxed text-pk-muted">
          {genreSelectionHint(genre, locale, ideaFilled, lastRandomGenre)}
        </p>
      )}
    </div>
  );
}
