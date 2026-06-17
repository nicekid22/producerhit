import toast from "react-hot-toast";
import { REFERRAL_REFERRER_SIGNUP_BONUS } from "@/lib/referralConfig";
import { trackClientEvent } from "@/lib/supabaseClient";
import { useLootRevealStore } from "@/stores/lootRevealStore";

import type { AppLocale } from "@/i18n/config";
const STORAGE_PREFIX = "producerhit_referral_bonus_seen_";

function readStoredReferralBonus(userId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + userId);
    if (raw == null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.max(0, value) : null;
  } catch {
    return null;
  }
}

function writeStoredReferralBonus(userId: string, value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + userId, String(Math.max(0, value)));
  } catch {
    // ignore
  }
}

export function clearReferralBonusTracking(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + userId);
  } catch {
    // ignore
  }
}

/**
 * Detects when referral_bonus increased (someone used your invite link)
 * and triggers the loot reveal for the referrer.
 */
export function notifyReferrerReferralBonusIfIncreased(
  userId: string,
  previousBonus: number | null | undefined,
  nextBonus: number,
  locale: AppLocale = "fr",
): void {
  if (typeof window === "undefined" || !userId) return;

  const safeNext = Math.max(0, nextBonus);
  const stored = readStoredReferralBonus(userId);

  if (stored === null) {
    writeStoredReferralBonus(userId, safeNext);
    return;
  }

  if (safeNext <= stored) {
    if (safeNext !== stored) writeStoredReferralBonus(userId, safeNext);
    return;
  }

  const delta = safeNext - stored;
  writeStoredReferralBonus(userId, safeNext);

  useLootRevealStore.getState().showLoot({
    kind: "referral",
    credits: delta,
    referralRole: "referrer",
  });

  trackClientEvent("referral_referrer_loot", {
    delta,
    previous_bonus: stored,
    next_bonus: safeNext,
    previous_from_store: previousBonus ?? null,
  });

  toast.success(
    locale === "fr"
      ? `Nouveau filleul — +${delta} gen (parrainage${delta === REFERRAL_REFERRER_SIGNUP_BONUS ? "" : `, total +${delta}`}) !`
      : `New referral signup — +${delta} gens unlocked!`,
    { duration: 4200 },
  );
}
