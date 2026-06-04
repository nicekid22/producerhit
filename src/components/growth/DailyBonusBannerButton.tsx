import { useCallback, useMemo, useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { canClaimDailyBonus, loadGamification } from "@/lib/gamification";
import { performDailyBonusClaim } from "@/lib/dailyBonusClaim";
import { cn } from "@/lib/utils";

type Props = {
  locale: "en" | "fr";
  syncRewards?: boolean;
  onCreditsChange?: (credits: { levelBonus: number; dailyBonusMonth: number }) => void;
  /** Si bonus déjà pris — ouvre la progression (paramètres). */
  onOpenProgress?: () => void;
};

export function DailyBonusBannerButton({ locale, syncRewards = false, onCreditsChange, onOpenProgress }: Props) {
  const isFr = locale === "fr";
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);

  const dailyReady = useMemo(() => canClaimDailyBonus(loadGamification()), [tick]);

  const handleClick = useCallback(() => {
    if (busy) return;
    if (!dailyReady) {
      onOpenProgress?.();
      return;
    }
    setBusy(true);
    void performDailyBonusClaim(locale, { syncRewards, onCreditsChange })
      .then(() => setTick((t) => t + 1))
      .finally(() => setBusy(false));
  }, [busy, dailyReady, locale, onCreditsChange, onOpenProgress, syncRewards]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2 transition-colors sm:px-2.5",
        "text-[10px] font-semibold sm:text-[11px]",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pk-accent/80",
        "disabled:pointer-events-none disabled:opacity-60",
        dailyReady
          ? "pk-daily-bonus-btn--ready"
          : "border-white/[0.1] bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white/80",
      )}
      aria-label={
        dailyReady
          ? isFr
            ? "Récupérer le bonus du jour"
            : "Claim daily bonus"
          : isFr
            ? "Voir la progression"
            : "View progress"
      }
      title={
        dailyReady
          ? isFr
            ? "Bonus du jour · +1 gen"
            : "Daily bonus · +1 gen"
          : isFr
            ? "Progression · paramètres"
            : "Progress · settings"
      }
    >
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      ) : (
        <Gift className={cn("h-3 w-3", dailyReady && "pk-daily-bonus-btn__icon")} aria-hidden />
      )}
      <span className="hidden min-[360px]:inline">{isFr ? "Bonus" : "Bonus"}</span>
      {dailyReady ? <span className="pk-daily-bonus-btn__pill hidden sm:inline">+1</span> : null}
    </button>
  );
}
