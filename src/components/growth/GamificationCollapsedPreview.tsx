import { Flame, Sparkles } from "lucide-react";
import { getLevelProgress, loadGamification } from "@/lib/gamification";

import type { AppLocale } from "@/i18n/config";
type Props = {
  locale: AppLocale;
};

export function GamificationCollapsedPreview({ locale }: Props) {
  const isFr = locale === "fr";
  const state = loadGamification();
  const progress = getLevelProgress(state.xp);

  return (
    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50">
      <span className="font-semibold text-white/75">
        {isFr ? "Niveau" : "Level"} {progress.level}
        <span className="ml-1.5 font-normal text-white/45">
          · {progress.isMax ? `${progress.xpTotal} XP` : `${progress.current} / ${progress.next} XP`}
        </span>
      </span>
      <span className="inline-flex items-center gap-1 text-orange-200/70">
        <Flame className="h-3 w-3" aria-hidden />
        {isFr ? "Série" : "Streak"} {state.streak} {isFr ? "j" : "d"}
      </span>
      <span className="inline-flex items-center gap-1 text-violet-200/65">
        <Sparkles className="h-3 w-3" aria-hidden />
        {isFr ? "Cliquer pour le détail" : "Click for details"}
      </span>
    </div>
  );
}
