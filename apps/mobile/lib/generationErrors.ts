import type { AppLocale } from "@/lib/i18n/catalog";

type ErrorKey =
  | "limitReached"
  | "rateLimit"
  | "authRequired"
  | "timeout"
  | "providerError"
  | "generic";

const MESSAGES = {
  en: {
    limitReached: "Monthly generation limit reached. Upgrade to Pro for more beats.",
    rateLimit: "Slow down — wait a few seconds before generating again.",
    authRequired: "Please sign in again.",
    timeout: "Generation took too long. Try again — ACE may be busy.",
    providerError: "Audio provider error. Try again in a minute.",
    generic: "Generation failed. Please try again.",
  },
  fr: {
    limitReached: "Limite mensuelle atteinte. Passe Pro pour plus de générations.",
    rateLimit: "Doucement — attends quelques secondes avant de regénérer.",
    authRequired: "Reconnecte-toi.",
    timeout: "La génération a pris trop de temps. Réessaie — ACE est peut-être occupé.",
    providerError: "Erreur du fournisseur audio. Réessaie dans une minute.",
    generic: "Échec de la génération. Réessaie.",
  },
} as const;

function messagesFor(locale: AppLocale): Record<ErrorKey, string> {
  return locale === "fr" ? MESSAGES.fr : MESSAGES.en;
}

export function formatGenerationError(raw: string, locale: AppLocale = "en"): string {
  const msg = (raw || "").trim();
  const lower = msg.toLowerCase();
  const t = messagesFor(locale);

  if (lower.includes("limit reached") || lower.includes("monthly limit")) return t.limitReached;
  if (lower.includes("too many requests") || lower.includes("429")) return t.rateLimit;
  if (lower.includes("authentication") || lower.includes("not authenticated")) return t.authRequired;
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("504")) return t.timeout;
  if (lower.includes("sonauto") || lower.includes("ace")) return t.providerError;

  return msg || t.generic;
}
