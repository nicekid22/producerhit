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
  className,
  variant = "dashboard",
}: Props) {
  const [rolling, setRolling] = useState(false);
  const label = dicePromptLabel(locale);
  const diceLocale = promptLocale ?? locale;

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    const { displayPrompt, acePrompt, genre } = pickRandomGenreMenuDiceRoll(diceLocale, mode);
    onPick(displayPrompt);
    onPickAce?.(acePrompt);
    onPickGenre?.(genre);
    window.setTimeout(() => setRolling(false), 580);
  };

  return (
    <button
      type="button"
      className={cn(
        "pk-random-prompt-dice",
        variant === "landing" && "pk-random-prompt-dice--landing",
        rolling && "pk-random-prompt-dice--rolling",
        className,
      )}
      aria-label={label}
      title={label}
      onClick={roll}
    >
      <Dices className="pk-random-prompt-dice__icon" aria-hidden />
    </button>
  );
}
