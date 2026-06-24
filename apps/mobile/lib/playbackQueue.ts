import type { Loop } from "@producerhit/shared";
import { fetchUserLoops } from "@/lib/loopsApi";

export function filterPlayableLoops(loops: readonly Loop[]): Loop[] {
  return loops.filter((l) => Boolean(l.audioUrl?.trim()));
}

export function findLoopQueueIndex(queue: readonly Loop[], loop: Loop): number {
  const byId = queue.findIndex((l) => l.id === loop.id);
  if (byId >= 0) return byId;
  const byUrl = queue.findIndex((l) => l.audioUrl?.trim() === loop.audioUrl?.trim());
  if (byUrl >= 0) return byUrl;
  const nameKey = loop.name.trim().toLowerCase();
  return queue.findIndex((l) => l.name.trim().toLowerCase() === nameKey);
}

/** Même logique que le dashboard web — récents d'abord, max 30 pistes jouables. */
export function buildWorkspacePlaybackQueue(loops: readonly Loop[], max = 30): Loop[] {
  return filterPlayableLoops(
    loops
      .slice()
      .sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? "")),
  ).slice(0, max);
}

export function buildWorkspaceQueueFromLoop(allLoops: readonly Loop[], startLoop: Loop) {
  const workspace = buildWorkspacePlaybackQueue(allLoops);
  const startIdx = findLoopQueueIndex(workspace, startLoop);
  if (startIdx >= 0) {
    return { queue: workspace, startIndex: startIdx };
  }
  const withStart = filterPlayableLoops([startLoop, ...workspace]);
  return { queue: withStart, startIndex: 0 };
}

/** File + piste de départ après une génération (autoplay aligné web). */
export async function resolveGenerationPlaybackQueue(
  userId: string,
  loop: Loop,
): Promise<{ queue: Loop[]; start: Loop }> {
  try {
    const all = await fetchUserLoops(userId);
    const merged = all.some((l) => l.id === loop.id) ? all : [loop, ...all];
    const { queue, startIndex } = buildWorkspaceQueueFromLoop(merged, loop);
    const start = queue[startIndex] ?? loop;
    return { queue: queue.length ? queue : [loop], start };
  } catch {
    return { queue: [loop], start: loop };
  }
}
