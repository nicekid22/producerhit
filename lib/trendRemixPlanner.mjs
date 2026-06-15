import { activeCatalogSorted, buildDisplayTitle } from "./trendRemixCatalog.mjs";

/** 4 slots/day — 2 landscape uploads per remix channel. */
export const TREND_REMIX_SLOTS = ["remix1_morning", "remix2_morning", "remix1_evening", "remix2_evening"];

export const SLOT_YOUTUBE_ACCOUNT = {
  remix1_morning: "remix1",
  remix1_evening: "remix1",
  remix2_morning: "remix2",
  remix2_evening: "remix2",
};

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

export async function seedTrendRemixCatalog(db) {
  const rows = activeCatalogSorted().map((c) => ({
    id: c.id,
    original_title: c.original_title,
    original_artist: c.original_artist,
    trend_keywords: c.trend_keywords,
    search_queries: c.search_queries,
    remix_genre: c.remix_genre,
    mood: c.mood,
    bpm: c.bpm,
    duration_sec: c.duration_sec,
    lyrics: c.lyrics ?? "",
    lyrics_theme: c.lyrics_theme,
    ace_caption: c.ace_caption,
    sample_query: c.sample_query,
    trend_score: c.trend_score,
    active: true,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await db.from("trend_remix_catalog").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return rows.length;
}

export async function seedTrendRemixPlansForDay(db, day = dayKey()) {
  await seedTrendRemixCatalog(db);

  const { data: existing } = await db.from("trend_remix_plans").select("slot").eq("day", day);
  const have = new Set((existing ?? []).map((r) => r.slot));
  const missing = TREND_REMIX_SLOTS.filter((s) => !have.has(s));

  if (!missing.length) return { seeded: 0, day };

  const { data: usedRows } = await db
    .from("trend_remix_plans")
    .select("catalog_id")
    .gte("day", new Date(Date.now() - 21 * 86400000).toISOString().slice(0, 10))
    .limit(200);
  const usedIds = new Set((usedRows ?? []).map((r) => r.catalog_id));

  const pool = activeCatalogSorted().filter((c) => !usedIds.has(c.id));
  const catalog = pool.length ? pool : activeCatalogSorted();

  const rows = missing.map((slot, i) => {
    const idx = (hash(`${day}:${slot}`) + i) % catalog.length;
    const entry = catalog[idx];
    return {
      day,
      slot,
      catalog_id: entry.id,
      target_youtube_account: SLOT_YOUTUBE_ACCOUNT[slot],
      display_title: buildDisplayTitle(entry),
      status: "planned",
    };
  });

  const { error } = await db.from("trend_remix_plans").insert(rows);
  if (error) throw new Error(error.message);
  return { seeded: rows.length, day };
}

export async function getNextTrendRemixPlan(db) {
  const today = dayKey();
  await seedTrendRemixPlansForDay(db, today);

  for (const slot of TREND_REMIX_SLOTS) {
    const { data } = await db
      .from("trend_remix_plans")
      .select("*, trend_remix_catalog(*)")
      .eq("day", today)
      .eq("slot", slot)
      .in("status", ["planned", "failed"])
      .maybeSingle();
    if (data) return data;
  }
  return null;
}

export async function markTrendRemixPlan(db, id, patch) {
  await db
    .from("trend_remix_plans")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export { dayKey };
