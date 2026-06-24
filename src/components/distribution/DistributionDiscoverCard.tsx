import { Link } from "react-router-dom";
import { GraduationCap, Package, Sparkles } from "lucide-react";
import { canDistribute } from "@/lib/planEntitlements";
import { DISTRIBUTION_ACADEMY_VALUE_USD } from "@/content/academy/distribution/modules";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function DistributionDiscoverCard({ className = "" }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const plan = useAuthStore((s) => s.profile?.plan);
  const isFr = locale === "fr";
  const eligible = canDistribute(plan);

  return (
    <div
      className={cn(
        "rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-200/80">
            <Package className="h-4 w-4" aria-hidden />
            {isFr ? "Distribution" : "Distribution"}
          </p>
          <h2 className="text-lg font-bold text-white">
            {isFr ? "Prêt à distribuer ?" : "Ready to distribute?"}
          </h2>
          <p className="max-w-xl text-sm text-white/60">
            {isFr
              ? `Pack ZIP + Academy (${DISTRIBUTION_ACADEMY_VALUE_USD} $ de valeur) — inclus Studio & Plus.`
              : `ZIP pack + Academy ($${DISTRIBUTION_ACADEMY_VALUE_USD} value) — included with Studio & Plus.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {eligible ? (
            <Link
              to="/library"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              {isFr ? "Choisir un morceau" : "Pick a track"}
            </Link>
          ) : (
            <Link
              to="/pricing?plan=studio"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              {isFr ? "Passer à Studio" : "Upgrade to Studio"}
            </Link>
          )}
          <Link
            to="/learn/distribute-ai-music"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            <GraduationCap className="h-4 w-4" aria-hidden />
            {isFr ? "Academy" : "Academy"}
          </Link>
        </div>
      </div>
    </div>
  );
}
