/**
 * Render trend remix landscape MP4 — pro YouTube lyrics templates.
 */
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import ffmpegPath from "ffmpeg-static";
import { extractTrendRemixMeta, resolveTrendRemixDisplayGenre } from "./youtubeSocial.mjs";
import { ensureFilmDustLandscapeTexture } from "./youtubeFilmDustTexture.mjs";
import { resolveTrendRemixCoverPath } from "./youtubeTrendRemixCover.mjs";
import {
  buildProLandscapeRenderArgs,
  renderTrendRemixProOverlay,
} from "./youtubeTrendRemixProLandscape.mjs";
import { resolveTrendRemixVideoDuration } from "./trendRemixVideoDuration.mjs";
import { getTrendRemixTheme, normalizeTrendRemixTheme } from "./youtubeTrendRemixThemes.mjs";
import { assertTrendRemixLyrics } from "./trendRemixLyricsQuality.mjs";

function runFfmpeg(args) {
  const bin = ffmpegPath;
  if (!bin) throw new Error("ffmpeg_binary_missing");
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (c) => {
      stderr += String(c);
    });
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-900)))));
  });
}

export async function renderTrendRemixVideo(loop, { theme, outPath, maxSec, workDir } = {}) {
  if (!loop?.id || !loop?.audio_url) throw new Error("loop_invalid_for_render");
  const meta = extractTrendRemixMeta(loop.stems_url);
  if (!meta?.originalTitle) throw new Error("not_a_trend_remix_loop");

  const themeId = normalizeTrendRemixTheme(theme ?? process.env.TREND_REMIX_LANDSCAPE_THEME);
  const work = workDir ?? (await fs.mkdtemp(join(tmpdir(), "trend-remix-")));
  const ownWork = !workDir;

  const audioPath = join(work, "audio.m4a");
  const videoPath = outPath ?? join(work, "out.mp4");
  const overlayPath = join(work, "overlay.png");

  try {
    const audioRes = await fetch(loop.audio_url);
    if (!audioRes.ok) throw new Error("audio_download_failed");
    await fs.writeFile(audioPath, Buffer.from(await audioRes.arrayBuffer()));

    const sec = await resolveTrendRemixVideoDuration(loop, audioPath, maxSec);

    const coverPath = await resolveTrendRemixCoverPath(loop, work);
    const aceLyrics =
      loop.stems_url?.ace && typeof loop.stems_url.ace === "object"
        ? String(loop.stems_url.ace.lyrics ?? "")
        : "";
    assertTrendRemixLyrics(aceLyrics, "video_render");

    await renderTrendRemixProOverlay({
      outPath: overlayPath,
      theme: themeId,
      originalTitle: meta.originalTitle,
      originalArtist: meta.originalArtist,
      remixGenre: resolveTrendRemixDisplayGenre(loop),
    });

    const themeDef = getTrendRemixTheme(themeId);
    let dustPath;
    let veilPath;
    if (themeDef.useDust) {
      dustPath = await ensureFilmDustLandscapeTexture(join(work, "film-dust.png"));
    }
    if (themeDef.useVeil) {
      const veilSrc = join(process.cwd(), "public", "textures", "prism-landing-veil.png");
      veilPath = existsSync(veilSrc) ? veilSrc : undefined;
    }

    await runFfmpeg(
      buildProLandscapeRenderArgs({
        coverPath,
        overlayPath,
        audioPath,
        outPath: videoPath,
        maxSec: sec,
        theme: themeId,
        lyrics: aceLyrics,
        trendKeywords: meta.trendKeywords ?? [],
        searchQueries: meta.searchQueries ?? [],
        lyricsTheme: meta.lyricsTheme ?? "",
        dustPath,
        veilPath,
      }),
    );

    const bytes = await fs.readFile(videoPath);
    if (bytes.byteLength < 8000) throw new Error("render_too_small");

    return { videoPath, bytes: bytes.byteLength, sec, theme: themeId, work, ownWork };
  } catch (e) {
    if (ownWork) await fs.rm(work, { recursive: true, force: true }).catch(() => undefined);
    throw e;
  }
}

export async function renderAndUploadTrendRemixVideo(db, loop, opts = {}) {
  const { videoPath, bytes, sec, theme, work, ownWork } = await renderTrendRemixVideo(loop, opts);
  try {
    const storagePath = `${loop.user_id}/${loop.id}/youtube-${Date.now()}.mp4`;
    const { error } = await db.storage.from("social-videos").upload(storagePath, await fs.readFile(videoPath), {
      contentType: "video/mp4",
      upsert: true,
      cacheControl: "604800",
    });
    if (error) throw new Error(`upload_failed:${error.message}`);
    return { storagePath, bytes, sec, theme, visual: "pro-landscape" };
  } finally {
    if (ownWork) await fs.rm(work, { recursive: true, force: true }).catch(() => undefined);
  }
}
