import { savePendingRemix } from "@/lib/pendingRemix";
import { fetchRemixSourceLoop } from "@/lib/remixSourceLoop";
import { isRemixVibeRecreateEnabled } from "@/lib/remixVibeFallback";
import { resolvePlayableCommunityAudio, type PublicLoopRow } from "@/lib/publicLoops";

export type RemixHandoffSource = "community" | "public_loop" | "landing";

export type RemixHandoffInput = {
  id: string;
  name: string;
  prompt?: string | null;
  genre?: string | null;
  mood?: string | null;
  bpm?: number | null;
  audioUrl?: string | null;
  stemsUrl?: Record<string, unknown> | null;
};

function toPublicLoopRow(input: RemixHandoffInput): PublicLoopRow {
  return {
    id: input.id,
    name: input.name,
    prompt: input.prompt ?? null,
    genre: input.genre ?? null,
    mood: input.mood ?? null,
    bpm: input.bpm ?? null,
    audio_url: input.audioUrl ?? null,
    stems_url: input.stemsUrl ?? null,
    cover_url: null,
    created_at: null,
    user_id: null,
    is_public: true,
    play_count: 0,
    rating_avg: null,
    rating_count: 0,
  } as PublicLoopRow;
}

/** Même handoff que /community → dashboard?remix=1 */
export async function handoffRemixToDashboard(
  input: RemixHandoffInput,
  source: RemixHandoffSource,
): Promise<{ ok: true } | { ok: false; error: "metadata" | "audio" }> {
  let audioUrl = "";
  if (!isRemixVibeRecreateEnabled()) {
    try {
      audioUrl = input.audioUrl?.trim() || (await resolvePlayableCommunityAudio(toPublicLoopRow(input)));
    } catch {
      return { ok: false, error: "audio" };
    }
  }

  const sourceLoop = await fetchRemixSourceLoop(input.id);
  if (!sourceLoop && isRemixVibeRecreateEnabled()) {
    return { ok: false, error: "metadata" };
  }

  savePendingRemix({
    sourceLoopId: input.id,
    sourceLoopName: (input.name || "Track").trim() || "Track",
    audioUrl,
    prompt: sourceLoop?.prompt || (input.prompt || "").trim(),
    genre: sourceLoop?.genre || input.genre || undefined,
    mood: sourceLoop?.mood || input.mood || undefined,
    bpm:
      sourceLoop?.bpm && sourceLoop.bpm > 0
        ? sourceLoop.bpm
        : typeof input.bpm === "number" && input.bpm > 0
          ? input.bpm
          : undefined,
    source: source === "landing" ? "community" : source,
    sourceLoop: sourceLoop ?? undefined,
  });

  return { ok: true };
}
