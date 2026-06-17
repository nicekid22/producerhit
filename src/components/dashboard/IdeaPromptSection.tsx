import type { AppLocale } from "@/i18n/config";
import { legacyEnFr } from "@/i18n/config";
import { GeneratorSection } from "@/components/dashboard/GeneratorSection";
import { RandomPromptDiceButton } from "@/components/RandomPromptDiceButton";
import { SpeechDictationField } from "@/components/SpeechDictationField";

/** Même hauteur visuelle — idée + paroles */
export const DASHBOARD_PROMPT_ROWS = 4;

type Props = {
  locale: AppLocale;
  /** Locale des prompts aléatoires (dé) — défaut = locale UI. */
  promptLocale?: AppLocale;
  mode: "beat" | "song";
  value: string;
  onChange: (value: string) => void;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function IdeaPromptSection({
  locale,
  promptLocale,
  mode,
  value,
  onChange,
  collapsible = false,
  defaultOpen = true,
}: Props) {
  const copy = {
    title: legacyEnFr(locale, "The Idea", "L’idée"),
    placeholder:
      mode === "song"
        ? legacyEnFr(
            locale,
            "e.g. contemporary R&B, breathy female vocal, rhodes piano, heartbreak mood, warm mix",
            "ex: contemporary R&B, breathy female vocal, rhodes piano, heartbreak mood, warm mix",
          )
        : legacyEnFr(
            locale,
            "e.g. melodic trap, sliding 808, crisp hi-hats, minor piano, airy pads, polished mix",
            "ex: melodic trap, sliding 808, crisp hi-hats, minor piano, airy pads, polished mix",
          ),
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
          <div className="pk-idea-prompt-tools">
            <RandomPromptDiceButton locale={locale} promptLocale={promptLocale} mode={mode} onPick={onChange} />
          </div>
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
