import type { Loop } from "@/types/loop";
import { coverUrlFromLoop } from "@/lib/loopCoverUrl";

export function isPreviewLoopId(id: string) {
  return id.startsWith("preview-");
}

function loopEntryQualityScore(loop: Loop) {
  let score = 0;
  const cover = coverUrlFromLoop(loop);
  if (cover.startsWith("http://") || cover.startsWith("https://")) score += 120;
  const audio = typeof loop.audioUrl === "string" ? loop.audioUrl.trim() : "";
  if (audio.startsWith("http://") || audio.startsWith("https://") || audio.startsWith("blob:")) score += 60;
  const createdAtMs = Date.parse(loop.createdAt ?? "");
  if (Number.isFinite(createdAtMs)) score += createdAtMs / 1e15;
  return score;
}

/** Une seule entrée par id — garde la variante la plus complète (cover, audio, date). */
export function dedupeLoopsById(loops: Loop[]): Loop[] {
  const bestById = new Map<string, Loop>();
  for (const loop of loops) {
    const id = loop?.id?.trim();
    if (!id) continue;
    const prev = bestById.get(id);
    if (!prev || loopEntryQualityScore(loop) > loopEntryQualityScore(prev)) {
      bestById.set(id, loop);
    }
  }
  const order: string[] = [];
  const seen = new Set<string>();
  for (const loop of loops) {
    const id = loop?.id?.trim();
    if (!id || seen.has(id) || !bestById.has(id)) continue;
    seen.add(id);
    order.push(id);
  }
  return order.map((id) => bestById.get(id)!);
}

/** Retire les previews dont une loop persistée (même titre) existe déjà — évite les doublons visuels. */
export function dropStalePreviewDuplicates(loops: Loop[]) {
  const persistedNames = new Set(
    loops.filter((l) => !isPreviewLoopId(l.id)).map((l) => l.name.trim().toLowerCase()),
  );
  return loops.filter((l) => {
    if (!isPreviewLoopId(l.id)) return true;
    return !persistedNames.has(l.name.trim().toLowerCase());
  });
}
