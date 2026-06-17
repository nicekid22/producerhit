import { Dices } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { legacyEnFr } from "@/i18n/config";
import { GeneratorSection } from "@/components/dashboard/GeneratorSection";
import { RandomPromptDiceButton } from "@/components/RandomPromptDiceButton";
import { SpeechDictationField } from "@/components/SpeechDictationField";

/** Même hauteur visuelle — idée + paroles */
export const DASHBOARD_PROMPT_ROWS = 4;

type Props = {
  locale: AppLocale;
  mode: "beat" | "song";
  value: string;
  onChange: (value: string) => void;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function IdeaPromptSection({
  locale,
  mode,
  value,
  onChange,
  collapsible = false,
  defaultOpen = true,
}: Props) {
  const copy = {
    title: legacyEnFr(locale, "The Idea", "L’idée"),
    hint:
      mode === "song"
        ? legacyEnFr(locale, "Describe vibe, story, or mood", "Décris vibe, histoire ou émotion")
        : legacyEnFr(locale, "Mood and texture for your beat", "Ambiance et texture du beat"),
    placeholder:
      mode === "song"
        ? legacyEnFr(locale, "e.g. Melancholic R&B, late nights in the city…", "ex: R&B mélancolique, nuits en ville…")
        : legacyEnFr(
            locale,
            "e.g. dark melodic trap, smooth 808s, emotional…",
            "ex: trap mélodique sombre, 808s smooth, émotionnel…",
          ),
  };

  return (
    <GeneratorSection
      title={copy.title}
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      className="pk-idea-prompt-section"
    >
      <div className="pk-idea-prompt-hero">
        <div className="pk-idea-prompt-hero__head">
          <p className="pk-idea-prompt-hero__hint">{copy.hint}</p>
          <RandomPromptDiceButton locale={locale} mode={mode} onPick={onChange} />
        </div>

        <div className="pk-dashboard-text-field" data-coach="prompt-field">
          <SpeechDictationField
            multiline
            locale={locale}
            value={value}
            onChange={onChange}
            rows={DASHBOARD_PROMPT_ROWS}
            micPlacement="inside"
            wrapperClassName="pk-dashboard-text-field-wrap"
            className="pk-dashboard-text-field__control bg-pk-input border border-pk-border text-sm text-pk-text placeholder:text-pk-muted focus:border-pk-accent"
            placeholder={copy.placeholder}
            showStatus={false}
          />
        </div>
      </div>
    </GeneratorSection>
  );
}
