/**
 * Resolve a usable JPEG cover for community Shorts (cover → og-loop → Pollinations → gradient).
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";

const SITE = "https://www.producerhit.com";

function pollinationsUrl(loop) {
  const name = String(loop.name ?? "AI music").trim().slice(0, 80);
  const genre = String(loop.genre ?? "electronic").trim();
  const prompt = `${name} ${genre} album cover portrait vertical dark aesthetic`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1920&nologo=true`;
}

function isValidImageBuffer(buf) {
  if (!buf || buf.byteLength < 512) return false;
  const head = buf.slice(0, 120).toString("utf8");
  if (head.includes("<svg") || head.includes("<!DOCTYPE") || head.includes("<html")) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8) return true;
  if (buf[0] === 0x89 && buf[1] === 0x50) return true;
  if (buf[0] === 0x47 && buf[1] === 0x49) return true;
  return buf.byteLength > 2048;
}

async function writeGradientFallback(coverPath) {
  try {
    const sharp = (await import("sharp")).default;
    const svg = `<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1a1030"/>
        <stop offset="55%" stop-color="#0a0a12"/>
        <stop offset="100%" stop-color="#050508"/>
      </linearGradient></defs>
      <rect width="1080" height="1920" fill="url(#g)"/>
    </svg>`;
    await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(coverPath);
    return coverPath;
  } catch {
    return null;
  }
}

export async function resolveLoopCoverPath(loop, workDir) {
  const coverPath = join(workDir, "cover.jpg");
  const urls = [
    loop.cover_url,
    `${SITE}/api/og-loop?id=${encodeURIComponent(loop.id)}`,
    pollinationsUrl(loop),
  ].filter((u) => typeof u === "string" && u.trim().startsWith("http"));

  for (const url of urls) {
    try {
      const res = await fetch(url.trim(), { signal: AbortSignal.timeout(25_000) });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (!isValidImageBuffer(buf)) continue;
      await fs.writeFile(coverPath, buf);
      return coverPath;
    } catch {
      // try next
    }
  }

  const gradient = await writeGradientFallback(coverPath);
  return gradient;
}
