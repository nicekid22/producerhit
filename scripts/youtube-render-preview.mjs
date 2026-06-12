/**
 * Local preview — community cover or viral stock B-roll (no upload).
 * Usage:
 *   npm run youtube:render-preview -- [loopId] [theme]
 *   theme: cinema | prism | warm-glass  (default: YOUTUBE_PLAYER_THEME or cinema)
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import ffmpegPath from "ffmpeg-static";
import { buildYoutubeRenderArgs, pickYouTubeHook, youtubePreviewSec, youtubeViralPreviewSec } from "../lib/youtubeVideoRender.mjs";
import { extractViralMeta } from "../lib/youtubeViralTemplate.mjs";
import { inferTrackKind } from "../lib/youtubeSocial.mjs";
import { resolveLoopCoverPath } from "../lib/youtubeCoverResolve.mjs";
import { resolveViralVisualAssets } from "../lib/youtubeViralVisual.mjs";
import { communityTemplateMode, playerTheme, renderPlayerCardPng, ensureFilmDustTexture, renderBrandWordmarkPng } from "../lib/youtubePlayerTemplate.mjs";
import { getPlayerTheme, normalizePlayerTheme } from "../lib/youtubePlayerThemes.mjs";
import { playerCardFramePos } from "../lib/youtubePlayerCard.mjs";

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

const args = process.argv.slice(2);
const LOOP_ID = (args[0] ?? "68a91ff1-42b4-42f0-b719-5e6481aafba1").trim();
const THEME = normalizePlayerTheme(args[1] ?? process.env.YOUTUBE_PLAYER_THEME ?? playerTheme());
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const OUT = join(process.cwd(), `tmp-youtube-${THEME}-preview.mp4`);

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
  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: loop } = await db
    .from("loops")
    .select("id,name,genre,audio_url,cover_url,is_public,stems_url")
    .eq("id", LOOP_ID)
    .maybeSingle();
  if (!loop?.audio_url) throw new Error("loop_not_found");

  const trackKind = inferTrackKind(loop.stems_url, loop.name ?? "");
  const viralMeta = extractViralMeta(loop.stems_url);
  const isViral = Boolean(viralMeta?.series);
  const hook = pickYouTubeHook({ loopId: LOOP_ID, kind: trackKind });
  const sec = isViral ? youtubeViralPreviewSec() : youtubePreviewSec();

  const work = await fs.mkdtemp(join(tmpdir(), "yt-art-"));
  const audioPath = join(work, "audio.m4a");
  const outPath = join(work, "out.mp4");

  const audioRes = await fetch(loop.audio_url);
  if (!audioRes.ok) throw new Error("download_failed");
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
    console.log(`Viral ${viralMeta.series} — ${viralVisual.mode}: ${coverPath ?? stockVideoPath ?? "missing"}`);
  } else {
    coverPath = await resolveLoopCoverPath(loop, work);
    console.log(`Community — cover: ${coverPath ?? "missing"}`);
    if (coverPath && communityTemplateMode() === "player") {
      cardPath = join(work, "player-card.png");
      await renderPlayerCardPng({
        coverPath,
        title: loop.name ?? "Untitled",
        trackKind,
        theme: THEME,
        outPath: cardPath,
      });
      wordmarkPath = join(work, "wordmark.png");
      await renderBrandWordmarkPng(THEME, playerCardFramePos().cardY, wordmarkPath);
      console.log(`Template player (${THEME}) — card ok`);
      if (getPlayerTheme(THEME).useDust) {
        dustPath = await ensureFilmDustTexture();
      }
    }
  }

  console.log(`Render ${sec}s — ${isViral ? `viral ${viralMeta.series}` : `hook: "${hook}"`}`);
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
      playerTheme: THEME,
    }),
  );

  const bytes = await fs.readFile(outPath);
  await fs.copyFile(outPath, OUT);
  if (THEME === "cinema") {
    await fs.copyFile(outPath, join(process.cwd(), "tmp-youtube-art-preview.mp4")).catch(() => undefined);
  }
  await fs.rm(work, { recursive: true, force: true }).catch(() => undefined);
  console.log(`✅ ${OUT} (${(bytes.byteLength / 1024 / 1024).toFixed(2)} MB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
