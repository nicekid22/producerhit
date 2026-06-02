import { supabase } from "@/lib/supabaseClient";

export type GrowthDashboard = {
  since: string;
  days: number;
  by_source: Array<{ source: string; count: number }>;
  by_event: Array<{ name: string; count: number }>;
  funnel: {
    landing_clicks: number;
    signups: number;
    generations: number;
    checkouts: number;
  };
  referrals: {
    referred_users: number;
    total_referral_bonus: number;
  };
};

export async function fetchGrowthDashboard(days = 30): Promise<GrowthDashboard | null> {
  const { data, error } = await supabase.rpc("get_growth_dashboard", { p_days: days });
  if (error || !data) return null;
  return data as GrowthDashboard;
}

const GROWTH_ADMIN_CACHE_KEY = "producerhit_growth_admin_v1";

export async function fetchIsGrowthAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const raw = window.sessionStorage.getItem(GROWTH_ADMIN_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { userId?: string; ok?: boolean; ts?: number };
      if (
        parsed.userId === userId &&
        typeof parsed.ts === "number" &&
        Date.now() - parsed.ts < 6 * 60 * 60 * 1000 &&
        typeof parsed.ok === "boolean"
      ) {
        return parsed.ok;
      }
    }
  } catch {
    // ignore
  }

  const { data, error } = await supabase.from("profiles").select("is_growth_admin").eq("id", userId).maybeSingle();
  if (error) {
    const msg = (error.message ?? "").toLowerCase();
    if (msg.includes("is_growth_admin") || msg.includes("column")) {
      try {
        window.sessionStorage.setItem(
          GROWTH_ADMIN_CACHE_KEY,
          JSON.stringify({ userId, ok: false, ts: Date.now() }),
        );
      } catch {
        // ignore
      }
    }
    return false;
  }
  const ok = Boolean(data?.is_growth_admin);
  try {
    window.sessionStorage.setItem(GROWTH_ADMIN_CACHE_KEY, JSON.stringify({ userId, ok, ts: Date.now() }));
  } catch {
    // ignore
  }
  return ok;
}
