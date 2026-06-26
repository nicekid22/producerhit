import { useMemo } from "react";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AppLocale } from "@/i18n/config";
import type { Loop } from "@/types/loop";
import {
  LOOP_AUDIO_RETENTION_DAYS_FREE,
  LOOP_AUDIO_RETENTION_DAYS_PRO,
  summarizeHostedAudioRetention,
} from "@/lib/loopAudioRetention";
import { hasPermanentHostedAudio, normalizePlanId } from "@/lib/planEntitlements";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";
import { cn } from "@/lib/utils";
import "@/styles/paywall-modal.css";

type Props = {
  locale: AppLocale;
  plan: string;
  loops: Loop[];
  /** Attendre profil + loops hydratés — évite le flash plan=free / loops partiels. */
  ready?: boolean;
  hostedAudioExpiresAt?: string | null;
  className?: string;
};

export function AudioRetentionBanner({
  locale,
  plan,
  loops,
  ready = true,
  hostedAudioExpiresAt = null,
  className,
}: Props) {
  const navigate = useNavigate();
  const openUpsell = useGrowthUpsellStore((s) => s.openUpsell);
  const isFr = locale === "fr";
  const normalizedPlan = normalizePlanId(plan);

  const retentionCtx = useMemo(
    () => ({ plan, hostedAudioExpiresAt }),
    [plan, hostedAudioExpiresAt],
  );

  const summary = useMemo(() => {
    if (!ready) return null;
    return summarizeHostedAudioRetention(loops, retentionCtx);
  }, [loops, ready, retentionCtx]);

  if (!summary) return null;

  const urgent = summary.expired > 0 || (summary.soonestDays !== null && summary.soonestDays <= 1);

  return (
    <div
      className={cn(
        "pk-audio-retention-banner flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        urgent && "pk-audio-retention-banner--urgent",
        className,
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        {urgent ? (
          <AlertTriangle className="pk-audio-retention-banner__icon mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <Clock className="pk-audio-retention-banner__icon mt-0.5 h-5 w-5 shrink-0" />
        )}
        <div>
          <p className="pk-audio-retention-banner__title text-sm font-semibold">
            {summary.expired > 0
              ? isFr
                ? `${summary.expired} track${summary.expired > 1 ? "s" : ""} expirée${summary.expired > 1 ? "s" : ""}`
                : `${summary.expired} track${summary.expired > 1 ? "s" : ""} expired`
              : isFr
                ? `${summary.expiring} track${summary.expiring > 1 ? "s" : ""} expire${summary.expiring > 1 ? "nt" : ""} bientôt`
                : `${summary.expiring} track${summary.expiring > 1 ? "s" : ""} expiring soon`}
          </p>
          <p className="pk-audio-retention-banner__body mt-1 text-xs leading-relaxed">
            {normalizedPlan === "free"
              ? isFr
                ? `Plan Free : audio hébergé ${LOOP_AUDIO_RETENTION_DAYS_FREE}j. Passe Pro (${LOOP_AUDIO_RETENTION_DAYS_PRO}j) ou Plus (permanent).`
                : `Free plan: ${LOOP_AUDIO_RETENTION_DAYS_FREE}d hosted audio. Pro (${LOOP_AUDIO_RETENTION_DAYS_PRO}d) or Plus (permanent).`
              : isFr
                ? "Passe Plus pour des liens audio permanents tant que tu es abonné."
                : "Upgrade to Plus for permanent hosted audio while subscribed."}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          className="pk-audio-retention-banner__btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition hover:opacity-90"
          onClick={() => navigate("/library")}
        >
          {isFr ? "Voir Library" : "Open Library"}
        </button>
        <button
          type="button"
          className="pk-audio-retention-banner__cta inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition"
          onClick={() => {
            openUpsell("feature_permanent_audio", {
              source: "audio_retention_banner",
              plan,
            });
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isFr ? "Sécuriser mes sons" : "Keep my tracks"}
        </button>
      </div>
    </div>
  );
}
