import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { getLevel, getLevelRewardCredits, loadGamification } from "@/lib/gamification";

export type BonusCreditsState = {
  referralBonus: number;
  levelBonus: number;
  dailyBonusMonth: number;
};

export function getTotalBonusCredits(bonus: BonusCreditsState): number {
  return Math.max(0, bonus.referralBonus) + Math.max(0, bonus.levelBonus) + Math.max(0, bonus.dailyBonusMonth);
}

export function getNextLevelRewardCredits(level: number): number {
  return getLevelRewardCredits(level + 1);
}

type ClaimLevelResult = {
  ok: boolean;
  creditsGranted: number;
  level: number;
  levelBonus: number;
  dailyBonusMonth: number;
};

type ClaimDailyResult = {
  ok: boolean;
  creditsGranted: number;
  dailyBonusMonth: number;
};

function parseClaimLevel(data: unknown): ClaimLevelResult {
  const row = data as {
    ok?: boolean;
    credits_granted?: number;
    level?: number;
    level_bonus?: number;
    daily_bonus_month?: number;
  } | null;
  return {
    ok: Boolean(row?.ok),
    creditsGranted: typeof row?.credits_granted === "number" ? row.credits_granted : 0,
    level: typeof row?.level === "number" ? row.level : 1,
    levelBonus: typeof row?.level_bonus === "number" ? row.level_bonus : 0,
    dailyBonusMonth: typeof row?.daily_bonus_month === "number" ? row.daily_bonus_month : 0,
  };
}

function parseClaimDaily(data: unknown): ClaimDailyResult {
  const row = data as { ok?: boolean; credits_granted?: number; daily_bonus_month?: number } | null;
  return {
    ok: Boolean(row?.ok),
    creditsGranted: typeof row?.credits_granted === "number" ? row.credits_granted : 0,
    dailyBonusMonth: typeof row?.daily_bonus_month === "number" ? row.daily_bonus_month : 0,
  };
}

export async function syncLevelRewards(locale: "en" | "fr", options?: { silent?: boolean }): Promise<ClaimLevelResult | null> {
  const xp = loadGamification().xp;
  try {
    const { data, error } = await supabase.rpc("claim_level_rewards", { p_xp: xp });
    if (error) return null;
    const result = parseClaimLevel(data);
    if (!options?.silent && result.ok && result.creditsGranted > 0) {
      const isFr = locale === "fr";
      toast.success(
        isFr
          ? `+${result.creditsGranted} génération${result.creditsGranted > 1 ? "s" : ""} bonus — niveau ${result.level} 🎁`
          : `+${result.creditsGranted} bonus generation${result.creditsGranted > 1 ? "s" : ""} — level ${result.level} 🎁`,
        { duration: 5000, icon: "⚡" },
      );
    }
    return result;
  } catch {
    return null;
  }
}

export async function syncDailyGenerationBonus(locale: "en" | "fr", options?: { silent?: boolean }): Promise<ClaimDailyResult | null> {
  try {
    const { data, error } = await supabase.rpc("claim_daily_generation_bonus");
    if (error) return null;
    const result = parseClaimDaily(data);
    if (!options?.silent && result.ok && result.creditsGranted > 0) {
      const isFr = locale === "fr";
      toast.success(
        isFr ? "+1 génération bonus — bonus du jour 🎁" : "+1 bonus generation — daily loot 🎁",
        { duration: 4500, icon: "🎁" },
      );
    }
    return result;
  } catch {
    return null;
  }
}

export async function syncAllGamificationRewards(locale: "en" | "fr"): Promise<BonusCreditsState | null> {
  const levelResult = await syncLevelRewards(locale);
  if (!levelResult?.ok) return null;
  return {
    referralBonus: 0,
    levelBonus: levelResult.levelBonus,
    dailyBonusMonth: levelResult.dailyBonusMonth,
  };
}

export function detectLevelUp(beforeXp: number, afterXp: number): number | null {
  const before = getLevel(beforeXp);
  const after = getLevel(afterXp);
  return after > before ? after : null;
}
