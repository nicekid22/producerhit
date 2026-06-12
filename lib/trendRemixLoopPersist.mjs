import { buildDisplayTitle } from "./trendRemixCatalog.mjs";

export async function persistTrendRemixLoop(db, { userId, plan, catalog, aceResult }) {
  const entry = catalog ?? plan.trend_remix_catalog;
  if (!entry) throw new Error("trend_remix_catalog_missing");

  const meta = aceResult.meta && typeof aceResult.meta === "object" ? aceResult.meta : {};
  const bpm = Number(meta.bpm ?? entry.bpm ?? 120) || 120;
  const key = String(meta.key ?? meta.keyScale ?? "C").split(" ")[0] || "C";
  const scale = String(meta.scale ?? meta.keyScale ?? "Major").includes("Minor") ? "Minor" : "Major";
  const displayTitle = plan.display_title || buildDisplayTitle(entry);

  const trendRemixMeta = {
    kind: "trend_remix",
    planId: plan.id,
    catalogId: entry.id,
    originalTitle: entry.original_title,
    originalArtist: entry.original_artist,
    trendKeywords: entry.trend_keywords ?? [],
    searchQueries: entry.search_queries ?? [],
    remixGenre: entry.remix_genre,
    preferredAccount: plan.target_youtube_account ?? "remix1",
    displayTitle,
    videoFormat: "landscape",
    lyricsTheme: entry.lyrics_theme,
  };

  const coverPrompt = `${entry.original_title} ${entry.remix_genre} AI remix album cover cinematic landscape 16:9`;
  const row = {
    user_id: userId,
    name: displayTitle,
    genre: entry.remix_genre,
    influence: `${entry.original_artist} trend remix`,
    key,
    scale,
    bpm,
    loop_length: "16 bars",
    mood: entry.mood ?? "Emotional",
    energy_level: "High",
    reverb: "Medium",
    swing: 0,
    prompt: `${entry.original_title} ${entry.remix_genre} AI remix inspired by ${entry.original_artist}`,
    audio_url: aceResult.audioUrl,
    cover_url: `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt)}?width=1920&height=1080&nologo=true`,
    is_public: true,
    is_saved: true,
    stems_url: {
      ace: {
        isSong: true,
        instrumental: false,
        mode: "song",
        caption: aceResult.caption ?? entry.ace_caption,
        lyrics: aceResult.lyrics ?? "",
        duration: meta.duration ?? entry.duration_sec,
        trendRemix: trendRemixMeta,
      },
    },
  };

  const { data, error } = await db.from("loops").insert(row).select("id").single();
  if (error || !data?.id) throw new Error(error?.message ?? "loop_insert_failed");

  await db
    .from("trend_remix_plans")
    .update({
      loop_id: data.id,
      status: "ready",
      updated_at: new Date().toISOString(),
    })
    .eq("id", plan.id);

  await db.from("social_publish_queue").upsert(
    {
      loop_id: data.id,
      status: "pending",
      attempts: 0,
      last_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "loop_id" },
  );

  await db.from("trend_remix_plans").update({ status: "queued" }).eq("id", plan.id);

  return { loopId: data.id, displayTitle };
}
