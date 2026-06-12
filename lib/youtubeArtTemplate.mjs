/**
 * ProducerHit Shorts — clean cover + modern grain + brand wordmark + hook caption.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pickYouTubeHook } from "./youtubeHooks.mjs";
import {
  ART_TEMPLATE_FPS,
  brandWordmarkDrawtextFilter,
  modernBaseFilter,
  resolveFontfile,
  textStyle,
  vhsOverlayFilter,
  visualStyle,
} from "./youtubeBrandOverlay.mjs";

export { ART_TEMPLATE_FPS };

function escapeDrawtext(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%");
}

function escapePath(p) {
  return String(p).replace(/\\/g, "/").replace(/:/g, "\\:");
}

function wrapHook(text, maxLen = 38) {
  const s = String(text ?? "").trim();
  if (s.length <= maxLen) return s;
  const mid = Math.floor(s.length / 2);
  let split = s.lastIndexOf(" ", mid);
  if (split < 12) split = s.indexOf(" ", mid);
  if (split < 0) return s;
  return `${s.slice(0, split)}\n${s.slice(split + 1)}`;
}

export function buildProducerHitArtFilter(opts) {
  const fps = opts.fps ?? ART_TEMPLATE_FPS;
  const hookText = wrapHook(opts.hook ?? pickYouTubeHook({ loopId: opts.loopId, kind: opts.trackKind }));
  const hookSource = opts.hookFile
    ? `textfile='${escapePath(opts.hookFile)}'`
    : `text='${escapeDrawtext(hookText)}'`;
  const font = resolveFontfile();
  const ts = textStyle();

  const parts = [modernBaseFilter("0:v", fps)];
  if (visualStyle() === "vhs") {
    parts.push(vhsOverlayFilter("vg", fps));
  }
  const baseLabel = visualStyle() === "vhs" ? "vhs" : "vg";

  parts.push(
    `[${baseLabel}]drawtext=${hookSource}${font}:${ts.hook}:x=(w-text_w)/2:y=h*0.68:enable='between(t\\,0\\,999)'[cap]`,
    brandWordmarkDrawtextFilter("cap"),
    "[branded]copy[vout]",
  );

  return { filter: parts.filter(Boolean).join(";"), hook: hookText };
}

export function buildArtisticRenderArgs({ coverPath, audioPath, outPath, maxSec, loopId, trackKind, hook }) {
  const sec = maxSec;
  const fps = ART_TEMPLATE_FPS;
  const hookText = wrapHook(hook ?? pickYouTubeHook({ loopId, kind: trackKind }));
  const hookFile = join(dirname(outPath), "hook.txt");
  writeFileSync(hookFile, hookText, "utf8");
  const { filter } = buildProducerHitArtFilter({ fps, loopId, trackKind, hook, hookFile });

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

export { pickYouTubeHook };
