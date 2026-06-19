import type { AppLocale } from "@/i18n/config";
import { normalizePlanId } from "@/lib/planEntitlements";

export { formatGenerationErrorMessage } from "@/i18n/systemCatalog";

export type GenerationErrorFormatOptions = {
  plan?: string | null;
};

export function normalizeGenerationRawError(raw: string): string {
  let msg = (raw || "").trim();
  const songPrefix = /^song generation failed:\s*/i;
  if (songPrefix.test(msg)) msg = msg.replace(songPrefix, "").trim();
  return msg;
}

/** Plafond Supabase Edge / ACE (~150 s) — ne pas re-tenter le même appel (fallback dual séquentiel à la place). */
export function isEdgeWallTimeoutError(raw: string): boolean {
  const lower = normalizeGenerationRawError(raw).toLowerCase();
  return (
    lower.includes("edge timeout") ||
    lower.includes("546") ||
    lower.includes("504") ||
    lower.includes("ace generation timed out") ||
    lower.includes("génération interrompue")
  );
}

/** Relancer les slots manquants en séquentiel après un essai parallel/batch raté. */
export function shouldTriggerDualSequentialFallback(raw: string): boolean {
  return isGenerationCapacityError(raw) || isEdgeWallTimeoutError(raw);
}

/** Timeout Edge, coupure réseau, surcharge — pas un bug « instantané » côté user. */
export function isGenerationCapacityError(raw: string): boolean {
  const lower = normalizeGenerationRawError(raw).toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("504") ||
    lower.includes("546") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("non-2xx") ||
    lower.includes("génération interrompue") ||
    lower.includes("edge function error") ||
    lower.includes("réseau est") ||
    lower.includes("network is a bit busy") ||
    lower.includes("network is busy")
  );
}

export function isRetryableGenerationError(raw: string): boolean {
  if (isEdgeWallTimeoutError(raw)) return false;
  const lower = normalizeGenerationRawError(raw).toLowerCase();
  return (
    lower.includes("too many requests") ||
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("cors") ||
    lower.includes("non-2xx")
  );
}

/** Backoff between retries in startOne (ACE 429 needs longer than generic network). */
export function generationRetryDelayMs(raw: string, attemptIndex: number): number {
  const lower = normalizeGenerationRawError(raw).toLowerCase();
  if (lower.includes("429") || lower.includes("too many requests") || lower.includes("rate limit")) {
    return 2800 + attemptIndex * 3200;
  }
  if (isGenerationCapacityError(raw)) {
    return 2200 + attemptIndex * 1200;
  }
  return 1600 + attemptIndex * 800;
}

const PRIORITY_UPSELL_SESSION_KEY = "producerhit_priority_upsell_gen_fail_v1";

function priorityUpsellStorageKey(plan: string | null | undefined): string {
  return `${PRIORITY_UPSELL_SESSION_KEY}_${normalizePlanId(plan ?? "free")}`;
}

/** Une fois par session et par plan — upsell priorité après échec « réseau chargé ». */
export function shouldPromptPriorityUpsellAfterCapacityError(plan: string | null | undefined): boolean {
  if (normalizePlanId(plan ?? "free") === "plus") return false;
  try {
    return !window.sessionStorage.getItem(priorityUpsellStorageKey(plan));
  } catch {
    return false;
  }
}

export function markPriorityUpsellPrompted(plan?: string | null): void {
  try {
    window.sessionStorage.setItem(priorityUpsellStorageKey(plan), "1");
  } catch {
    void 0;
  }
}