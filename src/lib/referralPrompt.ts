import { REFERRAL_PROMPT_STORAGE_KEY } from "@/lib/referralConfig";

export function shouldShowReferralInvitePrompt(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(REFERRAL_PROMPT_STORAGE_KEY) !== "1";
  } catch {
    return false;
  }
}

export function markReferralInvitePromptShown(): void {
  try {
    window.localStorage.setItem(REFERRAL_PROMPT_STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}
