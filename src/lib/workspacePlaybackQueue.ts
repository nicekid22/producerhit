import { dropStalePreviewDuplicates } from "@/lib/loopWorkspaceUtils";
import type { Loop } from "@/types/loop";

export type WorkspaceQueueFilter = {
  query: string;
  savedOnly: boolean;
};

function loopTitleBase(name: string) {
  return name.replace(/\s*#\d+\s*$/, "").trim();
}

function loopTitleNum(name: string) {
  const m = name.match(/#(\d+)\s*$/);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) ? n : null;
}

export function compareWorkspaceLoops(a: Loop, b: Loop) {
  const baseA = loopTitleBase(a.name);
  const baseB = loopTitleBase(b.name);
  const numA = loopTitleNum(a.name);
  const numB = loopTitleNum(b.name);
  if (baseA === baseB && numA !== null && numB !== null && numA !== numB) {
    return numB - numA;
  }
  return Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? "");
}

function hasPlayableAudio(loop: Loop | null | undefined) {
  return Boolean(loop && typeof loop.audioUrl === "string" && loop.audioUrl.trim().length > 0);
}

export function filterPlayableLoops(loops: Loop[]) {
  return (loops ?? []).filter((l) => hasPlayableAudio(l));
}

/** Même ordre que `displayedLoops` sur le dashboard (30 entrées max). */
export function buildWorkspacePlaybackQueue(loops: Loop[], filter: WorkspaceQueueFilter, max = 30): Loop[] {
  const normalized = filter.query.trim().toLowerCase();
  const filtered = loops.filter((l) => {
    if (filter.savedOnly && !l.isSaved) return false;
    if (!normalized) return true;
    const hay = `${l.name} ${l.genre} ${l.mood} ${l.key} ${l.scale}`.toLowerCase();
    return hay.includes(normalized);
  });
  return dropStalePreviewDuplicates(
    filtered
      .slice()
      .sort(compareWorkspaceLoops)
      .filter((l, i, arr) => arr.findIndex((x) => x.id === l.id) === i),
  ).slice(0, max);
}

export function findLoopQueueIndex(queue: Loop[], loop: Loop): number {
  const byId = queue.findIndex((l) => l.id === loop.id);
  if (byId >= 0) return byId;
  const nameKey = loop.name.trim().toLowerCase();
  const byName = queue.findIndex((l) => l.name.trim().toLowerCase() === nameKey);
  if (byName >= 0) return byName;
  const byUrl = queue.findIndex((l) => l.audioUrl?.trim() === loop.audioUrl?.trim());
  return byUrl;
}

/** File dashboard complète + index de départ pour une loop (preview ou persistée). */
export function buildWorkspaceQueueFromLoop(allLoops: Loop[], filter: WorkspaceQueueFilter, startLoop: Loop) {
  const workspace = filterPlayableLoops(buildWorkspacePlaybackQueue(allLoops, filter));
  const startIdx = findLoopQueueIndex(workspace, startLoop);
  if (startIdx >= 0) {
    return { queue: workspace, startIndex: startIdx };
  }
  const withStart = filterPlayableLoops([startLoop, ...workspace]);
  return { queue: withStart, startIndex: 0 };
}

/** Génération multi-versions : ordre de fin d’abord, puis le reste de la bibliothèque. */
export function buildGenerationPlaybackQueue(
  allLoops: Loop[],
  filter: WorkspaceQueueFilter,
  completionOrder: Loop[],
  max = 30,
): Loop[] {
  const ready = filterPlayableLoops(completionOrder);
  if (!ready.length) return [];
  const genIds = new Set(ready.map((l) => l.id));
  const workspace = filterPlayableLoops(buildWorkspacePlaybackQueue(allLoops, filter, max)).filter(
    (l) => !genIds.has(l.id),
  );
  return filterPlayableLoops([...ready, ...workspace]);
}
