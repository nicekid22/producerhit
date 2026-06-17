import { useCallback, useEffect, useState } from "react";
import { GenrePickControl } from "@/components/dashboard/GenrePickControl";
import { GeneratorSection } from "@/components/dashboard/GeneratorSection";
import type { PanelGenerateBridge } from "@/components/dashboard/panelGenerateBridge";
import { SpeechDictationField } from "@/components/SpeechDictationField";
import type { AppLocale } from "@/i18n/config";
import { isCatalogGenreSelection, isFromIdeaGenreSelection, isRandomGenreSelection } from "@/lib/genres/genrePickMode";

const COVER_LYRICS_ROWS = 10;

type Props = {
  locale: AppLocale;
  genre: string;
  lastRandomGenre: string | null;
  onGenreChange: (genre: string) => void;
  generating: boolean;
  remaining: number;
  compactSections?: boolean;
  onGenerateBridgeChange?: (state: PanelGenerateBridge | null) => void;
  onGenerate: (input: { lyrics: string; styleHint: string }) => void;
};

export function CoverStudioPanel({
  locale,
  genre,
  lastRandomGenre,
  onGenreChange,
  generating,
  remaining,
  compactSections = false,
  onGenerateBridgeChange,
  onGenerate,
}: Props) {
  const isFr = locale === "fr";
  const [lyrics, setLyrics] = useState("");
  const [styleHint, setStyleHint] = useState("");

  const genreReady =
    isCatalogGenreSelection(genre) || isRandomGenreSelection(genre) || isFromIdeaGenreSelection(genre);
  const lyricsReady = lyrics.trim().length >= 24;
  const canSubmit = genreReady && lyricsReady && remaining > 0 && !generating;

  const runGenerate = useCallback(() => {
    if (!canSubmit) return;
    onGenerate({ lyrics: lyrics.trim(), styleHint: styleHint.trim() });
  }, [canSubmit, lyrics, onGenerate, styleHint]);

  useEffect(() => {
    if (!onGenerateBridgeChange) return;
    onGenerateBridgeChange({
      canSubmit,
      generating,
      submit: runGenerate,
      idleLabel: isFr ? "Générer le cover" : "Generate cover",
      generatingLabel: isFr ? "Cover en cours…" : "Covering…",
    });
    return () => onGenerateBridgeChange(null);
  }, [canSubmit, generating, isFr, onGenerateBridgeChange, runGenerate]);

  return (
    <>
      <GeneratorSection
        title={isFr ? "Paroles" : "Lyrics"}
        hint={
          isFr
            ? "Colle des paroles que tu aimes bien, choisis un genre et clique sur Générer."
            : "Paste lyrics you like, pick a genre, and hit Generate."
        }
        collapsible={compactSections}
        defaultOpen
        className="pk-cover-lyrics-section"
      >
        <div className="pk-dashboard-text-field pk-cover-lyrics-field">
          <SpeechDictationField
            multiline
            locale={locale}
            variant="dashboard"
            value={lyrics}
            onChange={setLyrics}
            rows={COVER_LYRICS_ROWS}
            micPlacement="inside"
            wrapperClassName="pk-dashboard-text-field-wrap"
            className="pk-dashboard-text-field__control bg-pk-input border border-pk-border text-sm text-pk-text placeholder:text-pk-muted focus:border-pk-accent"
            placeholder={
              isFr
                ? "Colle tes paroles ici (couplet, refrain…)…"
                : "Paste your lyrics here (verse, chorus…)…"
            }
            showStatus={false}
          />
        </div>
      </GeneratorSection>

      <GeneratorSection
        title={isFr ? "Genre cible" : "Target genre"}
        hint={isFr ? "Le style musical de ta reprise." : "The musical style for your cover."}
        collapsible={compactSections}
        defaultOpen
      >
        <GenrePickControl
          compact
          locale={locale}
          genre={genre}
          onGenreChange={onGenreChange}
          lastRandomGenre={lastRandomGenre}
          ideaFilled={styleHint.trim().length > 0}
        />
      </GeneratorSection>

      <GeneratorSection
        title={isFr ? "Touche perso (optionnel)" : "Personal touch (optional)"}
        collapsible={compactSections}
        defaultOpen={false}
      >
        <input
          type="text"
          value={styleHint}
          onChange={(e) => setStyleHint(e.target.value)}
          placeholder={
            isFr
              ? "Ex. voix masculine, 808 lourds, night drive…"
              : "E.g. male vocals, heavy 808s, night drive…"
          }
          className="w-full rounded-xl border border-pk-border bg-pk-bg px-3 py-2.5 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent/40"
        />
      </GeneratorSection>
    </>
  );
}
