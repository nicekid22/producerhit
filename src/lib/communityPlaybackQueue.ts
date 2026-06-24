import { publicRowToCoverLoop } from "@/lib/coverArt";
import { unlockAudioPlaybackFromGesture } from "@/lib/audioPlaybackUnlock";
import { resolvePlayableCommunityAudio, type PublicLoopRow } from "@/lib/publicLoops";
import { usePlayerStore } from "@/stores/playerStore";
import type { Loop } from "@/types/loop";

export const COMMUNITY_QUEUE_SOURCE = "community";
export const LANDING_COMMUNITY_QUEUE_SOURCE = "landing_community";
export const PUBLIC_LOOP_QUEUE_SOURCE = "public_loop";
export const BLOG_SAMPLER_QUEUE_SOURCE = "blog_sampler";

export type PlayCommunityQueueOptions = {
  source?: string;
  onResolveStart?: (rowId: string) => void;
  onResolveEnd?: () => void;
  onRowUrlResolved?: (rowId: string, url: string) => void;
};

function normalizeStartIndex(list: PublicLoopRow[], startIndex: number) {
  if (!list.length) return 0;
  return Math.max(0, Math.min(list.length - 1, startIndex));
}

export function findPublicRowIndex(rows: PublicLoopRow[], rowId: string) {
  return rows.findIndex((r) => r.id === rowId);
}

export function landingTrackToPublicRow(track: {
  id: string;
  name: string;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  audioUrl: string | null;
  stemsUrl?: Record<string, unknown> | null;
  prompt: string;
  createdAt?: string | null;
}): PublicLoopRow {
  return {
    id: track.id,
    name: track.name,
    genre: track.genre,
    mood: track.mood,
    bpm: track.bpm,
    prompt: track.prompt,
    audio_url: track.audioUrl,
    stems_url: track.stemsUrl ?? null,
    created_at: track.createdAt ?? null,
  };
}

/** Résout les URLs puis construit une file Loop[] dans l’ordre d’affichage. */
export async function resolvePublicRowsToLoops(
  rows: PublicLoopRow[],
  startIndex: number,
  options?: Pick<PlayCommunityQueueOptions, "onResolveStart" | "onResolveEnd" | "onRowUrlResolved">,
): Promise<{ loops: Loop[]; startIndex: number }> {
  const list = (rows ?? []).filter((r) => r?.id);
  if (!list.length) return { loops: [], startIndex: 0 };

  const idx = normalizeStartIndex(list, startIndex);
  const startRow = list[idx] ?? list[0]!;

  options?.onResolveStart?.(startRow.id);
  try {
    const startUrl = (await resolvePlayableCommunityAudio(startRow).catch(() => ""))?.trim();
    if (!startUrl) return { loops: [], startIndex: 0 };

    if (options?.onRowUrlResolved && !startUrl.startsWith("blob:")) {
      options.onRowUrlResolved(startRow.id, startUrl);
    }

    const resolved: Loop[] = [];
    let resolvedStartIdx = 0;

    const results = await Promise.all(
      list.map(async (r, originalIndex) => {
        const url =
          r.id === startRow.id
            ? startUrl
            : ((await resolvePlayableCommunityAudio(r).catch(() => "")) || r.audio_url?.trim() || "");
        if (!url?.trim()) return null;
        if (options?.onRowUrlResolved && r.id !== startRow.id && !url.startsWith("blob:")) {
          options.onRowUrlResolved(r.id, url.trim());
        }
        return { loop: publicRowToCoverLoop({ ...r, audio_url: url.trim() }), originalIndex };
      }),
    );

    for (const item of results) {
      if (!item) continue;
      if (item.originalIndex === idx) resolvedStartIdx = resolved.length;
      resolved.push(item.loop);
    }

    return { loops: resolved, startIndex: resolvedStartIdx };
  } finally {
    options?.onResolveEnd?.();
  }
}

/** Lance une file communautaire — enchaîne via AudioPlayer.onEnded → store.next(). */
export async function playPublicRowsInQueue(
  rows: PublicLoopRow[],
  startIndex: number,
  options?: PlayCommunityQueueOptions,
): Promise<boolean> {
  unlockAudioPlaybackFromGesture();
  const source = options?.source ?? COMMUNITY_QUEUE_SOURCE;
  const { loops, startIndex: idx } = await resolvePublicRowsToLoops(rows, startIndex, options);
  if (!loops.length) return false;

  const store = usePlayerStore.getState();
  store.markManualPlayback();
  store.setQueue(loops, idx, true, source);
  return true;
}
