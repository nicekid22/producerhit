import { useMemo, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import { legacyEnFr } from "@/i18n/config";
import { GeneratorSection } from "@/components/dashboard/GeneratorSection";
import { RandomPromptDiceButton } from "@/components/RandomPromptDiceButton";
import { SpeechDictationField } from "@/components/SpeechDictationField";
import { useRotatingPromptPlaceholder } from "@/hooks/useRotatingPromptPlaceholder";
import { getLocaleIdeaFallback } from "@/lib/randomPromptIdeas/localeIdeaFallback";

/** Même hauteur visuelle — idée + paroles */
export const DASHBOARD_PROMPT_ROWS = 4;

type Props = {
  locale: AppLocale;
  /** Locale des prompts aléatoires (dé) — défaut = locale UI. */
  promptLocale?: AppLocale;
  mode: "beat" | "song";
  value: string;
  onChange: (value: string) => void;
  /** Sync genre dropdown when dice picks a catalog genre prompt. */
  onPickGenre?: (genre: string) => void;
  /** Prompt ACE caché quand le dé est utilisé. */
  onPickAce?: (acePrompt: string) => void;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function IdeaPromptSection({
  locale,
  promptLocale,
  mode,
  value,
  onChange,
  onPickGenre,
  onPickAce,
  collapsible = false,
  defaultOpen = true,
}: Props) {
  const [focused, setFocused] = useState(false);

  const fallbackPlaceholder = useMemo(
    () => getLocaleIdeaFallback(locale, mode),
    [locale, mode],
  );

  const rotatingPlaceholder = useRotatingPromptPlaceholder({
    uiLocale: locale,
    promptLocale,
    mode,
    value,
    paused: focused,
    fallback: fallbackPlaceholder,
  });

  const copy = {
    title: legacyEnFr(locale, "The Idea", "L’idée"),
  };

  return (
    <GeneratorSection
      title={copy.title}
      collapsible={collapsible}
      defaultOpen={defaultOpen}
      className="pk-idea-prompt-section"
    >
      <div className="pk-idea-prompt-field">
        <div className="pk-dashboard-text-field" data-coach="prompt-field">
          <SpeechDictationField
            multiline
            locale={locale}
            value={value}
            onChange={onChange}
            rows={DASHBOARD_PROMPT_ROWS}
            micPlacement="inside"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            toolbarExtra={
              <RandomPromptDiceButton
                locale={locale}
                promptLocale={promptLocale}
                mode={mode}
                onPick={onChange}
                onPickAce={onPickAce}
                onPickGenre={onPickGenre}
              />
            }
            wrapperClassName="pk-dashboard-text-field-wrap"
            className="pk-dashboard-text-field__control bg-pk-input border border-pk-border text-sm text-pk-text placeholder:text-pk-muted focus:border-pk-accent"
            placeholder={rotatingPlaceholder}
            showStatus={false}
          />
        </div>
      </div>
    </GeneratorSection>
  );
}
