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

export async function fetchIsGrowthAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from("profiles").select("is_growth_admin").eq("id", userId).maybeSingle();
  if (error) return false;
  return Boolean(data?.is_growth_admin);
}
