import { browserAceKeyCount, usesDirectAceFromBrowser } from "@/lib/aceBrowserKeys";

export { usesDirectAceFromBrowser };

/**
 * Parallèle v1+v2 : clés ACE distinctes côté navigateur (≥2) ou Edge (rotation serveur).
 * La v2 attend que la v1 ait un preview (voir Dashboard) + délai — pas de double release_task immédiat.
 */
export function canParallelizeDualGeneration(): boolean {
  if (!usesDirectAceFromBrowser()) return true;
  return browserAceKeyCount() >= 2;
}
