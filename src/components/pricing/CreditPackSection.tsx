import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { runCreditPackCheckout } from "@/lib/billing";
import { getCreditPack, getCreditPackSectionCopy } from "@/lib/creditPacks";
import { trackClientEvent } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { buildAuthUrl } from "@/lib/authRoutes";

type Props = {
  locale: AppLocale;
  location?: string;
};

export function CreditPackSection({ locale, location = "pricing" }: Props) {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const copy = getCreditPackSectionCopy(locale);
  const pack = getCreditPack("credit_pack_50");

  const handleBuy = async () => {
    trackClientEvent("credit_pack_click", { location, product: pack.id });
    if (!user) {
      window.location.href = buildAuthUrl({ next: `/pricing?pack=${pack.id}` });
      return;
    }
    setLoading(true);
    try {
      await runCreditPackCheckout({ product: pack.id, location, locale });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="pk-pricing-credit-pack pk-prism-card relative overflow-hidden p-6 sm:p-8" aria-labelledby="pk-credit-pack-title">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(103,195,255,0.12),transparent_55%)]"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--prism-cyan)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {copy.lead.split("·")[0]?.trim()}
          </p>
          <h2 id="pk-credit-pack-title" className="mt-2 text-xl font-bold text-white sm:text-2xl">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm text-white/55">{copy.lead}</p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <div className="text-center sm:text-right">
            <p className="text-3xl font-extrabold tabular-nums text-white">${pack.usd}</p>
            <p className="text-xs text-white/45">+{pack.credits} gen</p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleBuy()}
            className="rounded-full bg-gradient-to-r from-cyan-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? "…" : copy.cta}
          </button>
        </div>
      </div>
    </section>
  );
}
