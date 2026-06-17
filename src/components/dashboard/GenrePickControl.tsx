import { useMemo } from "react";
import type { AppLocale } from "@/i18n/config";
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

type GenrePickProps = {
  locale: AppLocale;
  mode: GenrePickMode;
  genre: string;
  onGenreChange: (genre: string) => void;
  lastRandomGenre?: string;
  /** Masque le label — section titre suffit. */
  compact?: boolean;
};

/** Sélecteur genre précis / Aléatoire — sans toggle Custom·Auto (voir GenreAutoModeToggle en avancé). */
export function GenrePickControl({ locale, mode, genre, onGenreChange, lastRandomGenre, compact = false }: GenrePickProps) {
  const isFr = locale === "fr";

  const genreOptions = useMemo(() => {
    return precisionGenreOptions(locale).map((o) => ({
      ...o,
      icon: <GenreOptionIcon value={o.value} group={o.group} />,
    }));
  }, [locale]);

  if (mode === "auto") {
    return (
      <div
        className={cn(
          "rounded-pk border border-pk-border/80 bg-pk-bg/40 px-3 py-2.5",
          compact ? "text-[11px]" : "text-xs",
        )}
      >
        <p className="font-semibold text-pk-text">{isFr ? "Genre · Auto" : "Genre · Auto"}</p>
        <p className="mt-1 leading-relaxed text-pk-muted">{genrePickModeHint("auto", locale, lastRandomGenre)}</p>
      </div>
    );
  }

  const dropdownValue =
    isRandomGenreSelection(genre) || !genre || genre === "Auto" ? RANDOM_GENRE_VALUE : genre;

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
        <p className="text-[11px] leading-relaxed text-pk-muted">{genrePickModeHint("custom", locale, lastRandomGenre)}</p>
      )}
    </div>
  );
}

type AutoToggleProps = {
  locale: AppLocale;
  mode: GenrePickMode;
  onModeChange: (mode: GenrePickMode) => void;
};

/** Toggle Custom / Auto — uniquement dans les options avancées. */
export function GenreAutoModeToggle({ locale, mode, onModeChange }: AutoToggleProps) {
  const isFr = locale === "fr";
  const options: { id: GenrePickMode; fr: string; en: string }[] = [
    { id: "custom", fr: "Custom", en: "Custom" },
    { id: "auto", fr: "Auto", en: "Auto" },
  ];

  return (
    <div className="min-w-0">
      <div className="pk-gen-inline-toggle-row mb-2 flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0 shrink text-xs text-pk-muted">{isFr ? "Choix du genre" : "Genre picking"}</div>
        <div className="flex shrink-0 items-center rounded-full border border-pk-border bg-pk-bg p-0.5">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onModeChange(opt.id)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors",
                mode === opt.id ? "bg-pk-accent text-white" : "text-pk-muted hover:text-pk-text",
              )}
            >
              {isFr ? opt.fr : opt.en}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] leading-relaxed text-pk-muted">
        {mode === "auto"
          ? isFr
            ? "L’IA choisit le style à partir de ton idée — sans genre imposé du menu."
            : "AI picks style from your idea — no fixed catalog genre."
          : isFr
            ? "Genre précis du catalogue ou Aléatoire à chaque génération."
            : "Exact catalog genre or Random each generation."}
      </p>
    </div>
  );
}
