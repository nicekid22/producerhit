import { extractAceTaskId, isHttpAudioUrl, type Loop, type LoopLength } from "@producerhit/shared";
import { isPlayableCommunityRow, parseStemsUrl, pickHttpAudioUrl } from "./communityPlaybackUtils";
import { invokeSupabaseFunction } from "./edgeInvoke";
import { supabase } from "./supabase";

export { isPlayableCommunityRow } from "./communityPlaybackUtils";

export type CommunityLoop = Loop & {
  authorUsername?: string | null;
  aceTaskId?: string | null;
};

type PublicRow = {
  id: string;
  user_id?: string | null;
  name: string | null;
  genre: string | null;
  influence?: string | null;
  mood: string | null;
  bpm: number | null;
  prompt: string | null;
  audio_url: string | null;
  stems_url: unknown;
  cover_url?: string | null;
  created_at: string | null;
  key?: string | null;
  scale?: string | null;
  loop_length?: string | null;
};

const PUBLIC_SELECT =
  "id, user_id, name, genre, influence, mood, bpm, prompt, audio_url, stems_url, cover_url, created_at, key, scale, loop_length";

function mapPublicRow(row: PublicRow, authorUsername?: string | null): CommunityLoop {
  const httpAudio = pickHttpAudioUrl(row.audio_url, row.stems_url);
  const taskId = extractAceTaskId(row.stems_url);
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    name: row.name?.trim() || "Untitled",
    genre: row.genre?.trim() || "Unknown",
    influence: row.influence?.trim() || "No Influence",
    key: row.key?.trim() || "A",
    scale: row.scale?.trim() || "Minor",
    bpm: row.bpm && row.bpm > 0 ? row.bpm : 120,
    loopLength: (row.loop_length as LoopLength) || "8 bars",
    swing: 0,
    mood: row.mood?.trim() || "",
    energyLevel: "Medium",
    reverb: "Medium",
    prompt: row.prompt?.trim() || "",
    audioUrl: httpAudio,
    coverUrl: row.cover_url,
    stemsUrl: parseStemsUrl(row.stems_url),
    isSaved: false,
    isPublic: true,
    createdAt: row.created_at ?? new Date().toISOString(),
    authorUsername: authorUsername ?? null,
    aceTaskId: taskId || null,
  };
}

async function attachAuthors(rows: CommunityLoop[]): Promise<CommunityLoop[]> {
  const userIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))] as string[];
  if (!userIds.length) return rows;

  const { data, error } = await supabase.rpc("get_public_profile_cards", { p_user_ids: userIds });
  if (error || !Array.isArray(data)) return rows;

  const byId = new Map<string, string>();
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const id = typeof rec.id === "string" ? rec.id : "";
    const username = typeof rec.username === "string" ? rec.username : "";
    if (id && username) byId.set(id, username);
  }

  return rows.map((row) =>
    row.userId && byId.has(row.userId) ? { ...row, authorUsername: byId.get(row.userId) } : row,
  );
}

export async function fetchCommunityLoops(limit = 48): Promise<CommunityLoop[]> {
  const fetchLimit = Math.max(limit * 2, 80);
  const { data, error } = await supabase
    .from("loops")
    .select(PUBLIC_SELECT)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (error) throw error;

  const playable = (data ?? [])
    .filter((row) => isPlayableCommunityRow(row as PublicRow))
    .slice(0, limit)
    .map((row) => mapPublicRow(row as PublicRow));

  return attachAuthors(playable);
}

export async function fetchCommunityLoopById(id: string): Promise<CommunityLoop | null> {
  const trimmed = id.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase
    .from("loops")
    .select(PUBLIC_SELECT)
    .eq("id", trimmed)
    .eq("is_public", true)
    .maybeSingle();

  if (error) throw error;
  if (!data || !isPlayableCommunityRow(data as PublicRow)) return null;

  const rows = await attachAuthors([mapPublicRow(data as PublicRow)]);
  return rows[0] ?? null;
}

export async function resolveCommunityPlaybackUrl(loop: CommunityLoop, accessToken: string): Promise<string | null> {
  if (loop.audioUrl && isHttpAudioUrl(loop.audioUrl)) return loop.audioUrl;

  const taskId = loop.aceTaskId ?? "";
  if (!taskId) return null;

  const { data, errorText } = await invokeSupabaseFunction<{ audioUrl?: string; error?: string }>({
    name: "generate-loop-ace",
    body: { action: "resolve_audio", taskId },
    accessToken,
  });

  if (errorText) return null;
  const url = data?.audioUrl?.trim() ?? "";
  return isHttpAudioUrl(url) ? url : null;
}

export async function prepareCommunityLoopForPlayback(
  loop: CommunityLoop,
  accessToken: string,
): Promise<Loop | null> {
  let audioUrl = loop.audioUrl;
  if (!audioUrl || !isHttpAudioUrl(audioUrl)) {
    audioUrl = await resolveCommunityPlaybackUrl(loop, accessToken);
  }
  if (!audioUrl) return null;
  return { ...loop, audioUrl };
}
