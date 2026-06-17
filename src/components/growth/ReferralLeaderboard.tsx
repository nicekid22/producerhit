import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { AppLocale } from "@/i18n/config";

type LeaderboardItem = {
  referrals: number;
  code_prefix: string;
};

type Props = {
  locale: AppLocale;
  className?: string;
};

export function ReferralLeaderboard({ locale, className }: Props) {
  const isFr = locale === "fr";
  const [items, setItems] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.rpc("get_referral_leaderboard", { p_limit: 8 });
      const row = data as { ok?: boolean; items?: unknown } | null;
      if (!row?.ok || !Array.isArray(row.items)) return;
      setItems(
        row.items
          .map((raw) => {
            const r = raw as Record<string, unknown>;
            return {
              referrals: typeof r.referrals === "number" ? r.referrals : 0,
              code_prefix: typeof r.code_prefix === "string" ? r.code_prefix : "????",
            };
          })
          .filter((i) => i.referrals > 0),
      );
    })();
  }, []);

  if (!items.length) return null;

  return (
    <div className={className}>
      <h4 className="mb-2 text-sm font-semibold text-white/90">
        {isFr ? "Top parrains" : "Top referrers"}
      </h4>
      <ol className="space-y-1.5 text-sm text-white/70">
        {items.map((item, idx) => (
          <li key={`${item.code_prefix}-${idx}`} className="flex justify-between gap-3">
            <span>
              #{idx + 1} {item.code_prefix}…
            </span>
            <span className="font-medium text-violet-200">
              {item.referrals} {isFr ? "fil." : "refs"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
