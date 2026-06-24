import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, GraduationCap, Loader2, RefreshCw, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { DistributionReleaseCard } from "@/components/distribution/DistributionReleaseCard";
import {
  fetchDistributionReleases,
  fetchDistributionUsage,
  subscribeDistributionReleases,
  type DistributionReleaseWithOutlets,
} from "@/lib/distributionApi";
import { canDistribute, distributionMonthlyQuota } from "@/lib/planEntitlements";
import { useAuthStore } from "@/stores/authStore";
import { DistributionDiscoverCard } from "@/components/distribution/DistributionDiscoverCard";
import { DISTRIBUTION_ACADEMY_VALUE_USD } from "@/content/academy/distribution/modules";
import { useMobileUiV2 } from "@/hooks/useMobileUiV2";

export default function DistributionPage() {
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const mobileUiV2 = useMobileUiV2();
  const plan = profile?.plan ?? "free";
  const [releases, setReleases] = useState<DistributionReleaseWithOutlets[]>([]);
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [list, usageSummary] = await Promise.all([
        fetchDistributionReleases(),
        fetchDistributionUsage(),
      ]);
      setReleases(list);
      if (usageSummary) {
        setUsage({ used: usageSummary.used, quota: usageSummary.quota });
      } else {
        setUsage({ used: 0, quota: distributionMonthlyQuota(plan) });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [plan]);

  useEffect(() => {
    if (!user?.id) return;
    return subscribeDistributionReleases(user.id, () => {
      void load();
    });
  }, [user?.id]);

  const eligible = canDistribute(plan);

  return (
    <AppShell variant={mobileUiV2 ? "single" : "split"}>
      <div className="mx-auto max-w-3xl space-y-6 p-4 pb-8 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Download className="h-6 w-6 text-violet-300" />
              Pack distribution
            </h1>
            <p className="mt-1 text-sm text-white/55">
              ZIP prêt pour DistroKid, TuneCore, CD Baby — audio, cover 1400×1400, métadonnées et licence
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 p-5">
          <h2 className="text-lg font-bold text-white">
            {eligible ? "Commencer depuis la bibliothèque" : "Distribution Academy — module 1 gratuit"}
          </h2>
          <p className="mt-2 text-sm text-white/60">
            {eligible
              ? "Ouvre un morceau → Pack distribution → Cover Studio IA → export ZIP."
              : `Formation complète (${DISTRIBUTION_ACADEMY_VALUE_USD} $ de valeur) incluse Studio & Plus.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/library"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Bibliothèque
            </Link>
            <Link
              to="/learn/distribute-ai-music"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              <GraduationCap className="h-4 w-4" aria-hidden />
              Academy
            </Link>
          </div>
        </div>

        <DistributionDiscoverCard />

        {eligible ? (
          <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-sm text-violet-100/90">
            Exports ce mois : <strong>{usage?.used ?? 0}</strong> / {usage?.quota ?? distributionMonthlyQuota(plan)} packs
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100/90">
            Inclus dans Studio (2/mois) et Plus (5/mois).{" "}
            <Link to="/pricing" className="underline">
              Voir les plans
            </Link>
          </div>
        )}

        <p className="text-sm text-white/50">
          Depuis ta <Link to="/library" className="text-violet-300 underline">bibliothèque</Link>, ouvre un morceau et clique sur <strong>Pack distribution</strong>.
        </p>

        {loading ? (
          <div className="flex justify-center py-12 text-white/50">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : releases.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center text-sm text-white/50">
            Aucun pack exporté pour l&apos;instant.
          </div>
        ) : (
          <div className="space-y-4">
            {releases.map((r) => (
              <DistributionReleaseCard key={r.id} release={r} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
