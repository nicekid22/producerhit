/**
 * Pro landscape 16:9 — YouTube lyrics templates (cinematic / dark / neon / letterbox).
 */
import { promises as fs } from "node:fs";
import sharp from "sharp";
import { resolveFontfile } from "./youtubeBrandOverlay.mjs";
import { displayLinesForTrendRemix, buildLyricTimeline } from "./youtubeTrendRemixLyrics.mjs";
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

function escDrawtext(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%");
}

function truncate(s, max) {
  const t = String(s ?? "").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function wrapLyric(line, max = 36) {
  const s = String(line ?? "").trim();
  if (s.length <= max) return s;
  const mid = s.lastIndexOf(" ", Math.floor(s.length / 2));
  if (mid < 8) return s.slice(0, max);
  return `${s.slice(0, mid)}\n${s.slice(mid + 1).slice(0, max)}`;
}

export function youtubeTrendRemixMaxSec() {
  const raw = Number(process.env.TREND_REMIX_MAX_SEC ?? process.env.TREND_REMIX_DURATION_SEC ?? 600);
  return Math.max(60, Math.min(600, Number.isFinite(raw) ? raw : 600));
}

function buildOverlaySvg(themeId, { originalTitle, originalArtist, remixGenre }) {
  const theme = getTrendRemixTheme(themeId);
  const title = escXml(truncate(originalTitle, 22));
  const artist = escXml(truncate(originalArtist, 28).toUpperCase());
  const genre = escXml(truncate(remixGenre, 24).toUpperCase());
  const W = LANDSCAPE_W;
  const H = LANDSCAPE_H;

  const vignette = `<radialGradient id="vig" cx="50%" cy="45%" r="72%">
    <stop offset="45%" stop-color="rgba(0,0,0,0)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.72)"/>
  </radialGradient>`;

  const grainSlope = theme.svgGrainSlope ?? 0.04;
  const grain = `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="${grainSlope}"/></feComponentTransfer></filter>`;

  if (themeId === "cinematic-glow") {
    const glowGrain = `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.88" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="${theme.svgGrainSlope ?? 0.048}"/></feComponentTransfer></filter>`;
    const cx = W / 2;
    const cy = Math.round(H * 0.44);
    return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${glowGrain}
        <filter id="titleGlow" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="10" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="veilTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(0,0,0,0.42)"/>
          <stop offset="38%" stop-color="rgba(0,0,0,0)"/>
        </linearGradient>
        <linearGradient id="veilBottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="62%" stop-color="rgba(0,0,0,0)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.48)"/>
        </linearGradient>
        <radialGradient id="edgeVig" cx="50%" cy="48%" r="68%">
          <stop offset="55%" stop-color="rgba(0,0,0,0)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.38)"/>
        </radialGradient>
        <linearGradient id="warmVeil" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(255,190,90,0.07)"/>
          <stop offset="100%" stop-color="rgba(255,100,40,0.04)"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#edgeVig)"/>
      <rect width="${W}" height="${H}" fill="url(#veilTop)"/>
      <rect width="${W}" height="${H}" fill="url(#veilBottom)"/>
      <rect width="${W}" height="${H}" fill="url(#warmVeil)"/>
      <rect width="${W}" height="${H}" filter="url(#grain)"/>
      <text x="${cx}" y="${cy - 118}" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="600" letter-spacing="9">${artist}</text>
      <text x="${cx}" y="${cy + 52}" text-anchor="middle" fill="#FFE566" font-family="Georgia, 'Times New Roman', serif" font-size="140" font-weight="700" filter="url(#titleGlow)">${title}</text>
      <text x="${cx}" y="${cy + 168}" text-anchor="middle" fill="#FFE566" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" letter-spacing="9">${genre} · AI REMIX</text>
    </svg>`;
  }

  if (themeId === "dark-premium") {
    const accent = theme.accent ?? "#FF6B2C";
    return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${vignette}
        ${grain}
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="${W}" height="${H}" fill="rgba(0,0,0,0.55)"/>
      <rect width="${W}" height="${H}" fill="url(#vig)"/>
      <rect width="${W}" height="${H}" filter="url(#grain)"/>
      <text x="${W / 2}" y="200" text-anchor="middle" fill="rgba(255,255,255,0.88)" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="500">${escXml(truncate(originalArtist, 32))} · ${genre}</text>
      <text x="${W / 2}" y="430" text-anchor="middle" fill="${accent}" font-family="Arial Black, Arial, sans-serif" font-size="96" font-weight="900" font-style="italic" filter="url(#glow)">${title.toUpperCase()}</text>
      <text x="${W / 2}" y="520" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-family="Arial, sans-serif" font-size="20" letter-spacing="1">AI Remix · Full Song · ${new Date().getFullYear()}</text>
      <text x="${W / 2}" y="980" text-anchor="middle" fill="rgba(255,255,255,0.28)" font-family="Arial, sans-serif" font-size="16">Stream free on ProducerHit · producerhit.com</text>
    </svg>`;
  }

  if (themeId === "neon-karaoke") {
    return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${vignette}
        <linearGradient id="purp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(80,20,120,0.25)"/>
          <stop offset="100%" stop-color="rgba(20,10,60,0.35)"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#purp)"/>
      <rect width="${W}" height="${H}" fill="url(#vig)"/>
      <text x="${W / 2}" y="120" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-family="Arial, sans-serif" font-size="24" letter-spacing="4">${artist} — ${title}</text>
      <text x="${W / 2}" y="1010" text-anchor="middle" fill="rgba(200,160,255,0.35)" font-family="Arial, sans-serif" font-size="17">producerhit.com</text>
    </svg>`;
  }

  // letterbox-cinema
  const barH = Math.round(H * 0.11);
  const titleColor = theme.titleColor ?? "#F5D547";
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>${vignette}${grain}</defs>
    <rect width="${W}" height="${barH}" fill="#000000"/>
    <rect y="${H - barH}" width="${W}" height="${barH}" fill="#000000"/>
    <rect width="${W}" height="${H}" fill="url(#vig)"/>
    <rect width="${W}" height="${H}" filter="url(#grain)"/>
    <circle cx="88" cy="52" r="7" fill="#E53935"/>
    <text x="108" y="58" fill="rgba(255,255,255,0.75)" font-family="Arial, sans-serif" font-size="20" font-weight="600">REC</text>
    <text x="${W / 2}" y="${barH + 100}" text-anchor="middle" fill="${titleColor}" font-family="Arial Black, Arial, sans-serif" font-size="72" font-weight="800">${title}</text>
    <text x="${W / 2}" y="${barH + 150}" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-family="Georgia, serif" font-size="32" font-style="italic">${escXml(truncate(originalArtist, 24))}</text>
    <text x="72" y="${H - barH - 48}" fill="rgba(255,255,255,0.30)" font-family="Arial, sans-serif" font-size="16">producerhit.com</text>
  </svg>`;
}

export async function renderTrendRemixProOverlay({
  outPath,
  theme: themeId,
  originalTitle,
  originalArtist,
  remixGenre,
}) {
  const svg = buildOverlaySvg(normalizeTrendRemixTheme(themeId), {
    originalTitle,
    originalArtist,
    remixGenre,
  });
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  return outPath;
}

function buildSiteCtaFilters(sec, font) {
  const intro = 14;
  const messages = [
    {
      text: "Generate AI beats and full songs",
      start: intro,
      end: Math.max(intro + 12, sec * 0.34),
      size: 36,
      y: "h*0.80",
    },
    {
      text: "Try it free on ProducerHit",
      start: Math.max(intro + 12, sec * 0.34),
      end: Math.max(intro + 24, sec * 0.58),
      size: 38,
      y: "h*0.80",
    },
    {
      text: "producerhit.com",
      start: Math.max(intro + 24, sec * 0.58),
      end: sec - 2,
      size: 46,
      y: "h*0.84",
      accent: true,
    },
  ];
  const filters = [];
  let last = "bg";
  messages.forEach((msg, i) => {
    const text = escDrawtext(msg.text);
    const label = `cta${i}`;
    const color = msg.accent ? "0xFFE566@0.97" : "white@0.94";
    filters.push(
      `[${last}]drawtext=text='${text}'${font}:fontcolor=${color}:fontsize=${msg.size}:shadowcolor=black@0.72:shadowx=0:shadowy=3:x=(w-text_w)/2:y=${msg.y}:enable='between(t\\,${msg.start.toFixed(2)}\\,${msg.end.toFixed(2)})'[${label}]`,
    );
    last = label;
  });
  return filters;
}

function buildLyricFilters(themeId, lines, sec, font) {
  const theme = getTrendRemixTheme(themeId);
  const segments = buildLyricTimeline(lines, sec, {
    introSec: themeId === "cinematic-glow" ? 11 : 9,
    outroSec: 7,
  });
  const filters = [];
  let last = "bg";

  if (themeId === "neon-karaoke") {
    segments.slice(0, 7).forEach((seg, i) => {
      const text = escDrawtext(wrapLyric(seg.text, 32));
      const label = `nk${i}`;
      filters.push(
        `[${last}]drawtext=text='${text}'${font}:fontcolor=${theme.lyricGlow ?? "#FFE566"}:fontsize=52:shadowcolor=${theme.lyricGlow ?? "#FFE566"}@0.85:shadowx=0:shadowy=0:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t\\,${seg.start.toFixed(2)}\\,${seg.end.toFixed(2)})'[${label}]`,
      );
      last = label;
    });
    return filters;
  }

  if (themeId === "letterbox-cinema") {
    const barH = Math.round(LANDSCAPE_H * 0.11);
    segments.slice(0, 6).forEach((seg, i) => {
      const text = escDrawtext(String(seg.text).toUpperCase().slice(0, 40));
      const label = `lb${i}`;
      filters.push(
        `[${last}]drawtext=text='${text}'${font}:fontcolor=white:fontsize=38:shadowcolor=black@0.6:shadowx=0:shadowy=2:x=96:y=${barH + 280 + i * 52}:enable='between(t\\,${seg.start.toFixed(2)}\\,${seg.end.toFixed(2)})'[${label}]`,
      );
      last = label;
    });
    return filters;
  }

  // cinematic-glow + dark-premium: bottom karaoke line (max 5 + CTA)
  const y = themeId === "dark-premium" ? "h*0.78" : "h*0.72";
  segments.slice(0, 6).forEach((seg, i) => {
    const isCta = seg.text.includes("producerhit.com");
    const text = escDrawtext(wrapLyric(seg.text, isCta ? 36 : 40));
    const label = `ly${i}`;
    const color = isCta ? "0xFFE566@0.82" : themeId === "dark-premium" ? "white@0.92" : "white@0.95";
    const size = isCta ? 32 : themeId === "dark-premium" ? 38 : 42;
    filters.push(
      `[${last}]drawtext=text='${text}'${font}:fontcolor=${color}:fontsize=${size}:shadowcolor=black@0.65:shadowx=0:shadowy=2:x=(w-text_w)/2:y=${y}:enable='between(t\\,${seg.start.toFixed(2)}\\,${seg.end.toFixed(2)})'[${label}]`,
    );
    last = label;
  });
  return filters;
}

export function buildProLandscapeRenderArgs({
  coverPath,
  overlayPath,
  audioPath,
  outPath,
  maxSec,
  theme: themeId,
  lyrics,
  trendKeywords,
  searchQueries,
  lyricsTheme,
  dustPath,
  veilPath,
}) {
  const theme = getTrendRemixTheme(themeId);
  const sec = maxSec ?? youtubeTrendRemixMaxSec();
  const fps = LANDSCAPE_FPS;
  const font = resolveFontfile();
  const lines = displayLinesForTrendRemix({ lyrics, trendKeywords, searchQueries, lyricsTheme });
  const textFilters = theme.useSiteCta
    ? buildSiteCtaFilters(sec, font)
    : buildLyricFilters(themeId, lines, sec, font);
  const zoom = theme.zoom ?? 0.00004;
  const blur = theme.blurSigma ?? 8;
  const bgScale = `[0:v]scale=${LANDSCAPE_W}:${LANDSCAPE_H}:force_original_aspect_ratio=increase,crop=${LANDSCAPE_W}:${LANDSCAPE_H}`;

  const filters = [
    `${bgScale},${theme.bgGrade},gblur=sigma=${blur},zoompan=z='min(zoom+${zoom},1.07)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${LANDSCAPE_W}x${LANDSCAPE_H}:fps=${fps}[raw]`,
    `[raw]vignette=${theme.vignette}:mode=forward[bg]`,
    ...textFilters,
  ];

  const lastLyric = filters.at(-1)?.match(/\[(\w+)\]$/)?.[1] ?? "bg";
  filters.push(`[1:v]format=rgba[ui]`, `[${lastLyric}][ui]overlay=0:0:format=auto[composed]`);

  let last = "composed";
  if (dustPath && theme.useDust) {
    const dustAlpha = theme.dustOpacity ?? 0.55;
    filters.push(
      `[3:v]format=rgba,colorchannelmixer=aa=${dustAlpha}[dust]`,
      `[${last}][dust]overlay=0:0:format=auto[dusted]`,
    );
    last = "dusted";
  }
  if (veilPath && theme.useVeil) {
    const veilInput = dustPath && theme.useDust ? "4:v" : "3:v";
    const veilAlpha = theme.veilOpacity ?? 0.22;
    filters.push(
      `[${veilInput}]scale=${LANDSCAPE_W}:${LANDSCAPE_H},format=rgba,colorchannelmixer=aa=${veilAlpha}[veil]`,
      `[${last}][veil]overlay=0:0:format=auto[veiled]`,
    );
    last = "veiled";
  }
  if (theme.useNoiseGrain) {
    const strength = theme.noiseStrength ?? 2;
    filters.push(`[${last}]noise=c0s=${strength}:c0f=t[grained]`);
    last = "grained";
  }
  filters.push(`[${last}]format=yuv420p[vout]`);

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
    overlayPath,
    "-i",
    audioPath,
  ];

  if (dustPath && theme.useDust) {
    args.push("-loop", "1", "-framerate", String(fps), "-i", dustPath);
  }
  if (veilPath && theme.useVeil) {
    args.push("-loop", "1", "-framerate", String(fps), "-i", veilPath);
  }

  args.push(
    "-t",
    String(sec),
    "-filter_complex",
    filters.join(";"),
    "-map",
    "[vout]",
    "-map",
    "2:a",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "19",
    "-maxrate",
    "6000k",
    "-bufsize",
    "12000k",
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

export { normalizeTrendRemixTheme };
