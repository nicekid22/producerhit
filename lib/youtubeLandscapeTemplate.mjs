/**
 * Landscape 16:9 YouTube template — full song + lyrics + SEO title overlay.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolveFontfile, escapePath } from "./youtubeBrandOverlay.mjs";

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

function wrapLines(text, maxLen = 42, maxLines = 8) {
  const words = String(text ?? "")
    .replace(/\[[^\]]+\]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxLen && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
    if (lines.length >= maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines.slice(0, maxLines);
}

export function youtubeTrendRemixMaxSec() {
  const raw = Number(process.env.TREND_REMIX_MAX_SEC ?? process.env.TREND_REMIX_DURATION_SEC ?? 120);
  return Math.max(60, Math.min(180, Number.isFinite(raw) ? raw : 120));
}

export function buildLandscapeBaseFilter(inputLabel = "0:v", fps = LANDSCAPE_FPS) {
  return [
    `[${inputLabel}]scale=${LANDSCAPE_W}:${LANDSCAPE_H}:force_original_aspect_ratio=increase,crop=${LANDSCAPE_W}:${LANDSCAPE_H},setsar=1[base]`,
    `[base]split=2[bg][grainSrc]`,
    `[grainSrc]format=gray,noise=alls=3:allf=t+u,geq=lum='lum(X\\,Y)*0.15'[grain]`,
    `[bg][grain]blend=all_mode=overlay:all_opacity=0.1[grained]`,
    `[grained]vignette=PI/6:mode=forward[vid]`,
  ].join(";");
}

export function buildLandscapeRenderArgs({
  coverPath,
  audioPath,
  outPath,
  maxSec,
  title,
  subtitle,
  artistLine,
  lyrics,
}) {
  const sec = maxSec ?? youtubeTrendRemixMaxSec();
  const fps = LANDSCAPE_FPS;
  const font = resolveFontfile();
  const titleText = escapeDrawtext(String(title ?? "AI Remix").slice(0, 72));
  const subText = escapeDrawtext(String(subtitle ?? "").slice(0, 48));
  const artistText = escapeDrawtext(String(artistLine ?? "").slice(0, 56));
  const lyricLines = wrapLines(lyrics, 38, 7);

  const titleFile = join(dirname(outPath), "landscape-title.txt");
  writeFileSync(titleFile, String(title ?? ""), "utf8");

  const filters = [buildLandscapeBaseFilter("0:v", fps)];

  let last = "vid";
  filters.push(
    `[${last}]drawbox=x=0:y=0:w=iw:h=ih*0.16:color=0x000000@0.55:t=fill[topbar]`,
    `[topbar]drawtext=text='${titleText}'${font}:fontcolor=0xF5F8FF:fontsize=46:shadowcolor=black@0.55:shadowx=0:shadowy=2:x=(w-text_w)/2:y=h*0.035[titled]`,
  );
  last = "titled";

  if (subText) {
    filters.push(
      `[${last}]drawtext=text='${subText}'${font}:fontcolor=0xB8C5D6:fontsize=28:x=(w-text_w)/2:y=h*0.095[subtitled]`,
    );
    last = "subtitled";
  }

  if (artistText) {
    filters.push(
      `[${last}]drawtext=text='${artistText}'${font}:fontcolor=0x8899AA:fontsize=24:x=(w-text_w)/2:y=h*0.13[artist]`,
    );
    last = "artist";
  }

  filters.push(
    `[${last}]drawbox=x=iw*0.52:y=ih*0.18:w=iw*0.44:h=ih*0.68:color=0x000000@0.35:t=fill[lyricbox]`,
  );
  last = "lyricbox";

  lyricLines.forEach((line, i) => {
    const y = 0.22 + i * 0.075;
    const label = `ly${i}`;
    filters.push(
      `[${last}]drawtext=text='${escapeDrawtext(line)}'${font}:fontcolor=0xE8EEF5:fontsize=30:x=w*0.54:y=h*${y.toFixed(3)}[${label}]`,
    );
    last = label;
  });

  filters.push(
    `[${last}]drawtext=text='producerhit.com — Create your own AI remix'${font}:fontcolor=0xE8F4FF@0.75:fontsize=26:shadowcolor=black@0.45:shadowx=0:shadowy=1:x=w*0.54:y=h*0.88[branded]`,
    `[branded]copy[vout]`,
  );

  return [
    "-y",
    "-loop",
    "1",
    "-framerate",
    String(fps),
    "-i",
    coverPath,
    "-i",
    audioPath,
    "-t",
    String(sec),
    "-filter_complex",
    filters.join(";"),
    "-map",
    "[vout]",
    "-map",
    "1:a",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "22",
    "-maxrate",
    "4500k",
    "-bufsize",
    "9000k",
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

export { wrapLines };
