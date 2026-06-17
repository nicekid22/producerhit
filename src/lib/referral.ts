import toast from "react-hot-toast";
import { getAttribution } from "@/lib/attribution";
import { REFERRAL_REFEREE_BONUS } from "@/lib/referralConfig";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { useLootRevealStore } from "@/stores/lootRevealStore";

import type { AppLocale } from "@/i18n/config";
const CLAIMED_KEY = "producerhit_referral_claimed_v1";

function appOrigin(): string {
  if (typeof window !== "undefined" && window.location.origin) return window.location.origin;
  return "https://www.producerhit.com";
}

export function buildReferralInviteUrl(referralCode: string): string {
  const code = referralCode.trim();
  const url = new URL("/auth", appOrigin());
  url.searchParams.set("utm_source", "referral");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "invite");
  url.searchParams.set("ref", code);
  return url.toString();
}

export async function ensureReferralCode(): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("ensure_referral_code");
    if (error) {
      console.warn("[referral] ensure_referral_code:", error.message);
      return null;
    }
    return typeof data === "string" && data.trim().length > 0 ? data.trim() : null;
  } catch {
    return null;
  }
}

export async function claimReferralIfPending(locale: AppLocale = "en"): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(CLAIMED_KEY) === "1") return false;
  } catch {
    return false;
  }

  const ref = getAttribution()?.ref?.trim();
  if (!ref || ref.length < 4) return false;

  try {
    const { data, error } = await supabase.rpc("claim_referral", { p_ref_code: ref });
    if (error) return false;

    const result = data as { ok?: boolean; error?: string; referee_bonus?: number } | null;
    if (!result?.ok) {
      if (result?.error === "already_claimed" || result?.error === "code_not_found") {
        try {
          window.localStorage.setItem(CLAIMED_KEY, "1");
        } catch {
          void 0;
        }
      }
      return false;
    }

    try {
      window.localStorage.setItem(CLAIMED_KEY, "1");
    } catch {
      void 0;
    }

    const bonus = typeof result.referee_bonus === "number" ? result.referee_bonus : REFERRAL_REFEREE_BONUS;
    useLootRevealStore.getState().showLoot({ kind: "referral", credits: bonus, referralRole: "referee" });
    void useAuthStore.getState().refreshProfile();

    toast.success(
      locale === "fr"
        ? `Parrainage activé — +${bonus} gen bonus (en plus du plan Free) !`
        : `Referral applied — +${bonus} bonus gens on top of your free plan!`,
      { duration: 4500 },
    );
    return true;
  } catch {
    return false;
  }
}
