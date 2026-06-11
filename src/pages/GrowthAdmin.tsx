import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, RefreshCw, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { fetchGrowthDashboard, type GrowthDashboard } from "@/lib/growthAnalytics";
import { useAuthStore } from "@/stores/authStore";
import { useMobileUiV2 } from "@/hooks/useMobileUiV2";

export default function GrowthAdmin() {
  const user = useAuthStore((s) => s.user);
  const mobileUiV2 = useMobileUiV2();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<GrowthDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const result = await fetchGrowthDashboard(days);
    if (!result) {
      setError("Accès refusé ou données indisponibles.");
      setData(null);
    } else {
      setData(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [days]);

  return (
    <AppShell theme="prism" variant={mobileUiV2 ? "single" : "split"}>
      <div className="mx-auto max-w-5xl space-y-6 p-4 pb-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Growth dashboard</h1>
            <p className="mt-1 text-sm text-white/55">UTM, funnel et parrainage — {days} derniers jours</p>
          </div>
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((d) => (
              <Button key={d} variant={days === d ? "primary" : "secondary"} size="sm" onClick={() => setDays(d)}>
                {d}j
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
            {!user ? (
              <div className="mt-2">
                <Link to="/auth" className="underline">
                  Se connecter
                </Link>
              </div>
            ) : (
              <div className="mt-2 text-xs text-red-200/80">
                Active <code className="text-red-100">is_growth_admin = true</code> sur ton profil Supabase.
              </div>
            )}
          </div>
        ) : null}

        {data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard icon={TrendingUp} label="Landing" value={data.funnel.landing_clicks} />
              <StatCard icon={Users} label="Inscriptions" value={data.funnel.signups} />
              <StatCard icon={BarChart3} label="Générations" value={data.funnel.generations} />
              <StatCard icon={BarChart3} label="Checkouts" value={data.funnel.checkouts} />
              <StatCard icon={BarChart3} label="Abonnements" value={data.funnel.subscriptions ?? 0} />
              <StatCard icon={TrendingUp} label="Upsell prompts" value={data.funnel.upgrade_prompts ?? 0} />
            </div>

            <Panel title="Taux de conversion (période)">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/[0.03] p-4">
                  <div className="text-xs text-white/50">Signup → Gen</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{data.funnel.signup_to_gen_pct ?? 0}%</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-4">
                  <div className="text-xs text-white/50">Gen → Checkout</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{data.funnel.gen_to_checkout_pct ?? 0}%</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-4">
                  <div className="text-xs text-white/50">Checkout → Payé</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{data.funnel.checkout_to_paid_pct ?? 0}%</div>
                </div>
              </div>
            </Panel>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Sources UTM">
                <Table rows={data.by_source.map((r) => ({ a: r.source, b: String(r.count) }))} empty="Aucune source" />
              </Panel>
              <Panel title="Événements">
                <Table rows={data.by_event.map((r) => ({ a: r.name, b: String(r.count) }))} empty="Aucun event" />
              </Panel>
            </div>

            <Panel title="Parrainage">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white/[0.03] p-4">
                  <div className="text-xs text-white/50">Filleuls (période)</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{data.referrals.referred_users}</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-4">
                  <div className="text-xs text-white/50">Bonus beats distribués (total)</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{data.referrals.total_referral_bonus}</div>
                </div>
              </div>
            </Panel>
          </>
        ) : loading ? (
          <div className="text-sm text-white/50">Chargement…</div>
        ) : null}
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs text-white/50">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold text-white">{value.toLocaleString()}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="mb-3 text-sm font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function Table({ rows, empty }: { rows: Array<{ a: string; b: string }>; empty: string }) {
  if (rows.length === 0) return <div className="text-sm text-white/45">{empty}</div>;
  return (
    <div className="max-h-72 overflow-auto">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.a} className="border-b border-white/5">
              <td className="py-2 pr-4 text-white/80">{row.a}</td>
              <td className="py-2 text-right font-mono text-violet-300">{row.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
