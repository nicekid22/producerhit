/**
 * Viral Shorts video template — Hook → music → reveal → CTA (12–18 s).
 * Modern 2026 look: clean cover, subtle grain, brand wordmark PNG.
 */

import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  ART_TEMPLATE_FPS,
  brandWordmarkDrawtextFilter,
  escapePath,
  modernBaseFilter,
  resolveFontfile,
  stockVideoBaseFilter,
  textStyle,
  vhsOverlayFilter,
  visualStyle,
} from "./youtubeBrandOverlay.mjs";

export { ART_TEMPLATE_FPS };

export const VIRAL_SHORT_SEC = 18;

function writeTextFiles(outDir, fields) {
  const paths = {};
  for (const [key, value] of Object.entries(fields)) {
    const p = join(outDir, `${key}.txt`);
    writeFileSync(p, String(value ?? "").trim(), "utf8");
    paths[key] = p;
  }
  return paths;
}

function timingForSeries(series) {
  if (series === "guess_prompt") {
    return { hookEnd: 2, sourceEnd: 2, musicEnd: 13, revealEnd: 16, total: VIRAL_SHORT_SEC };
  }
  if (series === "absurd_to_song") {
    return { hookEnd: 2, sourceEnd: 2, musicEnd: 12, revealEnd: 15, total: VIRAL_SHORT_SEC };
  }
  return { hookEnd: 2, sourceEnd: 4.5, musicEnd: 12, revealEnd: 15, total: VIRAL_SHORT_SEC };
}

export function buildViralShortFilter(opts) {
  const fps = opts.fps ?? ART_TEMPLATE_FPS;
  const series = opts.series ?? "comment_to_song";
  const t = timingForSeries(series);
  const font = resolveFontfile();
  const ts = textStyle();
  const useStock = Boolean(opts.useStockVideo);
  const tf = (name) => `textfile='${escapePath(opts.textFiles[name])}'`;

  const parts = [useStock ? stockVideoBaseFilter("0:v", fps) : modernBaseFilter("0:v", fps)];
  if (visualStyle() === "vhs") {
    parts.push(vhsOverlayFilter("vg", fps));
    parts.push("");
  }
  const baseLabel = visualStyle() === "vhs" ? "vhs" : "vg";

  parts.push(
    `[${baseLabel}]drawtext=${tf("hookOpen")}${font}:${ts.hook}:x=(w-text_w)/2:y=h*0.22:enable='between(t\\,0\\,${t.hookEnd})'[a1]`,
  );

  if (series === "comment_to_song") {
    parts.push(
      `[a1]drawtext=${tf("sourceText")}${font}:${ts.body}:x=(w-text_w)/2:y=h*0.40:enable='between(t\\,${t.hookEnd}\\,${t.sourceEnd})'[a2]`,
    );
  } else {
    parts.push(`[a1]copy[a2]`);
  }

  parts.push(
    `[a2]drawtext=${tf("reveal")}${font}:${ts.reveal}:x=(w-text_w)/2:y=h*0.62:enable='between(t\\,${t.musicEnd}\\,${t.revealEnd})'[a3]`,
    `[a3]drawtext=${tf("cta")}${font}:${ts.cta}:x=(w-text_w)/2:y=h*0.78:enable='between(t\\,${t.revealEnd}\\,${t.total})'[a4]`,
    brandWordmarkDrawtextFilter("a4"),
    "[branded]copy[vout]",
  );

  return { filter: parts.filter(Boolean).join(";"), timing: t };
}

export function buildViralRenderArgs({ coverPath, stockVideoPath, audioPath, outPath, viralMeta, maxSec }) {
  const sec = maxSec ?? VIRAL_SHORT_SEC;
  const fps = ART_TEMPLATE_FPS;
  const textDir = dirname(outPath);
  const series = viralMeta.series ?? "comment_to_song";
  const useStock = Boolean(stockVideoPath);
  const revealText =
    viralMeta.hookReveal ??
    (series === "guess_prompt"
      ? viralMeta.sourceText
      : `${viralMeta.revealPrefix ?? "Prompt:"} ${viralMeta.aceCaption?.slice(0, 80) ?? viralMeta.sourceText}`);

  const textFiles = writeTextFiles(textDir, {
    hookOpen: viralMeta.hookOpen,
    sourceText: viralMeta.sourceText,
    reveal: revealText,
    cta: viralMeta.hookCta,
  });

  const { filter } = buildViralShortFilter({ fps, series, textFiles, textDir, useStockVideo: useStock });

  const videoInput = useStock
    ? ["-stream_loop", "-1", "-i", stockVideoPath]
    : coverPath
      ? ["-loop", "1", "-framerate", String(fps), "-i", coverPath]
      : ["-f", "lavfi", "-i", `color=c=0x0a0a0f:s=1080x1920:r=${fps}`];

  return [
    "-y",
    ...videoInput,
    "-i",
    audioPath,
    "-t",
    String(sec),
    "-filter_complex",
    filter,
    "-map",
    "[vout]",
    "-map",
    "1:a",
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
  ];
}

export function extractViralMeta(stemsUrl) {
  if (!stemsUrl || typeof stemsUrl !== "object") return null;
  const ace = /** @type {Record<string, unknown>} */ (stemsUrl).ace;
  if (!ace || typeof ace !== "object") return null;
  const viral = /** @type {Record<string, unknown>} */ (ace).viral;
  if (!viral || typeof viral !== "object") return null;
  return /** @type {Record<string, string>} */ (viral);
}

export function youtubeViralPreviewSec() {
  const raw = Number(process.env.YOUTUBE_VIRAL_PREVIEW_SEC ?? String(VIRAL_SHORT_SEC));
  return Math.max(12, Math.min(30, Number.isFinite(raw) ? raw : VIRAL_SHORT_SEC));
}
