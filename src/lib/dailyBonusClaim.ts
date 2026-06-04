import toast from "react-hot-toast";
import { claimDailyBonus, getLevel, loadGamification } from "@/lib/gamification";
import { syncDailyGenerationBonus, syncLevelRewards } from "@/lib/gamificationRewards";
import { useLootRevealStore } from "@/stores/lootRevealStore";

export type DailyBonusClaimResult = {
  claimed: boolean;
  alreadyClaimed: boolean;
};

/** Récupère le bonus du jour + sync crédits profil (dashboard / paramètres). */
export async function performDailyBonusClaim(
  locale: "en" | "fr",
  options?: {
    syncRewards?: boolean;
    onCreditsChange?: (credits: { levelBonus: number; dailyBonusMonth: number }) => void;
  },
): Promise<DailyBonusClaimResult> {
  const isFr = locale === "fr";
  const beforeXp = loadGamification().xp;
  const result = claimDailyBonus();

  if (result.alreadyClaimed) {
    toast(isFr ? "Bonus déjà récupéré — reviens demain" : "Bonus already claimed — see you tomorrow", {
      duration: 2500,
    });
    return { claimed: false, alreadyClaimed: true };
  }

  const showLoot = useLootRevealStore.getState().showLoot;
  let credits = 1;

  if (options?.syncRewards) {
    const daily = await syncDailyGenerationBonus(locale, { silent: true });
    const levelResult = await syncLevelRewards(locale, { silent: true });
    if (daily?.creditsGranted) credits = daily.creditsGranted;
    if (options.onCreditsChange && (daily?.ok || levelResult?.ok)) {
      options.onCreditsChange({
        levelBonus: levelResult?.levelBonus ?? 0,
        dailyBonusMonth: daily?.dailyBonusMonth ?? 0,
      });
    }
    const beforeLevel = getLevel(beforeXp);
    const afterLevel = getLevel(result.state.xp);
    showLoot({ kind: "daily", credits, xp: result.xpGained });
    if (levelResult?.ok && levelResult.creditsGranted > 0 && afterLevel > beforeLevel) {
      showLoot({ kind: "level", credits: levelResult.creditsGranted, level: afterLevel });
    }
  } else {
    showLoot({ kind: "daily", credits, xp: result.xpGained });
  }

  toast.success(isFr ? "Bonus du jour récupéré" : "Daily bonus claimed", { duration: 2200 });
  return { claimed: true, alreadyClaimed: false };
}
