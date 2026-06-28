import type { AppLocale } from "@/i18n/config";
import { buildUpsellCopy } from "@/i18n/growthUpsellCatalog";
import {
  canDualGeneration,
  canExportWav,
  hasCommercialUseRights,
  hasFullMastering,
  hasPriorityGeneration,
  canUseProducerTag,
  normalizePlanId,
  type PaidPlanId,
} from "@/lib/planEntitlements";
export type UpsellReason =
  | "credits_exhausted"
  | "credits_low"
  | "post_generation"
  | "limit_reached"
  | "wav_export"
  | "feature_wav_format"
  | "feature_priority"
  | "feature_dual_generation"
  | "feature_voice_to_song"
  | "feature_voice_clone"
  | "feature_stems"
  | "feature_no_watermark"
  | "feature_permanent_audio"
  | "feature_commercial_download"
  | "feature_producer_tag";

export type UpsellContext = {
  source: string;
  /** Plan effectif au moment du prompt (évite free en cache vs quota Studio). */
  plan?: string;
  remaining?: number;
  totalLimit?: number;
  usedThisMonth?: number;
};

/** Ne pas afficher de modal upgrade incohérent (ex. « Passe Pro » pour un compte Studio). */
export function shouldShowPlanUpsell(
  plan: string | null | undefined,
  reason: UpsellReason,
  ctx: UpsellContext = { source: "unknown" },
): boolean {
  const cur = normalizePlanId(plan);
  const remaining = Math.max(0, ctx.remaining ?? 0);
  const target = recommendedUpgradePlan(plan);

  switch (reason) {
    case "credits_low":
      return cur === "free" && remaining > 0 && remaining <= 2;
    case "post_generation":
      return cur === "free";
    case "feature_priority":
      return !hasPriorityGeneration(plan);
    case "feature_dual_generation":
      return !canDualGeneration(plan);
    case "feature_voice_to_song":
      return !hasFullMastering(plan);
    case "feature_voice_clone":
      return !hasFullMastering(plan);
    case "feature_stems":
      return normalizePlanId(plan) !== "plus";
    case "feature_no_watermark":
      return !hasCommercialUseRights(plan);
    case "feature_permanent_audio":
      return normalizePlanId(plan) !== "plus";
    case "feature_commercial_download":
      return !hasCommercialUseRights(plan);
    case "wav_export":
      return !hasFullMastering(plan);
    case "feature_wav_format":
      return !canExportWav(plan);
    case "feature_producer_tag":
      return !canUseProducerTag(plan);
    case "credits_exhausted":
    case "limit_reached":
      return remaining < 1;
    default:
      return cur === "free" || target !== null;
  }
}

const LOW_CREDITS_SESSION_KEY = "producerhit_low_credits_prompt_v1";
const EXHAUSTED_CREDITS_SESSION_KEY = "producerhit_exhausted_upsell_v2";
const POST_GEN_COOLDOWN_KEY = "producerhit_upgrade_prompt_ts";
const POST_GEN_COOLDOWN_MS = 3 * 60 * 60 * 1000;

export function recommendedUpgradePlan(plan: string | null | undefined): PaidPlanId | null {
  const cur = normalizePlanId(plan);
  if (cur === "free") return "pro";
  if (cur === "pro") return "studio";
  if (cur === "studio") return "plus";
  return null;
}

/** Cible upsell après erreur « réseau chargé » selon le plan actuel. */
export function priorityUpsellTarget(plan: string | null | undefined): PaidPlanId {
  const cur = normalizePlanId(plan);
  if (cur === "free") return "pro";
  return "plus";
}

export function shouldShowLowCreditsPrompt(plan: string, remaining: number): boolean {
  if (normalizePlanId(plan) !== "free") return false;
  if (remaining <= 0 || remaining > 2) return false;
  try {
    return sessionStorage.getItem(LOW_CREDITS_SESSION_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markLowCreditsPromptShown(): void {
  try {
    sessionStorage.setItem(LOW_CREDITS_SESSION_KEY, "1");
  } catch {
    void 0;
  }
}

/** Popup quota épuisé — une fois par session (tous plans, Studio → Plus inclus). */
export function shouldShowExhaustedCreditsPrompt(): boolean {
  try {
    return sessionStorage.getItem(EXHAUSTED_CREDITS_SESSION_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markExhaustedCreditsPromptShown(): void {
  try {
    sessionStorage.setItem(EXHAUSTED_CREDITS_SESSION_KEY, "1");
  } catch {
    void 0;
  }
}

export function creditsBlockedReason(remaining: number, cost = 1): UpsellReason {
  return remaining < cost ? "credits_exhausted" : "credits_low";
}

export function shouldShowPostGenerationPrompt(): boolean {
  try {
    const lastRaw = localStorage.getItem(POST_GEN_COOLDOWN_KEY);
    const last = lastRaw ? Number(lastRaw) : 0;
    const now = Date.now();
    if (!Number.isFinite(last) || now - last > POST_GEN_COOLDOWN_MS) {
      localStorage.setItem(POST_GEN_COOLDOWN_KEY, String(now));
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

export type UpsellCopy = {
  title: string;
  description: string;
  bullets: string[];
  primaryLabel: string;
  secondaryLabel: string;
  targetPlan: PaidPlanId | null;
};

export function getUpsellCopy(
  reason: UpsellReason,
  locale: AppLocale,
  plan: string,
  ctx: UpsellContext = { source: "unknown" },
): UpsellCopy {
  return buildUpsellCopy(reason, locale, plan, ctx);
}
