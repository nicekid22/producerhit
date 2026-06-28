import { useEffect, useRef } from "react";
import type { AppLocale } from "@/i18n/config";
import {
  markAudioRetentionDailyNoticeShown,
  shouldShowAudioRetentionDailyNotice,
  showAudioRetentionDailyNotice,
} from "@/lib/audioRetentionDailyNotice";
import { summarizeHostedAudioRetention } from "@/lib/loopAudioRetention";
import { hasPermanentHostedAudio } from "@/lib/planEntitlements";
import { useAuthStore } from "@/stores/authStore";
import type { Loop } from "@/types/loop";

type Options = {
  locale: AppLocale;
  loops: Loop[];
  loopsReady: boolean;
  plan: string;
  planReady: boolean;
  hostedAudioExpiresAt?: string | null;
};

/** Modal cloud Plus 1×/jour si des tracks hébergées sont expirées (plan sans audio permanent). */
export function useAudioRetentionDailyNotice({
  locale,
  loops,
  loopsReady,
  plan,
  planReady,
  hostedAudioExpiresAt = null,
}: Options): void {
  const userId = useAuthStore((s) => s.user?.id);
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return;
    if (!userId || !planReady || !loopsReady) return;
    if (hasPermanentHostedAudio(plan)) return;

    const summary = summarizeHostedAudioRetention(loops, { plan, hostedAudioExpiresAt });
    if (!summary || summary.expired <= 0) return;
    if (!shouldShowAudioRetentionDailyNotice(userId)) return;

    shownRef.current = true;
    markAudioRetentionDailyNoticeShown(userId);
    showAudioRetentionDailyNotice({
      expiredCount: summary.expired,
      plan,
      source: "audio_retention_daily",
    });
  }, [hostedAudioExpiresAt, locale, loops, loopsReady, plan, planReady, userId]);
}
