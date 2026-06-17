import { useState } from "react";
import { Dices } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { legacyEnFr } from "@/i18n/config";
import { pickRandomPrompt, type PromptMode } from "@/lib/randomPromptIdeas";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  mode: PromptMode;
  onPick: (prompt: string) => void;
  className?: string;
  variant?: "dashboard" | "landing";
};

export function RandomPromptDiceButton({ locale, mode, onPick, className, variant = "dashboard" }: Props) {
  const [rolling, setRolling] = useState(false);
  const label = legacyEnFr(locale, "Random prompt", "Prompt aléatoire");

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    onPick(pickRandomPrompt(locale, mode));
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
