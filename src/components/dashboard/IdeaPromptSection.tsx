import { useMemo, useState } from "react";
import { toastInfo } from "@/lib/appToast";
import type { AppLocale } from "@/i18n/config";
import { legacyEnFr } from "@/i18n/config";
import { buildDashboardSection } from "@/i18n/dashboardCatalog";
import { GeneratorSection } from "@/components/dashboard/GeneratorSection";
import { AceCaptionPreview } from "@/components/dashboard/AceCaptionPreview";
import { IdeaPromptHint } from "@/components/dashboard/IdeaPromptHint";
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
  formGenre: string;
  /** Prompt ACE caché quand le dé est utilisé. */
  onPickAce?: (acePrompt: string) => void;
  /** Placeholder rotatif visible — exemples uniquement, jamais envoyés à la génération. */
  onRotatingPlaceholder?: (text: string) => void;
  /** Sync genre dropdown when dice picks a catalog genre prompt. */
  onPickGenre?: (genre: string) => void;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function IdeaPromptSection({
  locale,
  promptLocale,
  mode,
  value,
  onChange,
  formGenre,
  onPickGenre,
  onPickAce,
  onRotatingPlaceholder,
  collapsible = false,
  defaultOpen = true,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [diceAceOverride, setDiceAceOverride] = useState<string | null>(null);

  const dash = buildDashboardSection(locale);

  const showHint = focused || value.trim().length > 0;

  const handleDiceRolled = () => {
    try {
      if (sessionStorage.getItem("pk.diceHintShown") === "1") return;
      sessionStorage.setItem("pk.diceHintShown", "1");
      toastInfo(dash.ideaPromptDiceHint, { id: "dice-hint" });
    } catch {
      toastInfo(dash.ideaPromptDiceHint, { id: "dice-hint" });
    }
  };

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
    onActivePlaceholder: onRotatingPlaceholder,
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
        <div className="pk-dashboard-text-field pk-idea-prompt-field__shell" data-coach="prompt-field">
          {!value.trim() && !focused ? (
            <div key={rotatingPlaceholder} className="pk-idea-prompt-ghost" aria-hidden="true">
              {rotatingPlaceholder}
            </div>
          ) : null}
          <SpeechDictationField
            multiline
            locale={locale}
            value={value}
            onChange={(next) => {
              setDiceAceOverride(null);
              onChange(next);
            }}
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
                onPickAce={(ace) => {
                  setDiceAceOverride(ace?.trim() || null);
                  onPickAce?.(ace);
                }}
                onPickGenre={onPickGenre}
                onDiceRolled={handleDiceRolled}
              />
            }
            wrapperClassName="pk-dashboard-text-field-wrap"
            className="pk-dashboard-text-field__control bg-pk-input border border-pk-border text-sm text-pk-text placeholder:text-transparent focus:border-pk-accent"
            placeholder=""
            showStatus={false}
          />
        </div>
        <IdeaPromptHint locale={locale} visible={showHint} />
        {import.meta.env.DEV ? (
          <AceCaptionPreview
            locale={locale}
            displayIdea={value}
            formGenre={formGenre}
            mode={mode}
            diceAceOverride={diceAceOverride}
          />
        ) : null}
      </div>
    </GeneratorSection>
  );
}
