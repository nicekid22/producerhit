/**
 * Render community Short (vertical) ou Long (landscape) → social-videos bucket.
 */
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildYoutubeRenderArgs } from "./youtubeVideoRender.mjs";
import { resolveLoopCoverPath } from "./youtubeCoverResolve.mjs";
import {
  communityTemplateMode,
  renderPlayerCardPng,
  ensureFilmDustTexture,
  renderBrandWordmarkPng,
} from "./youtubePlayerTemplate.mjs";
import { getPlayerTheme } from "./youtubePlayerThemes.mjs";
import { playerCardFramePos } from "./youtubePlayerCard.mjs";
import { extractAceLyrics } from "./communityYoutubeTitle.mjs";
import { resolveShortAudioWindowFromFile } from "./youtubeShortAudioWindow.mjs";
import { resolveTrendRemixVideoDuration, probeAudioDurationSec } from "./trendRemixVideoDuration.mjs";
import {
  buildCommunityLandscapeRenderArgs,
  communityLongMaxSec,
  renderCommunityLandscapeCardPng,
  runFfmpeg,
} from "./youtubeCommunityLandscape.mjs";
import { communityShortSec } from "./youtubeDailyCadence.mjs";
import { resolveCommunityLandscapePinterestVideo } from "./pinterestVideoFetch.mjs";

function storageFileName(format, account, planId) {
  const shortId = String(planId ?? "x").slice(0, 8);
  return `youtube-${format}-${account}-${shortId}.mp4`;
}

export async function renderCommunityYouTubeVideo(db, plan) {
  const loop = plan.loop;
  if (!loop?.id || !loop?.audio_url || !loop?.user_id) throw new Error("loop_invalid");

  const format = plan.format === "long" ? "long" : "short";
  const work = await fs.mkdtemp(join(tmpdir(), "comm-yt-render-"));
  const audioPath = join(work, "audio.m4a");
  const outPath = join(work, "out.mp4");

  try {
    const audioRes = await fetch(loop.audio_url);
    if (!audioRes.ok) throw new Error("audio_download_failed");
    await fs.writeFile(audioPath, Buffer.from(await audioRes.arrayBuffer()));

    const coverPath = await resolveLoopCoverPath(loop, work);
    if (!coverPath) throw new Error("community_cover_unavailable");

    const lyrics = extractAceLyrics(loop.stems_url);
    let audioStartSec = 0;
    let maxSec = communityShortSec();

    if (format === "short") {
      const win = await resolveShortAudioWindowFromFile({
        audioPath,
        lyrics,
        slot: plan.slot_index ?? 0,
      });
      audioStartSec = win.startSec;
      maxSec = win.durationSec;
    } else {
      maxSec = await resolveTrendRemixVideoDuration(loop, audioPath, communityLongMaxSec());
    }

    if (format === "short" && communityTemplateMode() === "player") {
      const cardPath = join(work, "player-card.png");
      const theme = plan.theme ?? "prism";
      await renderPlayerCardPng({
        coverPath,
        title: plan.display_title,
        subtitle: plan.cta,
        trackKind: plan.track_kind ?? "song",
        theme,
        outPath: cardPath,
      });
      const wordmarkPath = join(work, "wordmark.png");
      await renderBrandWordmarkPng(theme, playerCardFramePos().cardY, wordmarkPath);
      const dustPath = getPlayerTheme(theme).useDust ? await ensureFilmDustTexture() : null;

      await runFfmpeg(
        buildYoutubeRenderArgs({
          coverPath,
          cardPath,
          wordmarkPath,
          dustPath,
          audioPath,
          outPath,
          maxSec,
          loopId: loop.id,
          trackKind: plan.track_kind ?? "song",
          stemsUrl: loop.stems_url,
          playerTheme: theme,
          cta: plan.cta,
          audioStartSec,
        }),
      );
    } else if (format === "long") {
      const themeId = plan.theme ?? "prism";
      const cardPath = join(work, "landscape-card.png");
      const backgroundVideoPath = await resolveCommunityLandscapePinterestVideo({
        loop,
        themeId,
        workDir: work,
        log: console.log,
      });
      await renderCommunityLandscapeCardPng({
        coverPath,
        themeId,
        title: plan.display_title,
        subtitle: plan.cta,
        genre: loop.genre ?? "AI",
        trackKind: plan.track_kind ?? "song",
        outPath: cardPath,
      });
      await runFfmpeg(
        buildCommunityLandscapeRenderArgs({
          coverPath,
          backgroundVideoPath,
          cardPath,
          audioPath,
          outPath,
          maxSec,
          themeId,
          cta: plan.cta,
        }),
      );
    } else {
      throw new Error("unsupported_format");
    }

    const bytes = await fs.readFile(outPath);
    if (bytes.byteLength < 8000) throw new Error("render_too_small");

    const storagePath = `${loop.user_id}/${loop.id}/${storageFileName(format, plan.account, plan.id)}`;
    const { error } = await db.storage.from("social-videos").upload(storagePath, bytes, {
      contentType: "video/mp4",
      upsert: true,
      cacheControl: "604800",
    });
    if (error) throw new Error(`upload_failed:${error.message}`);

    return {
      storagePath,
      bytes: bytes.byteLength,
      sec: maxSec,
      format,
      audioStartSec,
    };
  } finally {
    await fs.rm(work, { recursive: true, force: true }).catch(() => undefined);
  }
}

export { probeAudioDurationSec };
