import { randomUUID } from "node:crypto";
import { buildAceLyrics } from "./trendRemixCatalog.mjs";
import { assertTrendRemixLyrics, validateTrendRemixLyrics } from "./trendRemixLyricsQuality.mjs";

function pickBestLyrics(inputLyrics, returnedLyrics) {
  const returned = String(returnedLyrics ?? "").trim();
  const input = String(inputLyrics ?? "").trim();
  if (returned && validateTrendRemixLyrics(returned).ok) return returned;
  if (input && validateTrendRemixLyrics(input).ok) return input;
  return returned || input;
}

/**
 * Generate a full trend remix track via generate-loop-ace.
 * Retries when ACE returns incomplete lyrics (verse + chorus required).
 */
export async function generateTrendRemixTrack({ supabaseUrl, anonKey, accessToken, plan, catalog }) {
  const entry = catalog ?? plan.trend_remix_catalog;
  if (!entry) throw new Error("trend_remix_catalog_missing");

  const inputLyrics = buildAceLyrics(entry);
  assertTrendRemixLyrics(inputLyrics, "ace_input");

  const duration = Number(entry.duration_sec ?? process.env.TREND_REMIX_DURATION_SEC ?? 90);
  const maxAttempts = Math.max(1, Math.min(4, Number(process.env.TREND_REMIX_LYRICS_MAX_ATTEMPTS ?? 3)));
  const url = `${supabaseUrl}/functions/v1/generate-loop-ace`;

  let lastReason = "unknown";
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const generationKey = `trend-remix-${plan.id ?? randomUUID()}-a${attempt}`;
    const body = {
      generationKey,
      isSong: true,
      instrumental: false,
      sampleMode: true,
      sampleQuery: entry.sample_query || entry.ace_caption,
      caption: [
        entry.ace_caption,
        `Inspired by the mood of "${entry.original_title}" by ${entry.original_artist}.`,
        `${entry.remix_genre} AI remix — perform complete original lyrics (Verse 1, Chorus, Verse 2, Chorus).`,
        "No placeholder text. Full vocal song structure.",
      ].join(" "),
      genre: entry.remix_genre,
      bpm: entry.bpm ?? 120,
      duration: Math.max(60, Math.min(180, duration)),
      lyrics: inputLyrics,
      useFormat: false,
      thinking: true,
      audioFormat: "mp3",
    };

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

    const finalLyrics = pickBestLyrics(inputLyrics, data?.lyrics ?? "");
    const check = validateTrendRemixLyrics(finalLyrics);
    if (check.ok) {
      return {
        audioUrl,
        meta: data?.meta ?? {},
        generationKey,
        caption: data?.caption ?? entry.ace_caption,
        lyrics: finalLyrics,
        lyricsAttempt: attempt,
        remixGenre: entry.remix_genre,
      };
    }

    lastReason = check.reason ?? "invalid";
    if (attempt < maxAttempts) continue;
  }

  throw new Error(`ace_lyrics_invalid:${lastReason}`);
}
