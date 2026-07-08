import { useCallback, useState } from "react";
import { Sparkles } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { runCheckoutWithAuth } from "@/lib/billing";
import { isLaunchOfferActive } from "@/lib/launchOffer";
import { trackClientEvent } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

type Props = {
  locale: AppLocale;
  location: string;
  plan: string;
  className?: string;
  /** Attendre hydratation profil avant d’afficher l’upsell Free */
  ready?: boolean;
};

export function FreeUpgradeStrip({ locale, location, plan, className, ready = true }: Props) {
  const [loading, setLoading] = useState(false);
  const isFr = locale === "fr";

  const upgrade = useCallback(async () => {
    trackClientEvent("free_upgrade_strip_click", { location });
    setLoading(true);
    try {
      await runCheckoutWithAuth({ plan: "pro", location, locale });
    } finally {
      setLoading(false);
    }
  }, [locale, location]);

  if (!ready || plan !== "free") return null;

  const launch = isLaunchOfferActive();
  const title = launch
    ? isFr
      ? "Pro à 8 $/mois — droits commerciaux + WAV"
      : "Pro $8/mo — commercial rights + WAV export"
    : isFr
      ? "Passe Pro — 50 gen/mois, WAV & droits commerciaux"
      : "Go Pro — 50 gens/mo, WAV & commercial rights";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-500/10 via-violet-500/10 to-fuchsia-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-0.5 text-xs text-white/55">
            {isFr ? "Checkout Stripe en 30 s · annulable" : "Stripe checkout in 30s · cancel anytime"}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => void upgrade()}
        className="pk-pro-cta shrink-0 rounded-xl px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
      >
        {loading ? (isFr ? "Chargement…" : "Loading…") : isFr ? "Passer Pro" : "Upgrade Pro"}
      </button>
    </div>
  );
}
