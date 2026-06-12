import { createClient } from "@supabase/supabase-js";
import { conceptById, conceptsForSeries } from "./viralContentCatalog.mjs";
import { preferredYouTubeAccountForSeries } from "./youtubeChannelStrategy.mjs";
import { pickScrollHook, pickViralCta } from "./viralHooks.mjs";
import { seriesForSlot, slotForSeries, VIRAL_SLOTS } from "./viralSeriesTypes.mjs";

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function hash(s) {
  let h = 2166136261;
  const str = String(s ?? "x");
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickConcept(seriesId, day, slot, usedIds) {
  const pool = conceptsForSeries(seriesId).filter((c) => !usedIds.has(c.id));
  const list = pool.length ? pool : conceptsForSeries(seriesId);
  const idx = hash(`${day}:${slot}:${seriesId}`) % list.length;
  return list[idx];
}

function buildPlanRow(concept, day, slot, episodeNum) {
  const seed = `${day}:${slot}:${concept.id}`;
  const seriesMeta = { comment_to_song: "Someone asked for this.", absurd_to_song: "This shouldn't be a song.", guess_prompt: "Guess the prompt." };
  return {
    day,
    slot,
    series: concept.series,
    episode_num: episodeNum,
    concept_id: concept.id,
    source_text: concept.sourceText,
    ace_caption: concept.aceCaption,
    sample_query: concept.sampleQuery,
    lyrics: concept.lyrics ?? "",
    genre: concept.genre,
    bpm: concept.bpm,
    is_song: concept.isSong !== false,
    display_name: concept.displayName,
    hook_open: concept.hookOpen ?? seriesMeta[concept.series] ?? pickScrollHook(seed),
    hook_reveal: concept.hookReveal ?? concept.sourceText,
    hook_cta: pickViralCta(seed),
    target_youtube_account: preferredYouTubeAccountForSeries(concept.series),
    status: "planned",
  };
}

export async function seedViralPlansForDay(db, day = dayKey()) {
  const { data: existing } = await db.from("viral_content_plans").select("slot").eq("day", day);
  const have = new Set((existing ?? []).map((r) => r.slot));
  const missing = VIRAL_SLOTS.filter((s) => !have.has(s));

  if (!missing.length) return { seeded: 0, day };

  const { data: recent } = await db
    .from("viral_content_plans")
    .select("concept_id")
    .gte("day", new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10))
    .limit(200);
  const usedIds = new Set((recent ?? []).map((r) => r.concept_id));

  const { data: maxRow } = await db
    .from("viral_content_plans")
    .select("episode_num")
    .order("episode_num", { ascending: false })
    .limit(1)
    .maybeSingle();
  const baseEpisode = maxRow?.episode_num ?? 0;

  const rows = missing.map((slot, i) => {
    const seriesId = seriesForSlot(slot);
    const concept = pickConcept(seriesId, day, slot, usedIds);
    usedIds.add(concept.id);
    return buildPlanRow(concept, day, slot, baseEpisode + i + 1);
  });

  const { error } = await db.from("viral_content_plans").insert(rows);
  if (error) throw new Error(error.message);
  return { seeded: rows.length, day };
}

export async function getNextViralPlan(db) {
  const today = dayKey();
  await seedViralPlansForDay(db, today);

  for (const slot of VIRAL_SLOTS) {
    const { data } = await db
      .from("viral_content_plans")
      .select("*")
      .eq("day", today)
      .eq("slot", slot)
      .in("status", ["planned", "failed"])
      .maybeSingle();
    if (data) return data;
  }

  return null;
}

export async function markPlan(db, id, patch) {
  await db
    .from("viral_content_plans")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export { conceptById, dayKey, slotForSeries, seriesForSlot };
