import { browserAceKeyCount, usesDirectAceFromBrowser } from "@/lib/aceBrowserKeys";

export { usesDirectAceFromBrowser };

/**
 * Parallèle v1+v2 : clés ACE distinctes côté navigateur (≥2) ou Edge (rotation serveur).
 * Les deux versions partent en même temps (voir Dashboard) — plusieurs clés ACE côté Edge.
 */
export function canParallelizeDualGeneration(): boolean {
  if (!usesDirectAceFromBrowser()) return true;
  return browserAceKeyCount() >= 2;
}
