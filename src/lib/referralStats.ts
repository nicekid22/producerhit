import { supabase } from "@/lib/supabaseClient";

export type ReferralInviteRow = {
  id: string;
  username: string;
  created_at: string;
};

export type ReferralStats = {
  invitedCount: number;
  referralBonus: number;
  estimatedSignupBonus: number;
  recentInvites: ReferralInviteRow[];
};

export async function fetchReferralStats(): Promise<ReferralStats | null> {
  try {
    const { data, error } = await supabase.rpc("get_referral_stats");
    if (error) return null;
    const row = data as {
      ok?: boolean;
      invited_count?: number;
      referral_bonus?: number;
      estimated_signup_bonus?: number;
      recent_invites?: unknown;
    } | null;
    if (!row?.ok) return null;

    const recentInvites = Array.isArray(row.recent_invites)
      ? row.recent_invites
          .map((raw) => {
            const r = raw as Record<string, unknown>;
            if (typeof r.id !== "string") return null;
            return {
              id: r.id,
              username: typeof r.username === "string" ? r.username : "Producer",
              created_at: typeof r.created_at === "string" ? r.created_at : "",
            } satisfies ReferralInviteRow;
          })
          .filter((r): r is ReferralInviteRow => r !== null)
      : [];

    return {
      invitedCount: typeof row.invited_count === "number" ? row.invited_count : 0,
      referralBonus: typeof row.referral_bonus === "number" ? row.referral_bonus : 0,
      estimatedSignupBonus: typeof row.estimated_signup_bonus === "number" ? row.estimated_signup_bonus : 0,
      recentInvites,
    };
  } catch {
    return null;
  }
}
