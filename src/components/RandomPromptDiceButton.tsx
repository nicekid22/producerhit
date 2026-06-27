import { useState } from "react";
import { Dices } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { dicePromptLabel } from "@/lib/randomPromptIdeas/diceLabels";
import { pickRandomGenreMenuDiceRoll, type PromptMode } from "@/lib/randomPromptIdeas";
import { cn } from "@/lib/utils";

type Props = {
  /** Langue UI (libellé bouton). */
  locale: AppLocale;
  /** Langue des idées aléatoires — peut différer (ex. song + langue vocale manuelle). */
  promptLocale?: AppLocale;
  mode: PromptMode;
  onPick: (prompt: string) => void;
  /** Prompt ACE technique — utilisé à la génération, invisible pour l'utilisateur. */
  onPickAce?: (acePrompt: string) => void;
  /** When set, dice also selects the matching catalog genre (genre-menu prompts). */
  onPickGenre?: (genre: string) => void;
  /** True when the roll came from the curated prompt bank (not genre-menu dice). */
  onPickFromBank?: (fromBank: boolean) => void;
  /** Called after a successful dice roll (e.g. one-time hint toast). */
  onDiceRolled?: () => void;
  className?: string;
  variant?: "dashboard" | "landing";
};

export function RandomPromptDiceButton({
  locale,
  promptLocale,
  mode,
  onPick,
  onPickAce,
  onPickGenre,
  onPickFromBank,
  onDiceRolled,
  className,
  variant = "dashboard",
}: Props) {
  const [rolling, setRolling] = useState(false);
  const label = dicePromptLabel(locale);
  const diceLocale = promptLocale ?? locale;

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    const { displayPrompt, acePrompt, genre, promptBankId } = pickRandomGenreMenuDiceRoll(
      diceLocale,
      mode,
    );
    onPick(displayPrompt);
    if (acePrompt.trim()) onPickAce?.(acePrompt);
    else onPickAce?.("");
    onPickGenre?.(genre);
    onPickFromBank?.(promptBankId != null);
    onDiceRolled?.();
    window.setTimeout(() => setRolling(false), 580);
  };

  const isLanding = variant === "landing";

  return (
    <button
      type="button"
      className={cn(
        isLanding
          ? "pk-speech-field__mic pk-speech-field__mic--landing pk-speech-field__mic--multiline"
          : "pk-random-prompt-dice",
        rolling && "pk-random-prompt-dice--rolling",
        className,
      )}
      aria-label={label}
      title={label}
      onClick={roll}
    >
      <Dices
        className={cn(
          isLanding ? "pk-speech-field__mic-icon h-4 w-4" : "pk-random-prompt-dice__icon",
        )}
        aria-hidden
      />
    </button>
  );
}
