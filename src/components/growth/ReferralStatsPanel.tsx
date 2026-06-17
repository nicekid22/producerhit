import { useEffect, useState } from "react";
import { Users, Gift, TrendingUp } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { fetchReferralStats, type ReferralStats } from "@/lib/referralStats";
import { getNextReferralTier, getReferralTier, REFERRAL_TIERS } from "@/lib/referralConfig";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  className?: string;
};

export function ReferralStatsPanel({ locale, className }: Props) {
  const isFr = locale === "fr";
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchReferralStats().then((result) => {
      if (cancelled) return;
      setStats(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const currentTier = getReferralTier(stats.invitedCount);
  const nextTier = getNextReferralTier(stats.invitedCount);
  const tierProgress = nextTier
    ? Math.min(100, Math.round((stats.invitedCount / nextTier.minInvites) * 100))
    : 100;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-4 w-4 text-cyan-300" />}
          label={isFr ? "Filleuls inscrits" : "Friends joined"}
          value={String(stats.invitedCount)}
        />
        <StatCard
          icon={<Gift className="h-4 w-4 text-violet-300" />}
          label={isFr ? "Bonus parrainage" : "Referral bonus"}
          value={`+${stats.referralBonus}`}
          hint={isFr ? "gens / mois" : "gens / month"}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-amber-300" />}
          label={isFr ? "Impact estimé" : "Estimated impact"}
          value={`+${stats.estimatedSignupBonus}`}
          hint={isFr ? "depuis tes invites" : "from your invites"}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            {isFr ? "Paliers parrainage" : "Referral tiers"}
          </p>
          {currentTier ? (
            <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-violet-200">
              {isFr ? currentTier.labelFr : currentTier.labelEn}
            </span>
          ) : null}
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
            style={{ width: `${tierProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/55">
          {nextTier
            ? isFr
              ? `${stats.invitedCount}/${nextTier.minInvites} filleuls pour ${nextTier.labelFr} (+${nextTier.milestoneBonus} gen cumulés)`
              : `${stats.invitedCount}/${nextTier.minInvites} invites for ${nextTier.labelEn} (+${nextTier.milestoneBonus} gen milestone)`
            : isFr
              ? "Palier Or atteint — tu es un top parrain 🏆"
              : "Gold tier unlocked — you're a top referrer 🏆"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {REFERRAL_TIERS.map((tier) => {
            const unlocked = stats.invitedCount >= tier.minInvites;
            return (
              <span
                key={tier.id}
                className={cn(
                  "rounded-lg border px-2 py-1 text-[10px] font-semibold",
                  unlocked
                    ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                    : "border-white/10 text-white/40",
                )}
              >
                {isFr ? tier.labelFr : tier.labelEn} · {tier.minInvites}+
              </span>
            );
          })}
        </div>
      </div>

      {stats.recentInvites.length > 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">
            {isFr ? "Dernières inscriptions" : "Recent signups"}
          </p>
          <ul className="space-y-2">
            {stats.recentInvites.map((row) => (
              <li key={row.id} className="flex items-center justify-between text-sm text-white/75">
                <span>@{row.username}</span>
                <span className="text-xs text-white/45">
                  {row.created_at ? new Date(row.created_at).toLocaleDateString(isFr ? "fr-FR" : "en-US") : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-white/55">
          {isFr
            ? "Invite des producteurs — tu gagnes +20 gen à chaque inscription via ton lien."
            : "Invite producers — you earn +20 gens each time someone signs up with your link."}
        </p>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-white/55">{icon}{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-white/45">{hint}</div> : null}
    </div>
  );
}
