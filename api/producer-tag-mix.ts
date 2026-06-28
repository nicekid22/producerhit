import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";

export const config = {
  maxDuration: 120,
  memory: 1024,
};

type FxPreset = "clean" | "radio" | "reverb" | "phone" | "pitch_up" | "pitch_down";

function runFfmpeg(args: string[]): Promise<void> {
  const bin = ffmpegPath;
  if (!bin) return Promise.reject(new Error("ffmpeg_binary_missing"));

  return new Promise((resolve, reject) => {
    const proc = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg_exit_${code}:${stderr.slice(-1200)}`));
    });
  });
}

function tagFxFilter(preset: FxPreset): string {
  switch (preset) {
    case "radio":
      return "highpass=f=200,lowpass=f=4000";
    case "reverb":
      return "aecho=0.8:0.88:60:0.4";
    case "phone":
      return "highpass=f=300,lowpass=f=3400";
    case "pitch_up":
      return "asetrate=44100*1.06,aresample=44100";
    case "pitch_down":
      return "asetrate=44100*0.94,aresample=44100";
    default:
      return "anull";
  }
}

async function normalizeTag(inputPath: string, outputPath: string, fxPreset: FxPreset): Promise<void> {
  const fx = tagFxFilter(fxPreset);
  const filter = `[0:a]silenceremove=start_periods=1:start_silence=0.02:start_threshold=-45dB,${fx},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[tag]`;
  await runFfmpeg([
    "-y",
    "-i",
    inputPath,
    "-filter_complex",
    filter,
    "-map",
    "[tag]",
    "-c:a",
    "libmp3lame",
    "-q:a",
    "2",
    outputPath,
  ]);
}

async function mixBeatAndTag(opts: {
  beatPath: string;
  tagPath: string;
  outPath: string;
  offsetSec: number;
  volumeDb: number;
  fadeMs: number;
}): Promise<void> {
  const delayMs = Math.max(0, Math.round(opts.offsetSec * 1000));
  const fadeSec = Math.max(0.01, opts.fadeMs / 1000);
  const vol = Math.pow(10, opts.volumeDb / 20);
  const filter = [
    `[1:a]adelay=${delayMs}|${delayMs},volume=${vol.toFixed(4)},afade=t=in:st=0:d=${fadeSec}[tag]`,
    "[0:a][tag]amix=inputs=2:duration=first:dropout_transition=0,alimiter=limit=0.95[out]",
  ].join(";");
  await runFfmpeg([
    "-y",
    "-i",
    opts.beatPath,
    "-i",
    opts.tagPath,
    "-filter_complex",
    filter,
    "-map",
    "[out]",
    "-c:a",
    "libmp3lame",
    "-q:a",
    "2",
    opts.outPath,
  ]);
}

async function readBodyBuffer(req: import("node:http").IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function parseMultipart(raw: Buffer, boundary: string): Map<string, Buffer | string> {
  const parts = new Map<string, Buffer | string>();
  const delim = `--${boundary}`;
  const sections = raw.toString("binary").split(delim);
  for (const section of sections) {
    if (!section || section === "--\r\n" || section === "--") continue;
    const headerEnd = section.indexOf("\r\n\r\n");
    if (headerEnd < 0) continue;
    const headers = section.slice(0, headerEnd);
    const body = section.slice(headerEnd + 4).replace(/\r\n$/, "");
    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="/);
    const key = nameMatch?.[1];
    if (!key) continue;
    if (filenameMatch) {
      parts.set(key, Buffer.from(body, "binary"));
    } else {
      parts.set(key, body.trim());
    }
  }
  return parts;
}

export default async function handler(req: import("node:http").IncomingMessage & { method?: string }, res: import("node:http").ServerResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const secret = process.env.PRODUCER_TAG_MIX_SECRET ?? "";
  const headerSecret = String(req.headers["x-producer-tag-secret"] ?? "");
  if (!secret || headerSecret !== secret) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const contentType = String(req.headers["content-type"] ?? "");
  if (!contentType.includes("multipart/form-data")) {
    res.status(400).json({ error: "multipart_required" });
    return;
  }

  const boundaryMatch = contentType.match(/boundary=(.+)$/);
  const boundary = boundaryMatch?.[1]?.trim();
  if (!boundary) {
    res.status(400).json({ error: "invalid_boundary" });
    return;
  }

  const workId = `pt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const dir = join(tmpdir(), workId);
  const beatPath = join(dir, "beat.bin");
  const tagRawPath = join(dir, "tag_raw.bin");
  const tagNormPath = join(dir, "tag_norm.mp3");
  const outPath = join(dir, "out.mp3");

  try {
    await fs.mkdir(dir, { recursive: true });
    const raw = await readBodyBuffer(req);
    const parts = parseMultipart(raw, boundary);

    const beat = parts.get("beat");
    const tag = parts.get("tag");
    if (!Buffer.isBuffer(beat) || !Buffer.isBuffer(tag)) {
      res.status(400).json({ error: "beat_and_tag_required" });
      return;
    }

    const mode = String(parts.get("mode") ?? "mix");
    const offsetSec = Number(parts.get("offsetSec") ?? 0);
    const volumeDb = Number(parts.get("volumeDb") ?? -3);
    const fadeMs = Number(parts.get("fadeMs") ?? 50);
    const fxPreset = String(parts.get("fxPreset") ?? "clean") as FxPreset;

    await fs.writeFile(beatPath, beat);
    await fs.writeFile(tagRawPath, tag);
    await normalizeTag(tagRawPath, tagNormPath, fxPreset);

    if (mode === "normalize_only") {
      const normBytes = await fs.readFile(tagNormPath);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", String(normBytes.byteLength));
      res.status(200).send(normBytes);
      return;
    }

    if (mode === "variants") {
      const variants: Array<{ id: string; label: string; fxPreset: FxPreset; bytes: Buffer }> = [];
      const presets: Array<{ id: string; label: string; fx: FxPreset }> = [
        { id: "clean", label: "Clean", fx: "clean" },
        { id: "radio", label: "Radio", fx: "radio" },
        { id: "pitch_up", label: "Pitch +", fx: "pitch_up" },
        { id: "pitch_down", label: "Pitch -", fx: "pitch_down" },
        { id: "phone", label: "Phone", fx: "phone" },
      ];
      for (const p of presets) {
        const vPath = join(dir, `var_${p.id}.mp3`);
        await normalizeTag(tagRawPath, vPath, p.fx);
        variants.push({ id: p.id, label: p.label, fxPreset: p.fx, bytes: await fs.readFile(vPath) });
      }
      res.status(200).json({
        variants: variants.map((v) => ({
          id: v.id,
          label: v.label,
          fxPreset: v.fxPreset,
          base64: v.bytes.toString("base64"),
        })),
      });
      return;
    }

    await mixBeatAndTag({
      beatPath,
      tagPath: tagNormPath,
      outPath,
      offsetSec: Number.isFinite(offsetSec) ? offsetSec : 0,
      volumeDb: Number.isFinite(volumeDb) ? volumeDb : -3,
      fadeMs: Number.isFinite(fadeMs) ? fadeMs : 50,
    });

    const outBytes = await fs.readFile(outPath);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", String(outBytes.byteLength));
    res.status(200).send(outBytes);
  } catch (e) {
    console.error("producer-tag-mix", e);
    res.status(500).json({ error: e instanceof Error ? e.message : "mix_failed" });
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}


