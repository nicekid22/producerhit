/**
 * Community Shorts — calm music-player aesthetic (blurred cover bg + glass card).
 */
import { ART_TEMPLATE_FPS, visualStyle, resolveFontfile } from "./youtubeBrandOverlay.mjs";
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

function escapeDrawtext(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%");
}

function wrapCta(text, maxLen = 34) {
  const s = String(text ?? "").trim();
  if (s.length <= maxLen) return s;
  const mid = s.lastIndexOf(" ", Math.floor(s.length / 2));
  if (mid < 10) return s.slice(0, maxLen);
  return `${s.slice(0, mid)}\n${s.slice(mid + 1)}`;
}

export function buildPlayerShortFilter(opts) {
  const fps = opts.fps ?? ART_TEMPLATE_FPS;
  const themeId = opts.theme ?? playerTheme();
  const theme = getPlayerTheme(themeId);
  const frame = playerCardFramePos();
  const { cardY } = frame;
  const logoY = Math.max(40, Math.round(cardY - 44));
  const dustInput = opts.hasWordmarkInput ? "4:v" : "3:v";
  const font = resolveFontfile();
  const ctaText = opts.cta ? wrapCta(opts.cta) : "";

  const parts = [
    theme.bgChain(fps),
    `[blur]vignette=${theme.vignetteAngle}:mode=forward[bgv]`,
    `[1:v]format=rgba[card]`,
    `[bgv][card]overlay=${frame.cardX}:${frame.cardY}:format=auto[ui]`,
    theme.postGrade("ui"),
    brandWordmarkOverlayFilter("retro", logoY, "2:v"),
  ];

  let videoLabel = "branded";
  if (ctaText) {
    parts.push(
      `[branded]drawtext=text='${escapeDrawtext(ctaText)}'${font}:fontcolor=white@0.90:fontsize=36:line_spacing=8:x=(w-text_w)/2:y=h*0.84:shadowcolor=black@0.55:shadowx=0:shadowy=2[cta]`,
    );
    videoLabel = "cta";
  }

  if (theme.useDust) {
    parts.push(filmDustOverlayFilter(videoLabel, dustInput));
  } else {
    parts.push(`[${videoLabel}]format=yuv420p[vout]`);
  }

  return { filter: parts.join(";"), theme, logoY };
}

export function buildPlayerRenderArgs({ coverPath, cardPath, wordmarkPath, dustPath, audioPath, outPath, maxSec, theme, variant, cta, audioStartSec = 0 }) {
  const sec = maxSec ?? 45;
  const fps = ART_TEMPLATE_FPS;
  const themeId = theme ?? variant ?? playerTheme();
  const hasWordmark = Boolean(wordmarkPath);
  const { filter, theme: resolved } = buildPlayerShortFilter({
    fps,
    durationSec: sec,
    theme: themeId,
    hasWordmarkInput: hasWordmark,
    cta,
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

  if (audioStartSec > 0) {
    args.push("-ss", String(audioStartSec));
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

