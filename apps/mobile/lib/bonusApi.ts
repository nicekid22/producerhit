import { supabase } from "./supabase";

export type DailyBonusResult = {
  ok: boolean;
  alreadyClaimed: boolean;
  creditsGranted: number;
  dailyBonusMonth: number;
};

export async function claimDailyGenerationBonus(): Promise<DailyBonusResult> {
  const { data, error } = await supabase.rpc("claim_daily_generation_bonus");
  if (error) {
    return { ok: false, alreadyClaimed: false, creditsGranted: 0, dailyBonusMonth: 0 };
  }
  const row = data as {
    ok?: boolean;
    already_claimed?: boolean;
    credits_granted?: number;
    daily_bonus_month?: number;
  } | null;
  return {
    ok: Boolean(row?.ok),
    alreadyClaimed: row?.already_claimed === true,
    creditsGranted: typeof row?.credits_granted === "number" ? row.credits_granted : 0,
    dailyBonusMonth: typeof row?.daily_bonus_month === "number" ? row.daily_bonus_month : 0,
  };
}
