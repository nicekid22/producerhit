import { useMemo } from "react";
import { Dropdown } from "@/components/ui/Dropdown";
import { GenreOptionIcon } from "@/lib/genres/genreIcons";
import {
  genrePickModeHint,
  isRandomGenreSelection,
  precisionGenreOptions,
  RANDOM_GENRE_VALUE,
  type GenrePickMode,
} from "@/lib/genres/genrePickMode";
import { cn } from "@/lib/utils";

type Props = {
  locale: "en" | "fr";
  mode: GenrePickMode;
  onModeChange: (mode: GenrePickMode) => void;
  genre: string;
  onGenreChange: (genre: string) => void;
  lastRandomGenre?: string;
  /** Masque labels et texte d’aide — section titre suffit. */
  compact?: boolean;
};

const modes: { id: GenrePickMode; fr: string; en: string }[] = [
  { id: "custom", fr: "Custom", en: "Custom" },
  { id: "auto", fr: "Auto", en: "Auto" },
];

export function GenrePickControl({ locale, mode, onModeChange, genre, onGenreChange, lastRandomGenre, compact = false }: Props) {
  const isFr = locale === "fr";

  const genreOptions = useMemo(() => {
    return precisionGenreOptions(locale).map((o) => ({
      ...o,
      icon: <GenreOptionIcon value={o.value} group={o.group} />,
    }));
  }, [locale]);

  const dropdownValue =
    mode === "custom"
      ? isRandomGenreSelection(genre) || !genre || genre === "Auto"
        ? RANDOM_GENRE_VALUE
        : genre
      : RANDOM_GENRE_VALUE;

  return (
    <div className={cn("grid", compact ? "gap-2.5" : "gap-3")}>
      <div>
        {compact ? null : <div className="text-xs text-pk-muted">{isFr ? "Genre" : "Genre"}</div>}
        <div className={cn("flex flex-wrap gap-2", compact ? "" : "mt-2")}>
          {modes.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onModeChange(m.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent"
                    : "border-pk-border bg-pk-bg text-pk-muted hover:bg-white/5 hover:text-pk-text",
                )}
              >
                {isFr ? m.fr : m.en}
              </button>
            );
          })}
        </div>
        {compact ? null : (
          <p className="mt-2 text-[11px] leading-relaxed text-pk-muted">{genrePickModeHint(mode, locale, lastRandomGenre)}</p>
        )}
      </div>

      {mode === "custom" ? (
        <Dropdown
          label={compact ? undefined : isFr ? "Genre précis" : "Exact genre"}
          menuTitle={isFr ? "Genre" : "Genre"}
          value={dropdownValue}
          onChange={onGenreChange}
          options={genreOptions}
          placeholder={isFr ? "Sélectionner…" : "Select…"}
        />
      ) : null}
    </div>
  );
}
