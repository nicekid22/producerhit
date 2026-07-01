import { memo, type ComponentProps } from "react";
import { ShareMomentModal } from "@/components/growth/ShareMomentModal";
import { ReferralInviteModal } from "@/components/growth/ReferralInviteModal";
import { MasteringUpsellModal } from "@/components/growth/MasteringUpsellModal";
import { WavFormatCoach } from "@/components/onboarding/WavFormatCoach";
import { DistributionWizard } from "@/components/distribution/DistributionWizard";
import type { Loop } from "@/types/loop";
import type { UserProfileRow } from "@/lib/profileBootstrap";

// Derived rather than guessed: avoids importing the wrong path for the
// app's locale union type (we don't have visibility into where AppLocale
// is actually exported from in this repo).
type AppLocale = ComponentProps<typeof ShareMomentModal>["locale"];

/**
 * PERF: extracted from Dashboard.tsx (patch 3).
 *
 * This block of 5 modal/coach components used to live inline in Dashboard's
 * render tree. Every one of them carries its own internal state/effects
 * (open/close transitions, internal forms, etc.), so even though they're
 * usually closed, React still had to reconcile this whole subtree on every
 * single Dashboard re-render (typing in the prompt field, toggling a
 * dropdown, a generation progress tick...).
 *
 * Wrapped in React.memo, this subtree now only re-renders when one of the
 * explicit props below actually changes — not on every keystroke elsewhere
 * in the dashboard.
 *
 * Behavior is unchanged: same components, same conditions, same callbacks.
 * All closures that used to capture Dashboard's local state now receive
 * that state via props instead.
 */
export const DashboardGrowthModals = memo(function DashboardGrowthModals({
  locale,
  plan,
  distributionLoop,
  authProfile,
  onCloseDistribution,
  shareMomentLoop,
  onCloseShareMoment,
  onShareMomentMakePublic,
  referralPromptOpen,
  referralCode,
  onCloseReferralPrompt,
  onPrepareWavCoachTarget,
  onTryWav,
  onUpgradeProFromWavCoach,
  masteringUpsellLoop,
  onCloseMasteringUpsell,
  onTryMastering,
  onUpgradeFromMasteringUpsell,
}: {
  locale: AppLocale;
  plan: string;
  distributionLoop: Loop | null;
  authProfile: UserProfileRow | null | undefined;
  onCloseDistribution: () => void;
  shareMomentLoop: Loop | null;
  onCloseShareMoment: () => void;
  /** undefined hides the "make public" action, matching the original conditional prop. */
  onShareMomentMakePublic: (() => void) | undefined;
  referralPromptOpen: boolean;
  referralCode: string | null;
  onCloseReferralPrompt: () => void;
  onPrepareWavCoachTarget: () => void;
  onTryWav: () => void;
  onUpgradeProFromWavCoach: () => void;
  masteringUpsellLoop: Loop | null;
  onCloseMasteringUpsell: () => void;
  onTryMastering: () => void;
  onUpgradeFromMasteringUpsell: () => void;
}) {
  return (
    <>
      <DistributionWizard
        open={Boolean(distributionLoop)}
        loop={distributionLoop}
        profile={authProfile}
        onClose={onCloseDistribution}
      />
      <ShareMomentModal
        open={!!shareMomentLoop}
        loop={shareMomentLoop}
        locale={locale}
        plan={plan}
        onClose={onCloseShareMoment}
        onMakePublic={shareMomentLoop && !shareMomentLoop.isPublic ? onShareMomentMakePublic : undefined}
      />
      <ReferralInviteModal
        open={referralPromptOpen}
        locale={locale}
        referralCode={referralCode ?? authProfile?.referral_code ?? null}
        onClose={onCloseReferralPrompt}
      />
      <WavFormatCoach
        locale={locale}
        onPrepareTarget={onPrepareWavCoachTarget}
        onTryWav={onTryWav}
        onUpgradePro={onUpgradeProFromWavCoach}
      />
      <MasteringUpsellModal
        open={!!masteringUpsellLoop}
        loop={masteringUpsellLoop}
        locale={locale}
        onClose={onCloseMasteringUpsell}
        onTryMastering={onTryMastering}
        onUpgrade={onUpgradeFromMasteringUpsell}
      />
    </>
  );
});
