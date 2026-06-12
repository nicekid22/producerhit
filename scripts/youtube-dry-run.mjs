/**
 * Dry-run YouTube Shorts — render + metadata, NO upload, NO cron post.
 * Usage: npm run youtube:dry-run -- [loopId]
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import ffmpegPath from "ffmpeg-static";
import { resolveYouTubePreferredAccount } from "../lib/youtubeChannelStrategy.mjs";
import { buildYouTubeUploadMetadata } from "../lib/youtubeMetadata.mjs";
import { buildYoutubeRenderArgs, pickYouTubeHook, youtubePreviewSec, youtubeViralPreviewSec } from "../lib/youtubeVideoRender.mjs";
import { extractViralMeta } from "../lib/youtubeViralTemplate.mjs";
import { inferTrackKind } from "../lib/youtubeSocial.mjs";
import { resolveLoopCoverPath } from "../lib/youtubeCoverResolve.mjs";
import { resolveViralVisualAssets, viralVisualMode } from "../lib/youtubeViralVisual.mjs";
import { communityTemplateMode, playerThemeForAccount, renderPlayerCardPng, ensureFilmDustTexture, renderBrandWordmarkPng } from "../lib/youtubePlayerTemplate.mjs";
import { getPlayerTheme } from "../lib/youtubePlayerThemes.mjs";
import { playerCardFramePos } from "../lib/youtubePlayerCard.mjs";
import { listYouTubeAccountIds, loadYouTubeAccount } from "../lib/youtubeAccounts.mjs";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadDotEnv();

const LOOP_ID = (process.argv[2] ?? "1bca92cd-8c6f-454c-b532-693063de8231").trim();
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const OUT = join(process.cwd(), "tmp-youtube-dry-run.mp4");

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (c) => {
      stderr += String(c);
    });
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-600)))));
  });
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("missing_supabase_credentials");

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: loop } = await db
    .from("loops")
    .select("id,name,genre,bpm,key,scale,audio_url,cover_url,is_public,stems_url,user_id")
    .eq("id", LOOP_ID)
    .maybeSingle();
  if (!loop?.audio_url) throw new Error("loop_not_found");

  const trackKind = inferTrackKind(loop.stems_url, loop.name ?? "");
  const viralMeta = extractViralMeta(loop.stems_url);
  const isViral = Boolean(viralMeta?.series);
  const account = resolveYouTubePreferredAccount({ viralMeta, trackKind });
  const theme = playerThemeForAccount(account);
  const sec = isViral ? youtubeViralPreviewSec() : youtubePreviewSec();
  const hook = pickYouTubeHook({ loopId: LOOP_ID, kind: trackKind, account: isViral ? "" : account });

  const work = await fs.mkdtemp(join(tmpdir(), "yt-dry-"));
  const audioPath = join(work, "audio.m4a");
  const outPath = join(work, "out.mp4");

  const audioRes = await fetch(loop.audio_url);
  if (!audioRes.ok) throw new Error("audio_download_failed");
  await fs.writeFile(audioPath, Buffer.from(await audioRes.arrayBuffer()));

  let coverPath = null;
  let stockVideoPath = null;
  let cardPath = null;
  let wordmarkPath = null;
  let dustPath = null;

  if (isViral) {
    const viralVisual = await resolveViralVisualAssets({
      loop,
      workDir: work,
      series: viralMeta.series,
      loopId: LOOP_ID,
    });
    coverPath = viralVisual.coverPath;
    stockVideoPath = viralVisual.stockVideoPath;
  } else {
    coverPath = await resolveLoopCoverPath(loop, work);
    if (!coverPath) throw new Error("community_cover_unavailable");
    if (communityTemplateMode() === "player") {
      cardPath = join(work, "player-card.png");
      await renderPlayerCardPng({
        coverPath,
        title: loop.name ?? "Untitled",
        trackKind,
        theme,
        outPath: cardPath,
      });
      wordmarkPath = join(work, "wordmark.png");
      await renderBrandWordmarkPng(theme, playerCardFramePos().cardY, wordmarkPath);
      if (getPlayerTheme(theme).useDust) dustPath = await ensureFilmDustTexture();
    }
  }

  console.log("\n🧪 YouTube dry-run — aucun upload, aucun post\n");
  console.log(`Loop      : ${loop.name} (${LOOP_ID})`);
  console.log(`Public    : ${loop.is_public ? "yes" : "NO — ne serait pas publié"}`);
  console.log(`Type      : ${isViral ? `viral · ${viralMeta.series}` : `community · ${trackKind}`}`);
  console.log(`Chaîne    : @${account}`);
  if (!isViral) console.log(`Thème     : ${theme}`);
  if (isViral) console.log(`Viral vis : ${viralVisualMode()} (${coverPath ? "cover" : stockVideoPath ? "stock" : "?"})`);
  console.log(`Durée     : ${sec}s`);
  console.log(`Hook      : "${hook}"\n`);

  const ytReady = loadYouTubeAccount(account);
  console.log(`OAuth @${account} : ${ytReady ? "✅ prêt" : "❌ token manquant"}`);

  const platforms = (process.env.SOCIAL_PUBLISH_PLATFORMS ?? "youtube").split(",").map((s) => s.trim());
  console.log(`Plateformes configurées : ${platforms.join(", ")}`);
  console.log("\n⏳ Render ffmpeg local…");

  await runFfmpeg(
    buildYoutubeRenderArgs({
      coverPath,
      stockVideoPath,
      cardPath,
      wordmarkPath,
      dustPath,
      audioPath,
      outPath,
      maxSec: sec,
      loopId: LOOP_ID,
      trackKind,
      hook,
      stemsUrl: loop.stems_url,
      viralMeta,
      playerTheme: theme,
    }),
  );

  const bytes = await fs.readFile(outPath);
  await fs.copyFile(outPath, OUT);

  const shareUrl = `https://www.producerhit.com/loop/${LOOP_ID}?utm_source=youtube&utm_medium=shorts&utm_campaign=${account}`;
  const uploadMeta = buildYouTubeUploadMetadata({
    loopId: LOOP_ID,
    name: loop.name ?? "Untitled",
    genre: loop.genre ?? "AI",
    bpm: loop.bpm,
    key: [loop.key, loop.scale].filter(Boolean).join(" "),
    kind: trackKind,
    shareUrl,
    accountId: account,
    viralMeta,
  });

  console.log(`\n✅ Vidéo : ${OUT} (${(bytes.byteLength / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`\nTitre YouTube (${uploadMeta.ab.titleVariant}):`);
  console.log(`  ${uploadMeta.title}`);
  console.log("\nDescription (extrait):");
  console.log(`  ${uploadMeta.description.split("\n").slice(0, 4).join("\n  ")}`);
  console.log(`\nTags: ${uploadMeta.tags.slice(0, 8).join(", ")}…`);

  const blockers = [];
  if (!loop.is_public) blockers.push("loop_not_public");
  if (!ytReady) blockers.push(`youtube_oauth_${account}`);
  if (bytes.byteLength < 8000) blockers.push("video_too_small");

  console.log("\n--- Verdict ---");
  if (blockers.length) {
    console.log(`⛔ Post bloqué : ${blockers.join(", ")}`);
  } else {
    console.log("✅ Prêt pour un vrai post (quand tu voudras : npm run youtube:test-post -- " + LOOP_ID + ")");
  }
  console.log("\n(Dry-run terminé — rien n'a été publié.)\n");

  await fs.rm(work, { recursive: true, force: true }).catch(() => undefined);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
