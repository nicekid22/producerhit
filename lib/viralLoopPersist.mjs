import { preferredYouTubeAccountForSeries } from "./youtubeChannelStrategy.mjs";

export async function persistViralLoop(db, { userId, plan, aceResult }) {
  const meta = aceResult.meta && typeof aceResult.meta === "object" ? aceResult.meta : {};
  const bpm = Number(meta.bpm ?? plan.bpm ?? 120) || 120;
  const key = String(meta.key ?? meta.keyScale ?? "C").split(" ")[0] || "C";
  const scale = String(meta.scale ?? meta.keyScale ?? "Major").includes("Minor") ? "Minor" : "Major";

  const viralMeta = {
    series: plan.series,
    episodeNum: plan.episode_num,
    conceptId: plan.concept_id,
    hookOpen: plan.hook_open,
    hookReveal: plan.hook_reveal,
    hookCta: plan.hook_cta,
    sourceText: plan.source_text,
    aceCaption: aceResult.caption ?? plan.ace_caption,
    revealPrefix: plan.series === "absurd_to_song" ? "Original text:" : plan.series === "guess_prompt" ? "The prompt was:" : "Prompt:",
    preferredAccount: plan.target_youtube_account ?? preferredYouTubeAccountForSeries(plan.series),
  };

  const coverPrompt = `${plan.display_name} ${plan.genre} album cover aesthetic`;
  const row = {
    user_id: userId,
    name: plan.display_name ?? "Viral AI Song",
    genre: plan.genre ?? "AI Pop",
    influence: "Viral Series",
    key,
    scale,
    bpm,
    loop_length: "4 bars",
    mood: "Funny",
    energy_level: "High",
    reverb: "Medium",
    swing: 0,
    prompt: plan.source_text,
    audio_url: aceResult.audioUrl,
    cover_url: `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt)}?width=1080&height=1920&nologo=true`,
    is_public: true,
    is_saved: true,
    stems_url: {
      ace: {
        isSong: plan.is_song !== false,
        instrumental: plan.is_song === false,
        mode: plan.is_song === false ? "beat" : "song",
        caption: aceResult.caption ?? plan.ace_caption,
        lyrics: aceResult.lyrics ?? "",
        viral: viralMeta,
      },
    },
  };

  const { data, error } = await db.from("loops").insert(row).select("id").single();
  if (error || !data?.id) throw new Error(error?.message ?? "loop_insert_failed");

  await db.from("viral_content_plans").update({
    loop_id: data.id,
    status: "ready",
    updated_at: new Date().toISOString(),
  }).eq("id", plan.id);

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

  await db.from("viral_content_plans").update({ status: "queued" }).eq("id", plan.id);

  return { loopId: data.id, slot: slotForSeries(plan.series) };
}
