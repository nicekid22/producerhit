import type { Loop } from "@/types/loop";
import { hashString, resolveCoverArtPrompt, coverImageSeed } from "@/lib/utils";
import { resolvePlayableAudioUrl } from "@/lib/playableAudio";
import { canvasSizeForLayout, resolveExportDuration } from "@/lib/visualizer/renderFrame";
import type { VisualizerLayout } from "@/lib/visualizer/types";
import { supabase } from "@/lib/supabaseClient";
import { getTotalGenerationLimit } from "@/lib/planLimits";

export const MOOD_VIDEO_EXPORT_MAX_SEC = 15;
export const MOOD_VIDEO_CREDIT_COST = 1;

const LOGO_SRC = "/img/logovideo.png";

export type MoodBoardCredits = {
  remaining: number;
  used: number;
  limit: number;
  plan: string;
};

export type MoodBoardImageResult = {
  imageUrl: string;
  source: string;
  query: string;
  layout: VisualizerLayout;
  used?: number;
  limit?: number;
};

export async function fetchMoodBoardCredits(userId: string): Promise<MoodBoardCredits | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("plan, loops_used_this_month, referral_bonus, level_bonus, daily_bonus_month")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;

  const plan = typeof data.plan === "string" ? data.plan : "free";
  const used = typeof data.loops_used_this_month === "number" ? data.loops_used_this_month : 0;
  const referralBonus = typeof data.referral_bonus === "number" ? data.referral_bonus : 0;
  const levelBonus = typeof data.level_bonus === "number" ? data.level_bonus : 0;
  const dailyBonusMonth = typeof data.daily_bonus_month === "number" ? data.daily_bonus_month : 0;
  const limit = getTotalGenerationLimit(plan, { referralBonus, levelBonus, dailyBonusMonth });

  return { remaining: Math.max(0, limit - used), used, limit, plan };
}

export function newMoodBoardIdempotencyKey(loopId: string): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${loopId}:${suffix}`;
}

/** Requête visuelle Pinterest — filtrée par genre / mood du morceau (portraits, ambiance). */
export function buildMoodBoardSearchQuery(loop: Loop, extra?: string): string {
  const parts = [
    loop.genre?.trim(),
    loop.mood?.trim(),
    loop.influence?.trim(),
    extra?.trim(),
    "aesthetic music",
    "people portrait ambiance",
  ].filter(Boolean);
  const base = parts.join(" ").replace(/\s+/g, " ").trim();
  if (base.length >= 3) return base.slice(0, 100);
  return resolveCoverArtPrompt(loop).slice(0, 100);
}

async function extractInvokeError(error: unknown): Promise<string> {
  const anyError = error as { message?: string; context?: unknown };
  const errContext = anyError.context;
  if (errContext && typeof errContext === "object" && typeof (errContext as Response).text === "function") {
    try {
      const text = await (errContext as Response).text();
      const parsed = JSON.parse(text) as { error?: string };
      if (typeof parsed.error === "string") return parsed.error;
      if (text.trim()) return text.trim();
    } catch {
      // ignore
    }
  }
  return anyError.message ?? "fetch_mood_image_failed";
}

export async function fetchMoodBoardImage(
  loop: Loop,
  layout: VisualizerLayout = "story",
  options?: { idempotencyKey?: string; searchQuery?: string },
): Promise<MoodBoardImageResult> {
  const query = (options?.searchQuery ?? buildMoodBoardSearchQuery(loop)).trim();
  if (query.length < 2) throw new Error("query_too_short");

  const seed = coverImageSeed(loop);
  const key = options?.idempotencyKey?.trim() || newMoodBoardIdempotencyKey(loop.id);

  const { data, error } = await supabase.functions.invoke("fetch-mood-image", {
    body: { loopId: loop.id, query, seed, layout, idempotencyKey: key },
  });

  if (error) {
    const code = await extractInvokeError(error);
    throw new Error(code);
  }
  if (data?.error === "no_credits") throw new Error("no_credits");
  if (typeof data?.imageUrl !== "string" || !data.imageUrl.startsWith("http")) {
    throw new Error(typeof data?.error === "string" ? data.error : "image_fetch_failed");
  }

  return {
    imageUrl: data.imageUrl,
    source: typeof data.source === "string" ? data.source : "unknown",
    query,
    layout: data.layout === "square" ? "square" : "story",
    used: typeof data.used === "number" ? data.used : undefined,
    limit: typeof data.limit === "number" ? data.limit : undefined,
  };
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "video/webm";
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) return "video/webm;codecs=vp9,opus";
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) return "video/webm;codecs=vp8,opus";
  return "video/webm";
}

async function loadImageBitmap(url: string): Promise<ImageBitmap> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("image_load_failed");
  const blob = await res.blob();
  return await createImageBitmap(blob);
}

let logoBitmapPromise: Promise<ImageBitmap | null> | null = null;

function loadLogoBitmap(): Promise<ImageBitmap | null> {
  if (!logoBitmapPromise) {
    logoBitmapPromise = fetch(LOGO_SRC)
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => (b ? createImageBitmap(b) : null))
      .catch(() => null);
  }
  return logoBitmapPromise;
}

function drawKenBurnsImage(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap,
  w: number,
  h: number,
  t: number,
  durationSec: number,
  seed: number,
) {
  const progress = Math.min(1, t / Math.max(0.1, durationSec));
  const iw = img.width;
  const ih = img.height;
  const baseScale = Math.max(w / iw, h / ih);
  const zoom = 1.06 + progress * 0.14;
  const scale = baseScale * zoom;
  const panX = Math.sin(progress * Math.PI * 2 + seed * 0.01) * w * 0.035;
  const panY = Math.cos(progress * Math.PI + seed * 0.02) * h * 0.025;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (w - dw) / 2 + panX;
  const dy = (h - dh) / 2 + panY;

  ctx.fillStyle = "#050508";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, dx, dy, dw, dh);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(6,6,12,0.35)");
  grad.addColorStop(0.45, "rgba(6,6,12,0.08)");
  grad.addColorStop(1, "rgba(6,6,12,0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawCenterLogo(ctx: CanvasRenderingContext2D, w: number, h: number, logo: ImageBitmap, t: number) {
  const base = Math.min(w, h) * 0.2;
  const pulse = 1 + Math.sin(t * 2.2) * 0.04;
  const size = base * pulse;
  const x = (w - size) / 2;
  const y = (h - size) / 2;
  const aspect = logo.width / Math.max(1, logo.height);
  let dw = size;
  let dh = size;
  if (aspect > 1) dh = size / aspect;
  else dw = size * aspect;

  ctx.save();
  ctx.shadowColor = "rgba(157, 124, 255, 0.75)";
  ctx.shadowBlur = 28;
  ctx.globalAlpha = 0.95;
  ctx.drawImage(logo, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, size * 0.55, size * 0.55, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawTrackMeta(ctx: CanvasRenderingContext2D, w: number, h: number, loop: Loop, isFr: boolean) {
  const title = (loop.name || "ProducerHit").slice(0, 48);
  const sub = [loop.genre, loop.mood, loop.bpm ? `${loop.bpm} BPM` : ""].filter(Boolean).join(" · ");

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = `700 ${Math.max(11, Math.floor(w * 0.038))}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(title, w / 2, h - Math.max(36, h * 0.1));

  if (sub) {
    ctx.font = `500 ${Math.max(9, Math.floor(w * 0.028))}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(sub, w / 2, h - Math.max(20, h * 0.06));
  }

  ctx.font = `600 ${Math.max(8, Math.floor(w * 0.022))}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(103,195,255,0.7)";
  ctx.fillText(isFr ? "made with ProducerHit" : "made with ProducerHit", w / 2, h - Math.max(10, h * 0.03));
  ctx.restore();
}

/** Vidéo sociale : photo mood + logo centré + audio (rendu navigateur). */
export async function exportMoodBoardVideo(
  loop: Loop,
  imageUrl: string,
  layout: VisualizerLayout,
  options?: {
    durationSec?: number;
    showWatermark?: boolean;
    locale?: "en" | "fr";
  },
): Promise<Blob> {
  if (!loop.audioUrl) throw new Error("missing_audio");
  if (typeof MediaRecorder === "undefined") throw new Error("unsupported");

  const exportSec = Math.min(
    MOOD_VIDEO_EXPORT_MAX_SEC,
    resolveExportDuration(loop, options?.durationSec ?? MOOD_VIDEO_EXPORT_MAX_SEC),
  );
  const { width: w, height: h } = canvasSizeForLayout(layout);
  const seed = hashString(`${loop.id}:mood:${layout}`);
  const isFr = options?.locale === "fr";

  const [bgBitmap, logoBitmap, audioUrl] = await Promise.all([
    loadImageBitmap(imageUrl),
    loadLogoBitmap(),
    resolvePlayableAudioUrl(loop.audioUrl, loop.id),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const audio = new Audio();
  audio.crossOrigin = "anonymous";
  audio.preload = "auto";
  audio.src = audioUrl;

  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(audio);
  const dest = audioCtx.createMediaStreamDestination();
  source.connect(dest);

  const canvasStream = canvas.captureStream(30);
  const out = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const mime = pickMimeType();
  const rec = new MediaRecorder(out, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data?.size) chunks.push(e.data);
  };
  const stopPromise = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
  });

  const startTs = performance.now();
  let lastTs = startTs;

  const tick = () => {
    const now = performance.now();
    const t = (now - startTs) / 1000;
    lastTs = now;

    drawKenBurnsImage(ctx, bgBitmap, w, h, t, exportSec, seed);
    if (logoBitmap) drawCenterLogo(ctx, w, h, logoBitmap, t);
    if (options?.showWatermark !== false) drawTrackMeta(ctx, w, h, loop, isFr);

    if (t < exportSec) requestAnimationFrame(tick);
  };

  rec.start(100);
  await audioCtx.resume().catch(() => undefined);
  await audio.play().catch(() => undefined);
  tick();

  await new Promise<void>((resolve) => window.setTimeout(resolve, exportSec * 1000));

  rec.stop();
  audio.pause();
  canvasStream.getTracks().forEach((tr) => tr.stop());
  dest.stream.getTracks().forEach((tr) => tr.stop());
  await audioCtx.close().catch(() => undefined);

  return stopPromise;
}

export function downloadMoodBoardVideoBlob(loop: Loop, blob: Blob, layout: VisualizerLayout): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cleanName = (loop.name || "producerhit")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 64);
  const suffix = layout === "square" ? "mood-square" : "mood-tiktok";
  a.download = `${cleanName || "producerhit"}-${suffix}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
