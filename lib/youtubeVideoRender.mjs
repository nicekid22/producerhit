import { buildArtisticRenderArgs, pickYouTubeHook, ART_TEMPLATE_FPS, buildProducerHitArtFilter } from "./youtubeArtTemplate.mjs";
import { buildPlayerRenderArgs, communityTemplateMode } from "./youtubePlayerTemplate.mjs";
import { buildViralRenderArgs, extractViralMeta, youtubeViralPreviewSec } from "./youtubeViralTemplate.mjs";
import { extractTrendRemixMeta } from "./youtubeSocial.mjs";
import { buildLandscapeRenderArgs, youtubeTrendRemixMaxSec } from "./youtubeLandscapeTemplate.mjs";

/** Standard Shorts preview length. */
export function youtubePreviewSec() {
  const raw = Number(process.env.YOUTUBE_PREVIEW_SEC ?? "45");
  return Math.max(15, Math.min(59, Number.isFinite(raw) ? raw : 45));
}

export function buildYoutubeRenderArgs({ coverPath, stockVideoPath, cardPath, wordmarkPath, dustPath, audioPath, outPath, maxSec, loopId, trackKind, hook, stemsUrl, viralMeta, playerTheme, playerVariant: variant, loopName, lyrics }) {
  const trendRemix = extractTrendRemixMeta(stemsUrl);
  if (trendRemix?.originalTitle) {
    return buildLandscapeRenderArgs({
      coverPath,
      audioPath,
      outPath,
      maxSec: maxSec ?? youtubeTrendRemixMaxSec(),
      title: trendRemix.displayTitle ?? `${trendRemix.originalTitle} — ${trendRemix.remixGenre} AI Remix`,
      subtitle: `${trendRemix.originalTitle} × ${trendRemix.remixGenre}`,
      artistLine: `Inspired by ${trendRemix.originalArtist}`,
      lyrics: lyrics ?? "",
    });
  }
  const viral = viralMeta ?? extractViralMeta(stemsUrl);
  if (viral?.series) {
    return buildViralRenderArgs({
      coverPath: coverPath || null,
      stockVideoPath: stockVideoPath || null,
      audioPath,
      outPath,
      maxSec: maxSec ?? youtubeViralPreviewSec(),
      viralMeta: viral,
    });
  }
  if (communityTemplateMode() === "player" && coverPath && cardPath) {
    return buildPlayerRenderArgs({
      coverPath,
      cardPath,
      wordmarkPath,
      dustPath,
      audioPath,
      outPath,
      maxSec: maxSec ?? youtubePreviewSec(),
      theme: playerTheme ?? variant,
    });
  }
  return buildArtisticRenderArgs({
    coverPath,
    audioPath,
    outPath,
    maxSec: maxSec ?? youtubePreviewSec(),
    loopId,
    trackKind,
    hook,
  });
}

export { buildArtisticRenderArgs, pickYouTubeHook, ART_TEMPLATE_FPS, buildProducerHitArtFilter, buildViralRenderArgs, extractViralMeta, youtubeViralPreviewSec };
