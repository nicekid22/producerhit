import type { AppLocale } from "@/lib/i18n/catalog";

import { t, type I18nKey } from "@/lib/i18n/catalog";



type ErrorKey =

  | "limitReached"

  | "rateLimit"

  | "authRequired"

  | "timeout"

  | "providerError"

  | "generic";



const ERROR_I18N: Record<ErrorKey, I18nKey> = {

  limitReached: "genErrorLimitReached",

  rateLimit: "genErrorRateLimit",

  authRequired: "genErrorAuth",

  timeout: "genErrorTimeout",

  providerError: "genErrorProvider",

  generic: "genErrorGeneric",

};



export function formatGenerationError(raw: string, locale: AppLocale = "en"): string {

  const msg = (raw || "").trim();

  const lower = msg.toLowerCase();



  let key: ErrorKey = "generic";

  if (lower.includes("limit reached") || lower.includes("monthly limit")) key = "limitReached";

  else if (lower.includes("too many requests") || lower.includes("429")) key = "rateLimit";

  else if (lower.includes("authentication") || lower.includes("not authenticated")) key = "authRequired";

  else if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("504")) key = "timeout";

  else if (lower.includes("sonauto") || lower.includes("ace")) key = "providerError";



  if (key !== "generic") return t(locale, ERROR_I18N[key]);

  return msg || t(locale, ERROR_I18N.generic);

}


