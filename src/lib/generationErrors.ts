import type { AppLocale } from "@/i18n/config";
import { normalizePlanId } from "@/lib/planEntitlements";

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

function capacityMessage(locale: AppLocale, plan?: string | null): string {
  const isFree = !plan || plan === "free";
  if (locale === "fr") {
    return isFree
      ? "Le réseau est un peu chargé en ce moment — reprends dans quelques minutes. Sur Pro, tu passes en priorité dans la file."
      : "Le réseau est un peu chargé — reprends dans quelques minutes, ton morceau finira de se générer.";
  }
  return isFree
    ? "The network is a bit busy right now — try again in a few minutes. Pro skips ahead in the queue."
    : "The network is a bit busy — try again in a few minutes and let it finish.";
}

export function formatGenerationErrorMessage(
  raw: string,
  locale: AppLocale,
  options?: GenerationErrorFormatOptions,
): string {
  const msg = normalizeGenerationRawError(raw);
  if (!msg) return locale === "fr" ? "Génération échouée — réessaie dans un instant" : "Generation failed — try again shortly";

  const lower = msg.toLowerCase();
  const plan = options?.plan;

  if (lower.includes("limit reached") || lower.includes("monthly limit") || lower.includes("limite mensuelle")) {
    return locale === "fr" ? "Limite mensuelle atteinte" : "Monthly limit reached";
  }

  if (lower.includes("429") || lower.includes("too many requests") || lower.includes("rate limit")) {
    return locale === "fr"
      ? "Beaucoup de monde génère en ce moment — patiente 30–60 s et relance (ou 1 version)."
      : "Lots of people generating right now — wait 30–60s and retry (or try 1 version).";
  }

  if (isGenerationCapacityError(msg)) {
    return capacityMessage(locale, plan);
  }

  if (lower.includes("cors") || lower.includes("502") || lower.includes("503")) {
    return locale === "fr"
      ? "Serveur temporairement indisponible — réessaie dans un instant"
      : "Server temporarily unavailable — try again shortly";
  }

  if (lower.includes("ace api") || lower.includes("chat/completions") || lower.includes("acemusic")) {
    return locale === "fr"
      ? "Petit couac côté ACE — réessaie, c'est souvent passager"
      : "Quick ACE hiccup — retry, it's usually temporary";
  }

  if (lower.includes("no audio") || lower.includes("audio manquant") || lower.includes("missing audio")) {
    return locale === "fr" ? "ACE n'a pas renvoyé d'audio — relance la génération" : "ACE returned no audio — try again";
  }

  return msg.length > 220 ? `${msg.slice(0, 220)}…` : msg;
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
