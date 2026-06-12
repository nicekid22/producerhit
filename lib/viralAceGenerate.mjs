import { randomUUID } from "node:crypto";

/**
 * Generate a viral track via generate-loop-ace (sync).
 */
export async function generateViralTrack({ supabaseUrl, anonKey, accessToken, plan }) {
  const generationKey = `viral-${plan.id ?? randomUUID()}`;
  const body = {
    generationKey,
    isSong: plan.is_song !== false,
    instrumental: plan.is_song === false,
    sampleMode: true,
    sampleQuery: plan.sample_query || plan.source_text,
    caption: plan.ace_caption,
    genre: plan.genre,
    bpm: plan.bpm ?? 120,
    duration: Number(process.env.VIRAL_ACE_DURATION_SEC ?? "32"),
    lyrics: plan.lyrics || "",
    useFormat: !(plan.lyrics && plan.lyrics.trim()),
    thinking: true,
    audioFormat: "mp3",
  };

  const url = `${supabaseUrl}/functions/v1/generate-loop-ace`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`ace_${res.status}:${text.slice(0, 400)}`);

  const data = JSON.parse(text);
  const audioUrl = data?.audioUrl ?? data?.audio_url ?? "";
  if (!audioUrl) throw new Error("ace_no_audio_url");

  return {
    audioUrl,
    meta: data?.meta ?? {},
    generationKey,
    caption: data?.caption ?? plan.ace_caption,
    lyrics: data?.lyrics ?? plan.lyrics ?? "",
  };
}
