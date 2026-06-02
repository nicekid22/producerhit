import { parseStemsUrl } from "@/lib/publicLoops";
import { isSongLoop, extractLoopVocalLanguage } from "@/lib/vocalLanguages";
import { supabase } from "@/lib/supabaseClient";
import type { Loop, LoopLength } from "@/types/loop";

/** Snapshot sérialisable pour pending remix (communauté → dashboard). */
export type RemixSourceLoop = {
  id: string;
  name: string;
  genre: string;
  influence: string;
  key: string;
  scale: string;
  bpm: number;
  loopLength: LoopLength;
  swing: number;
  mood: string;
  energyLevel: string;
  reverb: string;
  prompt: string;
  seed: number | null;
  engine?: string;
  lyrics?: string;
  duration?: number | null;
  timeSignature?: string;
  audioFormat?: string;
  stemsUrl?: Record<string, unknown> | null;
};

export function loopToRemixSource(loop: Loop): RemixSourceLoop {
  return {
    id: loop.id,
    name: loop.name,
    genre: loop.genre,
    influence: loop.influence,
    key: loop.key,
    scale: loop.scale,
    bpm: loop.bpm,
    loopLength: loop.loopLength,
    swing: loop.swing,
    mood: loop.mood,
    energyLevel: loop.energyLevel,
    reverb: loop.reverb,
    prompt: loop.prompt,
    seed: loop.seed ?? null,
    engine: loop.engine,
    lyrics: loop.details?.lyrics,
    duration: loop.details?.duration ?? null,
    timeSignature: loop.details?.timeSignature,
    audioFormat: loop.details?.audioFormat,
    stemsUrl: loop.stemsUrl ?? null,
  };
}

export function remixSourceToLoop(src: RemixSourceLoop): Loop {
  const stems = src.stemsUrl ?? null;
  const lyrics = (src.lyrics || "").trim();
  return {
    id: src.id,
    name: src.name,
    genre: src.genre,
    influence: src.influence,
    key: src.key,
    scale: src.scale,
    bpm: src.bpm,
    loopLength: src.loopLength,
    swing: src.swing,
    mood: src.mood,
    energyLevel: src.energyLevel,
    reverb: src.reverb,
    prompt: src.prompt,
    audioUrl: null,
    seed: src.seed,
    engine: src.engine,
    details: {
      lyrics,
      bpm: src.bpm > 0 ? src.bpm : null,
      duration: src.duration ?? null,
      timeSignature: src.timeSignature,
      audioFormat: src.audioFormat,
      caption: src.prompt,
    },
    stemsUrl: stems,
    isSaved: false,
    isPublic: true,
    createdAt: new Date().toISOString(),
  };
}

type DbRemixRow = {
  id: string;
  name: string;
  genre: string;
  influence: string | null;
  key: string | null;
  scale: string | null;
  bpm: number | null;
  loop_length: string | null;
  swing: number | null;
  mood: string | null;
  energy_level: string | null;
  reverb: string | null;
  prompt: string | null;
  stems_url: unknown;
  seed: number | null;
  engine: string | null;
};

/** Charge toutes les métadonnées dispo en DB pour un remix type carte loop. */
export async function fetchRemixSourceLoop(loopId: string): Promise<RemixSourceLoop | null> {
  const { data, error } = await supabase
    .from("loops")
    .select(
      "id,name,genre,influence,key,scale,bpm,loop_length,swing,mood,energy_level,reverb,prompt,stems_url,seed,engine",
    )
    .eq("id", loopId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as DbRemixRow;
  const stems = parseStemsUrl(row.stems_url);
  const ace = stems?.ace && typeof stems.ace === "object" ? (stems.ace as Record<string, unknown>) : null;
  const lyricsFromAce = typeof ace?.lyrics === "string" ? ace.lyrics : "";
  const loopLength = ((row.loop_length || "8 bars") as LoopLength) || "8 bars";
  const partial: RemixSourceLoop = {
    id: row.id,
    name: (row.name || "Track").trim() || "Track",
    genre: (row.genre || "").trim() || "Auto",
    influence: (row.influence || "").trim() || "No Influence",
    key: (row.key || "").trim(),
    scale: (row.scale || "").trim(),
    bpm: typeof row.bpm === "number" && row.bpm > 0 ? row.bpm : 0,
    loopLength,
    swing: typeof row.swing === "number" ? row.swing : 0,
    mood: (row.mood || "").trim(),
    energyLevel: (row.energy_level || "").trim() || "Medium",
    reverb: (row.reverb || "").trim() || "Subtle",
    prompt: (row.prompt || "").trim(),
    seed: typeof row.seed === "number" ? row.seed : null,
    engine: row.engine || undefined,
    lyrics: lyricsFromAce.trim() || undefined,
    duration: typeof ace?.duration === "number" ? (ace.duration as number) : null,
    timeSignature: typeof ace?.timeSignature === "string" ? (ace.timeSignature as string) : undefined,
    audioFormat: typeof ace?.audioFormat === "string" ? (ace.audioFormat as string) : undefined,
    stemsUrl: stems,
  };
  const asLoop = remixSourceToLoop(partial);
  if (!partial.lyrics && typeof asLoop.details?.lyrics === "string") {
    partial.lyrics = asLoop.details.lyrics;
  }
  return partial;
}

export function remixSourceSummary(loop: RemixSourceLoop, locale: "en" | "fr"): string {
  const isFr = locale === "fr";
  const song = isSongLoop(remixSourceToLoop(loop));
  const keyScale = [loop.key, loop.scale].filter(Boolean).join(" ") || (isFr ? "Auto" : "Auto");
  const bpm = loop.bpm > 0 ? `${loop.bpm} BPM` : isFr ? "BPM auto" : "Auto BPM";
  const mode = song ? (isFr ? "Song" : "Song") : isFr ? "Type Beat" : "Type Beat";
  const lang = song ? extractLoopVocalLanguage(remixSourceToLoop(loop)) : null;
  const parts = [loop.genre, bpm, keyScale, mode];
  if (lang) parts.push(isFr ? `voix ${lang}` : `vocals ${lang}`);
  return parts.filter(Boolean).join(" · ");
}
