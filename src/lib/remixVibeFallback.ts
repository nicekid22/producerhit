/**
 * Remix sans upload ACE (api.acemusic.ai — release_task / music/generate en 404).
 * Par défaut : recréer une vibe via Song / Beat avec le même prompt.
 *
 * Rollback upload ACE : VITE_REMIX_UPLOAD_ENABLED=1 (Vercel + rebuild).
 */

import type { AppLocale } from "@/i18n/config";
import { getRemixVibeCopy } from "@/i18n/remixStudioCatalog";

export function isRemixUploadEnabled(): boolean {
  return import.meta.env.VITE_REMIX_UPLOAD_ENABLED === "1";
}

export function isRemixVibeRecreateEnabled(): boolean {
  return !isRemixUploadEnabled();
}

/** @deprecated Use getRemixVibeCopy(locale) — kept for legacy imports */
export const REMIX_VIBE_FALLBACK_COPY = {
  fr: getRemixVibeCopy("fr"),
  en: getRemixVibeCopy("en"),
} as const;

export { getRemixVibeCopy };
