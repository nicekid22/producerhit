/**
 * Community Shorts — calm music-player aesthetic (blurred cover bg + glass card).
 */
import { ART_TEMPLATE_FPS, visualStyle } from "./youtubeBrandOverlay.mjs";
import { ensureFilmDustTexture, filmDustOverlayFilter } from "./youtubeFilmDustTexture.mjs";
import {
  communityTemplateMode,
  playerCardFramePos,
  playerTheme,
  playerThemeForAccount,
  renderPlayerCardPng,
} from "./youtubePlayerCard.mjs";
import { brandWordmarkOverlayFilter, getPlayerTheme } from "./youtubePlayerThemes.mjs";

export {
  communityTemplateMode,
  playerTheme,
  playerThemeForAccount,
  playerVariant,
  playerVariantForAccount,
  renderPlayerCardPng,
  renderBrandWordmarkPng,
} from "./youtubePlayerCard.mjs";
export { ensureFilmDustTexture } from "./youtubeFilmDustTexture.mjs";
export { ART_TEMPLATE_FPS } from "./youtubeBrandOverlay.mjs";
export { PLAYER_THEME_IDS, getPlayerTheme, normalizePlayerTheme, renderBrandWordmarkPng as renderWordmarkPng } from "./youtubePlayerThemes.mjs";

export function buildPlayerShortFilter(opts) {
  const fps = opts.fps ?? ART_TEMPLATE_FPS;
  const themeId = opts.theme ?? playerTheme();
  const theme = getPlayerTheme(themeId);
  const frame = playerCardFramePos();
  const { cardY } = frame;
  const logoY = Math.max(40, Math.round(cardY - 44));
  const dustInput = opts.hasWordmarkInput ? "4:v" : "3:v";

  const parts = [
    theme.bgChain(fps),
    `[blur]vignette=${theme.vignetteAngle}:mode=forward[bgv]`,
    `[1:v]format=rgba[card]`,
    `[bgv][card]overlay=${frame.cardX}:${frame.cardY}:format=auto[ui]`,
    theme.postGrade("ui"),
    brandWordmarkOverlayFilter("retro", logoY, "2:v"),
  ];

  if (theme.useDust) {
    parts.push(filmDustOverlayFilter("branded", dustInput));
  } else {
    parts.push("[branded]format=yuv420p[vout]");
  }

  return { filter: parts.join(";"), theme, logoY };
}

export function buildPlayerRenderArgs({ coverPath, cardPath, wordmarkPath, dustPath, audioPath, outPath, maxSec, theme, variant }) {
  const sec = maxSec ?? 45;
  const fps = ART_TEMPLATE_FPS;
  const themeId = theme ?? variant ?? playerTheme();
  const hasWordmark = Boolean(wordmarkPath);
  const { filter, theme: resolved } = buildPlayerShortFilter({
    fps,
    durationSec: sec,
    theme: themeId,
    hasWordmarkInput: hasWordmark,
  });

  const args = [
    "-y",
    "-loop",
    "1",
    "-framerate",
    String(fps),
    "-i",
    coverPath,
    "-loop",
    "1",
    "-framerate",
    String(fps),
    "-i",
    cardPath,
  ];

  if (wordmarkPath) {
    args.push("-loop", "1", "-framerate", String(fps), "-i", wordmarkPath);
  }

  args.push("-i", audioPath);

  const audioIndex = wordmarkPath ? 3 : 2;

  if (resolved.useDust && dustPath) {
    args.push("-loop", "1", "-framerate", String(fps), "-i", dustPath);
  }

  args.push(
    "-t",
    String(sec),
    "-filter_complex",
    filter,
    "-map",
    "[vout]",
    "-map",
    `${audioIndex}:a`,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    visualStyle() === "modern" ? "23" : "26",
    "-maxrate",
    "2800k",
    "-bufsize",
    "5600k",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(fps),
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ar",
    "44100",
    "-movflags",
    "+faststart",
    "-shortest",
    outPath,
  );

  return args;
}
