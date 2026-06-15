/**
 * Premium landscape 16:9 — blurred cover + Sharp glass/karaoke overlay (no giant wordmark).
 */
import { promises as fs } from "node:fs";
import sharp from "sharp";
import { displayLinesForTrendRemix } from "./youtubeTrendRemixLyrics.mjs";
import { getTrendRemixTheme, normalizeTrendRemixTheme } from "./youtubeTrendRemixThemes.mjs";

export const LANDSCAPE_W = 1920;
export const LANDSCAPE_H = 1080;
export const LANDSCAPE_FPS = 30;

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

export function youtubeTrendRemixMaxSec() {
  const raw = Number(process.env.TREND_REMIX_MAX_SEC ?? process.env.TREND_REMIX_DURATION_SEC ?? 120);
  return Math.max(60, Math.min(180, Number.isFinite(raw) ? raw : 120));
}

export async function renderTrendRemixGlassOverlay({
  coverPath,
  outPath,
  theme: themeId,
  originalTitle,
  originalArtist,
  remixGenre,
  lyrics,
  trendKeywords,
  searchQueries,
  lyricsTheme,
}) {
  const theme = getTrendRemixTheme(themeId);
  const coverBuf = await fs.readFile(coverPath);
  const artSize = 400;
  const art = await sharp(coverBuf)
    .resize(artSize, artSize, { fit: "cover", position: "centre" })
    .jpeg({ quality: 92 })
    .toBuffer();
  const artRounded = await sharp(art)
    .composite([
      {
        input: Buffer.from(
          `<svg width="${artSize}" height="${artSize}"><rect width="${artSize}" height="${artSize}" rx="28" ry="28" fill="white"/></svg>`,
        ),
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const lines = displayLinesForTrendRemix({ lyrics, trendKeywords, searchQueries, lyricsTheme });
  const activeLine = lines[0] ?? "♪ AI Remix";
  const mutedLines = lines.slice(1, 4);

  const panelW = 1280;
  const panelH = 620;
  const panelX = Math.round((LANDSCAPE_W - panelW) / 2);
  const panelY = 200;
  const artX = panelX + 56;
  const artY = panelY + 110;
  const textX = artX + artSize + 56;
  const title = truncate(originalTitle, 32);
  const artist = truncate(originalArtist, 36);
  const genre = truncate(remixGenre, 28);

  const lyricY = panelY + panelH - 148;
  const mutedSvg = mutedLines
    .map(
      (line, i) =>
        `<text x="${panelX + 64}" y="${lyricY + 44 + i * 38}" fill="${theme.lyricMuted}" font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="26" font-weight="500">${escXml(line)}</text>`,
    )
    .join("\n  ");

  const svg = `<svg width="${LANDSCAPE_W}" height="${LANDSCAPE_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.sheen0}"/>
      <stop offset="100%" stop-color="${theme.sheen1}"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="28" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="40" ry="40" fill="${theme.panel}" stroke="${theme.panelBorder}" stroke-width="1.5" filter="url(#softShadow)"/>
  <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="40" ry="40" fill="url(#sheen)"/>
  <text x="${textX}" y="${artY + 36}" fill="${theme.subColor}" font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="18" letter-spacing="3">AI REMIX · FULL SONG</text>
  <text x="${textX}" y="${artY + 96}" fill="${theme.titleColor}" font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="56" font-weight="700">${escXml(title)}</text>
  <text x="${textX}" y="${artY + 148}" fill="${theme.subColor}" font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="30" font-weight="500">${escXml(artist)}</text>
  <rect x="${textX}" y="${artY + 172}" width="320" height="42" rx="21" fill="${theme.badgeBg}" stroke="${theme.panelBorder}" stroke-width="1"/>
  <text x="${textX + 20}" y="${artY + 201}" fill="${theme.badgeText}" font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="22" font-weight="600">${escXml(genre)}</text>
  <line x1="${panelX + 48}" y1="${lyricY - 24}" x2="${panelX + panelW - 48}" y2="${lyricY - 24}" stroke="${theme.panelBorder}" stroke-width="1" opacity="0.6"/>
  <text x="${panelX + 64}" y="${lyricY}" fill="${theme.accent}" font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="18" letter-spacing="2">NOW SINGING</text>
  <text x="${panelX + 64}" y="${lyricY + 36}" fill="${theme.lyricActive}" font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="34" font-weight="600">${escXml(activeLine)}</text>
  ${mutedSvg}
  <rect x="${panelX + 48}" y="${panelY + panelH - 36}" width="${panelW - 96}" height="4" rx="2" fill="${theme.panelBorder}" opacity="0.35"/>
  <rect x="${panelX + 48}" y="${panelY + panelH - 36}" width="${Math.round((panelW - 96) * 0.35)}" height="4" rx="2" fill="${theme.accent}" opacity="0.85"/>
  <text x="${LANDSCAPE_W - 48}" y="${LANDSCAPE_H - 36}" text-anchor="end" fill="${theme.watermark}" font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="20" font-weight="500">producerhit.com</text>
</svg>`;

  const panelBase = await sharp(Buffer.from(svg)).png().toBuffer();
  await sharp({
    create: {
      width: LANDSCAPE_W,
      height: LANDSCAPE_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: panelBase, left: 0, top: 0 },
      { input: artRounded, left: artX, top: artY },
    ])
    .png()
    .toFile(outPath);

  return outPath;
}

export function buildGlassLandscapeRenderArgs({ coverPath, overlayPath, audioPath, outPath, maxSec, theme: themeId }) {
  const theme = getTrendRemixTheme(themeId);
  const sec = maxSec ?? youtubeTrendRemixMaxSec();
  const fps = LANDSCAPE_FPS;

  const filters = [
    `[0:v]scale=${LANDSCAPE_W}:${LANDSCAPE_H}:force_original_aspect_ratio=increase,crop=${LANDSCAPE_W}:${LANDSCAPE_H},${theme.bgGrade},gblur=sigma=${theme.blurSigma},zoompan=z='min(zoom+0.00005,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${LANDSCAPE_W}x${LANDSCAPE_H}:fps=${fps}[bg]`,
    `[1:v]format=rgba[ui]`,
    `[bg][ui]overlay=0:0:format=auto[vout]`,
  ].join(";");

  return [
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
    overlayPath,
    "-i",
    audioPath,
    "-t",
    String(sec),
    "-filter_complex",
    filters,
    "-map",
    "[vout]",
    "-map",
    "2:a",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-maxrate",
    "5500k",
    "-bufsize",
    "11000k",
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
  ];
}

export { normalizeTrendRemixTheme };
