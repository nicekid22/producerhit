/**
 * Royalty-free portrait B-roll for viral concept Shorts (Pexels API + motion fallback).
 * Community music Shorts use loop covers instead — see youtubeCoverResolve.mjs.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";

const SERIES_QUERIES = {
  comment_to_song: ["phone scrolling social media night", "typing comment smartphone dark"],
  absurd_to_song: ["convenience store receipt shopping", "random everyday objects aesthetic"],
  guess_prompt: ["music studio headphones moody", "mystery question mark dark portrait"],
};

/** @deprecated Direct Pexels CDN links require fresh API tokens — use PEXELS_API_KEY instead. */
const CURATED_PORTRAIT_MP4 = [];

function runFfmpeg(args) {
  const bin = ffmpegPath;
  if (!bin) return Promise.reject(new Error("ffmpeg_binary_missing"));
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (c) => {
      stderr += String(c);
    });
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr.slice(-400)))));
  });
}

/** Subtle animated gradient when Pexels is unavailable (still beats flat black). */
async function generateMotionGradientVideo(workDir, seed) {
  const dest = join(workDir, "motion.mp4");
  const hue = (seed % 120) + 200;
  try {
    await runFfmpeg([
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=0x12101a:s=1080x1920:r=30",
      "-t",
      "22",
      "-vf",
      `hue=h='${hue}+8*sin(2*PI*t/18)':s=0.35,noise=alls=6:allf=t+u,eq=brightness=-0.04`,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      dest,
    ]);
    return dest;
  } catch {
    return null;
  }
}

function seedFromLoop(loopId, series) {
  const h = createHash("sha256").update(`${loopId}:${series}`).digest();
  return h.readUInt32BE(0);
}

function pickPortraitFile(files) {
  const portrait = (files ?? [])
    .filter((f) => f?.link?.startsWith("http") && (f.height ?? 0) >= (f.width ?? 0))
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
  const hd = portrait.find((f) => (f.height ?? 0) >= 1280 && (f.height ?? 0) <= 2160);
  return (hd ?? portrait[0])?.link ?? null;
}

async function searchPexelsVideo(apiKey, query, seed) {
  const page = (seed % 6) + 1;
  const params = new URLSearchParams({
    query: query.slice(0, 64),
    orientation: "portrait",
    per_page: "12",
    page: String(page),
  });
  const res = await fetch(`https://api.pexels.com/videos/search?${params}`, {
    headers: { Authorization: apiKey },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const videos = json.videos ?? [];
  if (!videos.length) return null;
  const pick = videos[seed % videos.length];
  return pickPortraitFile(pick.video_files);
}

async function downloadVideo(url, dest) {
  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 50_000) return false;
  await fs.writeFile(dest, buf);
  return true;
}

export async function fetchViralStockVideo({ series, loopId, workDir }) {
  const dest = join(workDir, "stock.mp4");
  const seed = seedFromLoop(loopId ?? "x", series ?? "comment_to_song");
  const queries = SERIES_QUERIES[series] ?? SERIES_QUERIES.comment_to_song;
  const apiKey = (process.env.PEXELS_API_KEY ?? "").trim();

  if (apiKey) {
    for (let i = 0; i < queries.length; i += 1) {
      const q = queries[(seed + i) % queries.length];
      const link = await searchPexelsVideo(apiKey, q, seed + i).catch(() => null);
      if (link && (await downloadVideo(link, dest))) return dest;
    }
  }

  const curated = CURATED_PORTRAIT_MP4[seed % Math.max(CURATED_PORTRAIT_MP4.length, 1)];
  if (curated && (await downloadVideo(curated, dest))) return dest;

  for (const url of CURATED_PORTRAIT_MP4) {
    if (await downloadVideo(url, dest)) return dest;
  }

  return generateMotionGradientVideo(workDir, seed);
}
