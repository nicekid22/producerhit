/**
 * Community landscape 16:9 — carte player centrée + cover visible (Prism / Warm Glass).
 */
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { resolveFontfile } from "./youtubeBrandOverlay.mjs";
import { getPlayerTheme, normalizePlayerTheme, themeCardMeta } from "./youtubePlayerThemes.mjs";

export const LANDSCAPE_W = 1920;
export const LANDSCAPE_H = 1080;
export const LANDSCAPE_FPS = 30;

/** Carte centrée — alignée sur le player vertical. */
export const LANDSCAPE_CARD = {
  cardW: 1080,
  cardH: 600,
  artSize: 440,
  artX: 56,
  artY: 56,
  textX: 540,
  titleY: 148,
  subY: 228,
  genreY: 288,
  barY: 468,
  barW: 968,
  controlsY: 518,
};

export function landscapeCardFramePos() {
  const cardX = Math.round((LANDSCAPE_W - LANDSCAPE_CARD.cardW) / 2);
  const cardY = Math.round((LANDSCAPE_H - LANDSCAPE_CARD.cardH) / 2 - 16);
  return {
    cardX,
    cardY,
    logoY: Math.max(32, cardY - 52),
  };
}

function escDrawtext(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%");
}

function escXml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(s, max) {
  const t = String(s ?? "").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function fitSingleLineTitle(title, baseSize = 52) {
  const text = truncate(String(title ?? "").trim(), 48);
  const len = text.length;
  let size = baseSize;
  if (len > 34) size = Math.round(baseSize * 0.62);
  else if (len > 28) size = Math.round(baseSize * 0.74);
  else if (len > 22) size = Math.round(baseSize * 0.86);
  return { text, size: Math.max(30, size) };
}

function eqBarsSvg(artX, artY, artSize, fill) {
  const baseY = artY + artSize + 16;
  const heights = [6, 11, 8, 14, 9, 12, 7, 13, 10, 8, 12, 6];
  const barW = 3;
  const gap = 9;
  let x = artX + Math.round((artSize - (heights.length * barW + (heights.length - 1) * (gap - barW))) / 2);
  return heights
    .map((h) => {
      const el = `<rect x="${x}" y="${baseY + 16 - h}" width="${barW}" height="${h}" rx="1.5" fill="${fill}"/>`;
      x += gap;
      return el;
    })
    .join("\n  ");
}

/** Carte landscape avec cover intégrée (comme Shorts vertical). */
export async function renderCommunityLandscapeCardPng({
  coverPath,
  themeId,
  title,
  subtitle,
  genre,
  trackKind = "song",
  outPath,
}) {
  const theme = getPlayerTheme(normalizePlayerTheme(themeId));
  const meta = themeCardMeta(themeId, trackKind);
  const c = theme.card;
  const { cardW, cardH, artSize, artX, artY, textX, titleY, subY, genreY, barY, barW, controlsY } =
    LANDSCAPE_CARD;

  const baseTitle = themeId === "warm-glass" ? 54 : 50;
  const { text: titleText, size: titleSize } = fitSingleLineTitle(title, baseTitle);
  const subText = truncate(subtitle, 44);
  const genreLabel = truncate(
    trackKind === "type_beat" ? `${genre} · Type Beat · AI` : trackKind === "song" ? `${genre} · AI Song` : `${genre} · AI`,
    42,
  );
  const headerSize = c.headerSize ?? 16;

  const coverBuf = await fs.readFile(coverPath);
  const art = await sharp(coverBuf)
    .resize(artSize, artSize, { fit: "cover", position: "centre" })
    .jpeg({ quality: 92 })
    .toBuffer();

  const artRounded = await sharp(art)
    .composite([
      {
        input: Buffer.from(
          `<svg width="${artSize}" height="${artSize}"><rect width="${artSize}" height="${artSize}" rx="22" ry="22" fill="white"/></svg>`,
        ),
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const subLineY = titleY + Math.round(titleSize * 0.55) + 26;
  const genreLineY = subLineY + 44;

  const svg = `<svg width="${cardW}" height="${cardH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sheen" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${c.sheen0}"/>
      <stop offset="100%" stop-color="${c.sheen1}"/>
    </linearGradient>
  </defs>
  <rect width="${cardW}" height="${cardH}" rx="40" ry="40" fill="${c.panel}" stroke="${c.border}" stroke-width="1.5"/>
  <rect width="${cardW}" height="${cardH}" rx="40" ry="40" fill="url(#sheen)"/>
  <text x="${artX}" y="44" fill="${c.subColor}" font-family="Inter, Segoe UI, sans-serif" font-size="${headerSize}" font-weight="700" letter-spacing="3">${escXml(c.header ?? "PRODUCERHIT")}</text>
  ${eqBarsSvg(artX, artY, artSize, c.eqBarFill ?? "rgba(255,255,255,0.2)")}
  <text x="${textX}" y="${titleY}" fill="${c.accent}" font-family="${c.titleFont}" font-size="${titleSize}" font-weight="${c.titleWeight ?? 700}" font-style="${c.titleStyle ?? "normal"}">${escXml(titleText)}</text>
  <text x="${textX}" y="${subLineY}" fill="${c.subColor}" font-family="Inter, Segoe UI, sans-serif" font-size="${c.subSize ?? 24}">${escXml(subText)}</text>
  <text x="${textX}" y="${genreLineY}" fill="${c.accent}" font-family="Inter, Segoe UI, sans-serif" font-size="22" opacity="0.88">${escXml(genreLabel)}</text>
  <line x1="${artX}" y1="${barY}" x2="${artX + barW}" y2="${barY}" stroke="${c.barStroke}" stroke-width="3" stroke-linecap="round"/>
  <g transform="translate(${Math.round(cardW / 2 - 88)}, ${controlsY})" fill="white" opacity="0.88">
    <polygon points="0,8 0,24 14,16"/>
    <polygon points="-16,8 -16,24 -2,16"/>
    <circle cx="88" cy="16" r="22" fill="none" stroke="white" stroke-width="2" opacity="0.85"/>
    <rect x="80" y="8" width="5" height="16" rx="1.5"/>
    <rect x="91" y="8" width="5" height="16" rx="1.5"/>
    <polygon points="162,8 162,24 176,16"/>
    <polygon points="178,8 178,24 192,16"/>
  </g>
  <text x="${Math.round(cardW / 2)}" y="${cardH - 28}" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-family="Inter, Segoe UI, sans-serif" font-size="15">${escXml(c.footer ?? "producerhit.com")}</text>
</svg>`;

  const cardBase = await sharp(Buffer.from(svg)).png().toBuffer();
  await sharp(cardBase)
    .composite([{ input: artRounded, left: artX, top: artY }])
    .png()
    .toFile(outPath);

  return outPath;
}

/** @deprecated — use renderCommunityLandscapeCardPng */
export async function renderCommunityLandscapeOverlayPng(opts) {
  return renderCommunityLandscapeCardPng({ ...opts, coverPath: opts.coverPath ?? opts.cover });
}

export function buildCommunityLandscapeRenderArgs({
  coverPath,
  backgroundVideoPath,
  cardPath,
  wordmarkPath,
  audioPath,
  outPath,
  maxSec,
  themeId,
  cta,
  audioStartSec = 0,
}) {
  const sec = maxSec ?? 600;
  const fps = LANDSCAPE_FPS;
  const theme = getPlayerTheme(normalizePlayerTheme(themeId));
  const frame = landscapeCardFramePos();
  const { cardX, cardY, logoY } = frame;
  const font = resolveFontfile();
  const ctaText = escDrawtext(cta ?? "Try ProducerHit free → producerhit.com");
  const useVideoBg = Boolean(backgroundVideoPath);

  const grade =
    theme.id === "warm-glass"
      ? "eq=brightness=-0.04:saturation=1.12:gamma_r=1.05"
      : theme.id === "prism"
        ? "eq=brightness=-0.05:saturation=1.08:gamma_b=1.06"
        : "eq=brightness=-0.06:saturation=0.95";

  const wordmarkColor = theme.wordmarkColor ?? "white";
  const wordmarkOpacity = theme.wordmarkOpacity ?? 0.82;

  const bgFilter = useVideoBg
    ? `[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=${fps},gblur=sigma=44,${grade}[bg]`
    : `[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='min(zoom+0.00006,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=${fps},gblur=sigma=44,${grade}[bg]`;

  const parts = [
    bgFilter,
    `[1:v]format=rgba[card]`,
    `[bg][card]overlay=${cardX}:${cardY}:format=auto[ui]`,
    `[ui]drawtext=text='◆ producerhit.com'${font}:fontcolor=${wordmarkColor}@${wordmarkOpacity}:fontsize=30:x=(w-text_w)/2:y=${logoY}:shadowcolor=black@0.5:shadowx=0:shadowy=2[wm]`,
    `[wm]drawtext=text='${ctaText}'${font}:fontcolor=white@0.88:fontsize=30:line_spacing=6:x=(w-text_w)/2:y=${cardY + LANDSCAPE_CARD.cardH + 28}:shadowcolor=black@0.5:shadowx=0:shadowy=2[vout]`,
  ];

  const args = ["-y"];
  if (useVideoBg) {
    args.push("-stream_loop", "-1", "-i", backgroundVideoPath);
  } else {
    args.push("-loop", "1", "-framerate", String(fps), "-i", coverPath);
  }
  args.push("-loop", "1", "-framerate", String(fps), "-i", cardPath);

  if (audioStartSec > 0) args.push("-ss", String(audioStartSec));
  args.push("-i", audioPath);
  args.push(
    "-t",
    String(sec),
    "-filter_complex",
    parts.join(";"),
    "-map",
    "[vout]",
    "-map",
    "2:a",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-r",
    String(fps),
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "44100",
    "-movflags",
    "+faststart",
    "-shortest",
    outPath,
  );

  return args;
}

export function communityLongMaxSec() {
  const raw = Number(process.env.COMMUNITY_YOUTUBE_LONG_MAX_SEC ?? process.env.TREND_REMIX_MAX_SEC ?? "600");
  return Math.max(60, Math.min(600, Number.isFinite(raw) ? Math.floor(raw) : 600));
}

export function runFfmpeg(args) {
  const bin = ffmpegPath;
  if (!bin) throw new Error("ffmpeg_binary_missing");
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (c) => {
      stderr += String(c);
    });
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-800)))));
  });
}
