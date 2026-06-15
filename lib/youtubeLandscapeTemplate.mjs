/**
 * Landscape 16:9 YouTube template — blurred cover bg + album art + lyrics panel.
 */
import { resolveFontfile } from "./youtubeBrandOverlay.mjs";
import { displayLinesForTrendRemix } from "./youtubeTrendRemixLyrics.mjs";

export const LANDSCAPE_W = 1920;
export const LANDSCAPE_H = 1080;
export const LANDSCAPE_FPS = 30;

function escapeDrawtext(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%");
}

export function youtubeTrendRemixMaxSec() {
  const raw = Number(process.env.TREND_REMIX_MAX_SEC ?? process.env.TREND_REMIX_DURATION_SEC ?? 600);
  return Math.max(60, Math.min(600, Number.isFinite(raw) ? raw : 600));
}

export function buildLandscapeRenderArgs({
  coverPath,
  wordmarkPath,
  audioPath,
  outPath,
  maxSec,
  originalTitle,
  originalArtist,
  remixGenre,
  lyrics,
  trendKeywords,
  searchQueries,
  lyricsTheme,
}) {
  const sec = maxSec ?? youtubeTrendRemixMaxSec();
  const fps = LANDSCAPE_FPS;
  const font = resolveFontfile();
  const title = escapeDrawtext(String(originalTitle ?? "Untitled").slice(0, 48));
  const artist = escapeDrawtext(String(originalArtist ?? "").slice(0, 40));
  const genre = escapeDrawtext(String(remixGenre ?? "AI Remix").slice(0, 36));
  const lines = displayLinesForTrendRemix({
    lyrics,
    trendKeywords,
    searchQueries,
    lyricsTheme,
  });

  const filters = [
    `[0:v]split=2[coverFull][coverArt]`,
    `[coverFull]scale=${LANDSCAPE_W}:${LANDSCAPE_H}:force_original_aspect_ratio=increase,crop=${LANDSCAPE_W}:${LANDSCAPE_H},gblur=sigma=32,eq=brightness=-0.06:saturation=1.18[bgBlur]`,
    `[coverArt]scale=920:920:force_original_aspect_ratio=decrease,pad=920:920:(ow-iw)/2:(oh-ih)/2:color=0x111118,setsar=1,zoompan=z='min(zoom+0.00007,1.07)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=920x920:fps=${fps},eq=contrast=1.06:saturation=1.08[artZoom]`,
    `[bgBlur][artZoom]overlay=72:260:format=auto[composed]`,
    `[composed]drawbox=x=58:y=248:w=944:h=944:color=0xffffff@0.12:t=4[framed]`,
    `[framed]drawbox=x=940:y=180:w=920:h=780:color=0x050810@0.72:t=fill[panel]`,
    `[panel]drawbox=x=940:y=180:w=920:h=4:color=0x7eb8ff@0.9:t=fill[accent]`,
  ];

  let last = "accent";
  filters.push(
    `[${last}]drawtext=text='NOW PLAYING'${font}:fontcolor=0x7eb8ff:fontsize=22:x=980:y=220[tag]`,
    `[tag]drawtext=text='${title}'${font}:fontcolor=0xF8FAFF:fontsize=52:shadowcolor=black@0.5:shadowx=0:shadowy=2:x=980:y=268[titleLayer]`,
  );
  last = "titleLayer";

  if (artist) {
    filters.push(
      `[${last}]drawtext=text='${artist}'${font}:fontcolor=0xA8B8CC:fontsize=30:x=980:y=340[artistLayer]`,
    );
    last = "artistLayer";
  }

  filters.push(
    `[${last}]drawtext=text='${genre} · AI Remix'${font}:fontcolor=0xE8F4FF:fontsize=26:box=1:boxcolor=0x2563eb@0.55:boxborderw=14:x=980:y=392[genreBadge]`,
  );
  last = "genreBadge";

  lines.forEach((line, i) => {
    const y = 0.48 + i * 0.052;
    const label = `ly${i}`;
    filters.push(
      `[${last}]drawtext=text='${escapeDrawtext(line)}'${font}:fontcolor=0xE2E8F0:fontsize=28:x=980:y=h*${y.toFixed(3)}[${label}]`,
    );
    last = label;
  });

  filters.push(
    `[${last}]drawtext=text='producerhit.com — Create your own AI remix'${font}:fontcolor=0x94A3B8@0.9:fontsize=24:x=980:y=h*0.88[branded]`,
  );
  last = "branded";

  if (wordmarkPath) {
    filters.push(`[${last}][1:v]overlay=72:48:format=auto[wm]`);
    last = "wm";
  }

  filters.push(`[${last}]copy[vout]`);

  const args = [
    "-y",
    "-loop",
    "1",
    "-framerate",
    String(fps),
    "-i",
    coverPath,
  ];

  if (wordmarkPath) {
    args.push("-loop", "1", "-framerate", String(fps), "-i", wordmarkPath);
  }

  args.push(
    "-i",
    audioPath,
    "-t",
    String(sec),
    "-filter_complex",
    filters.join(";"),
    "-map",
    "[vout]",
    "-map",
    wordmarkPath ? "2:a" : "1:a",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "21",
    "-maxrate",
    "5000k",
    "-bufsize",
    "10000k",
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

export { displayLinesForTrendRemix };
