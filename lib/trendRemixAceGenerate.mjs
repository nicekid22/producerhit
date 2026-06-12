import { randomUUID } from "node:crypto";
import { buildAceLyrics } from "./trendRemixCatalog.mjs";

/**
 * Generate a full trend remix track via generate-loop-ace.
 */
export async function generateTrendRemixTrack({ supabaseUrl, anonKey, accessToken, plan, catalog }) {
  const entry = catalog ?? plan.trend_remix_catalog;
  if (!entry) throw new Error("trend_remix_catalog_missing");

  const generationKey = `trend-remix-${plan.id ?? randomUUID()}`;
  const lyrics = buildAceLyrics(entry);
  const duration = Number(entry.duration_sec ?? process.env.TREND_REMIX_DURATION_SEC ?? 90);

  const body = {
    generationKey,
    isSong: true,
    instrumental: false,
    sampleMode: true,
    sampleQuery: entry.sample_query || entry.ace_caption,
    caption: [
      entry.ace_caption,
      `Inspired by the mood of "${entry.original_title}" by ${entry.original_artist}.`,
      `${entry.remix_genre} AI remix — original lyrics, new production.`,
    ].join(" "),
    genre: entry.remix_genre,
    bpm: entry.bpm ?? 120,
    duration: Math.max(60, Math.min(180, duration)),
    lyrics,
    useFormat: false,
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
    caption: data?.caption ?? entry.ace_caption,
    lyrics: data?.lyrics ?? lyrics,
  };
}
