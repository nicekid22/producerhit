/**
 * Landscape cover for video — Pinterest photo, upscaled for Ken Burns zoom.
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { extractTrendRemixMeta } from "./youtubeSocial.mjs";
import { resolveCoverUrlFromLoop } from "./trendRemixPinterestCover.mjs";

const VIDEO_W = 2560;
const VIDEO_H = 1440;

function hashHue(input) {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h % 360;
}

function isValidImageBuffer(buf) {
  if (!buf || buf.byteLength < 512) return false;
  const head = buf.slice(0, 120).toString("utf8");
  if (head.includes("<!DOCTYPE") || head.includes("<html")) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8) return true;
  if (buf[0] === 0x89 && buf[1] === 0x50) return true;
  if (buf[0] === 0x47 && buf[1] === 0x49) return true;
  return buf.byteLength > 2048;
}

/** Upscale cover for video — reduces pixelation when zooming. */
async function rasterizeCoverForVideo(buf, coverPath) {
  const sharp = (await import("sharp")).default;
  await sharp(buf).resize(VIDEO_W, VIDEO_H, { fit: "cover", position: "centre" }).jpeg({ quality: 93 }).toFile(coverPath);
  return coverPath;
}

async function writeAbstractCover(loop, coverPath) {
  const sharp = (await import("sharp")).default;
  const meta = extractTrendRemixMeta(loop.stems_url);
  const hue = hashHue(`${loop.id}:${meta?.remixGenre ?? ""}`);
  const svg = `<svg width="${VIDEO_W}" height="${VIDEO_H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue},72%,38%)"/>
        <stop offset="50%" stop-color="hsl(${(hue + 55) % 360},68%,22%)"/>
        <stop offset="100%" stop-color="hsl(${(hue + 110) % 360},60%,12%)"/>
      </linearGradient>
    </defs>
    <rect width="${VIDEO_W}" height="${VIDEO_H}" fill="url(#bg)"/>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toFile(coverPath);
  return coverPath;
}

export async function resolveTrendRemixCoverPath(loop, workDir) {
  const coverPath = join(workDir, "trend-cover.jpg");
  const url = resolveCoverUrlFromLoop(loop);

  if (url?.startsWith("http")) {
    try {
      const res = await fetch(url.trim(), { signal: AbortSignal.timeout(30_000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (isValidImageBuffer(buf)) {
          await rasterizeCoverForVideo(buf, coverPath);
          return coverPath;
        }
      }
    } catch {
      // fallback
    }
  }

  return writeAbstractCover(loop, coverPath);
}

export { VIDEO_W, VIDEO_H };
