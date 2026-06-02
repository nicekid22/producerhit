import { browserAceKeyCount, usesDirectAceFromBrowser } from "@/lib/aceBrowserKeys";

export { usesDirectAceFromBrowser };

/**
 * Parallèle v1+v2 seulement si chaque appel peut utiliser une clé ACE distincte
 * (Edge multi-clés, ou navigateur avec VITE_ACE_STEP_API_KEYS ≥ 2).
 */
export function canParallelizeDualGeneration(): boolean {
  if (!usesDirectAceFromBrowser()) return true;
  return browserAceKeyCount() >= 2;
}
