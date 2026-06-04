import type { Loop } from "@/types/loop";
import { isPersistedStorageCoverUrl, resolveLoopDisplayCoverUrl } from "@/lib/coverArt";

/** Même visuel pinimg sous tailles différentes → une seule clé de dédup. */
export function normalizePinterestImageUrl(url: string): string {
  const t = url.trim();
  if (!t) return t;
  try {
    const u = new URL(t);
    if (!u.hostname.includes("pinimg.com")) return t;
    const path = u.pathname.replace(/\/\d+x\//i, "/");
    return `${u.protocol}//${u.hostname}${path}`;
  } catch {
    return t;
  }
}

const sessionUsed = new Set<string>();

function remember(url: string) {
  const raw = url.trim();
  if (!raw) return;
  sessionUsed.add(raw);
  if (raw.includes("pinimg.com")) sessionUsed.add(normalizePinterestImageUrl(raw));
}

/** Évite deux morceaux avec la même pinimg dans la même session (avant écriture DB). */
export function isPinterestCoverUsedInSession(url: string): boolean {
  const raw = url.trim();
  if (!raw) return false;
  if (sessionUsed.has(raw)) return true;
  if (raw.includes("pinimg.com")) return sessionUsed.has(normalizePinterestImageUrl(raw));
  return false;
}

export function rememberPinterestCoverUrl(url: string): void {
  remember(url);
}

/** Pré-charge les covers déjà visibles (workspace + historique chargé). */
export function seedPinterestDedupFromLoops(loops: Loop[]): void {
  for (const loop of loops) {
    const url = resolveLoopDisplayCoverUrl(loop)?.trim();
    if (!url) continue;
    if (url.includes("pinimg.com") || isPersistedStorageCoverUrl(url)) remember(url);
    const stems = loop.stemsUrl?.ace;
    if (stems && typeof stems === "object") {
      const stored = (stems as Record<string, unknown>).coverUrl;
      if (typeof stored === "string" && stored.startsWith("http")) remember(stored);
    }
  }
}
