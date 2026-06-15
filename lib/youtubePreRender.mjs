/**

 * Render YouTube MP4 locally (ffmpeg) and upload to social-videos bucket.

 */

import { spawn } from "node:child_process";

import { promises as fs } from "node:fs";

import { tmpdir } from "node:os";

import { join } from "node:path";

import ffmpegPath from "ffmpeg-static";

import { buildYoutubeRenderArgs, pickYouTubeHook, youtubePreviewSec, youtubeViralPreviewSec } from "./youtubeVideoRender.mjs";

import { extractViralMeta, extractTrendRemixMeta, inferTrackKind } from "./youtubeSocial.mjs";

import { renderAndUploadTrendRemixVideo } from "./trendRemixVideoRender.mjs";

import { resolveLoopCoverPath } from "./youtubeCoverResolve.mjs";

import { resolveViralVisualAssets } from "./youtubeViralVisual.mjs";

import { resolveYouTubePreferredAccount } from "./youtubeChannelStrategy.mjs";

import { communityTemplateMode, playerThemeForAccount, renderPlayerCardPng, ensureFilmDustTexture, renderBrandWordmarkPng } from "./youtubePlayerTemplate.mjs";

import { getPlayerTheme } from "./youtubePlayerThemes.mjs";

import { playerCardFramePos } from "./youtubePlayerCard.mjs";



function runFfmpeg(args) {

  const bin = ffmpegPath;

  if (!bin) throw new Error("ffmpeg_binary_missing");

  return new Promise((resolve, reject) => {

    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stderr = "";

    proc.stderr.on("data", (c) => {

      stderr += String(c);

    });

    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-600)))));

  });

}



export async function renderAndUploadYouTubeVideo(db, loop) {

  if (!loop?.id || !loop?.audio_url || !loop?.user_id) {

    throw new Error("loop_invalid_for_render");

  }



  const trendRemixMeta = extractTrendRemixMeta(loop.stems_url);

  if (trendRemixMeta?.originalTitle) {

    return renderAndUploadTrendRemixVideo(db, loop);

  }



  const trackKind = inferTrackKind(loop.stems_url, loop.name ?? "");

  const viralMeta = extractViralMeta(loop.stems_url);

  const isViral = Boolean(viralMeta?.series);

  const account = resolveYouTubePreferredAccount({ viralMeta, trendRemixMeta, trackKind });

  const hook = pickYouTubeHook({ loopId: loop.id, kind: trackKind, account: isViral ? "" : account });

  const sec = isViral ? youtubeViralPreviewSec() : youtubePreviewSec();

  const aceLyrics =

    loop.stems_url?.ace && typeof loop.stems_url.ace === "object"

      ? String(loop.stems_url.ace.lyrics ?? "")

      : "";



  const work = await fs.mkdtemp(join(tmpdir(), "yt-prerender-"));

  const audioPath = join(work, "audio.m4a");

  const outPath = join(work, "out.mp4");



  try {

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

        loopId: loop.id,

      });

      coverPath = viralVisual.coverPath;

      stockVideoPath = viralVisual.stockVideoPath;

      if (viralVisual.mode === "cover" && !coverPath) throw new Error("viral_cover_unavailable");

    } else {

      coverPath = await resolveLoopCoverPath(loop, work);

      if (!coverPath) throw new Error("community_cover_unavailable");

      if (communityTemplateMode() === "player") {

        cardPath = join(work, "player-card.png");

        const theme = playerThemeForAccount(account);

        await renderPlayerCardPng({

          coverPath,

          title: loop.name ?? "Untitled",

          trackKind,

          theme,

          outPath: cardPath,

        });

        wordmarkPath = join(work, "wordmark.png");

        await renderBrandWordmarkPng(theme, playerCardFramePos().cardY, wordmarkPath);

        if (getPlayerTheme(theme).useDust) {

          dustPath = await ensureFilmDustTexture();

        }

      }

    }



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

        loopId: loop.id,

        trackKind,

        hook,

        stemsUrl: loop.stems_url,

        viralMeta,

        playerTheme: playerThemeForAccount(account),

        lyrics: aceLyrics,

      }),

    );



    const bytes = await fs.readFile(outPath);

    if (bytes.byteLength < 8000) throw new Error("render_too_small");



    const storagePath = `${loop.user_id}/${loop.id}/youtube-${Date.now()}.mp4`;

    const { error } = await db.storage.from("social-videos").upload(storagePath, bytes, {

      contentType: "video/mp4",

      upsert: true,

      cacheControl: "604800",

    });

    if (error) throw new Error(`upload_failed:${error.message}`);



    return {

      storagePath,

      bytes: bytes.byteLength,

      sec,

      viral: viralMeta?.series ?? null,

      trendRemix: false,

      visual: isViral ? "stock" : "cover",

    };

  } finally {

    await fs.rm(work, { recursive: true, force: true }).catch(() => undefined);

  }

}


