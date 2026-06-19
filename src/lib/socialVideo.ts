import type { Loop } from "@/types/loop";
import { resolveCoverArtPrompt, coverImageSeed } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { resolvePlayableAudioUrl } from "@/lib/playableAudio";
import { canvasSizeForLayout, resolveExportDuration } from "@/lib/visualizer/renderFrame";
import type { VisualizerLayout } from "@/lib/visualizer/types";
import { hashString } from "@/lib/utils";
import { getTotalGenerationLimit } from "@/lib/planLimits";

export const SOCIAL_VIDEO_POLLINATIONS_SEC = 6;
export const SOCIAL_VIDEO_EXPORT_MAX_SEC = 15;
export const SOCIAL_VIDEO_CREDIT_COST = 1;

export type SocialVideoGenerateResult = {
  videoUrl: string;
  durationSec: number;
  layout: VisualizerLayout;
  used?: number;
  limit?: number;
};

export type SocialVideoCredits = {
  remaining: number;
  used: number;
  limit: number;
  plan: string;
};

export async function fetchSocialVideoCredits(userId: string): Promise<SocialVideoCredits | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("plan, loops_used_this_month, referral_bonus, level_bonus, daily_bonus_month, purchased_bonus")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;

  const plan = typeof data.plan === "string" ? data.plan : "free";
  const used = typeof data.loops_used_this_month === "number" ? data.loops_used_this_month : 0;
  const referralBonus = typeof data.referral_bonus === "number" ? data.referral_bonus : 0;
  const levelBonus = typeof data.level_bonus === "number" ? data.level_bonus : 0;
  const dailyBonusMonth = typeof data.daily_bonus_month === "number" ? data.daily_bonus_month : 0;
  const purchasedBonus = typeof data.purchased_bonus === "number" ? data.purchased_bonus : 0;

  const limit = getTotalGenerationLimit(plan, { referralBonus, levelBonus, dailyBonusMonth, purchasedBonus });

  return { remaining: Math.max(0, limit - used), used, limit, plan };
}

export function newSocialVideoIdempotencyKey(loopId: string): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${loopId}:${suffix}`;
}

export function defaultSocialVideoPrompt(loop: Loop): string {
  return resolveCoverArtPrompt(loop);
}

async function extractSocialVideoInvokeError(error: unknown): Promise<string> {
  const anyError = error as { message?: string; context?: unknown };
  const errContext = anyError.context;

  const fromParsed = (parsed: unknown): string | null => {
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as { error?: unknown };
    return typeof obj.error === "string" ? obj.error : null;
  };

  if (errContext && typeof errContext === "object" && typeof (errContext as Response).text === "function") {
    try {
      const text = await (errContext as Response).text();
      try {
        const parsed = JSON.parse(text) as unknown;
        const code = fromParsed(parsed);
        if (code) return code;
      } catch {
        if (text.trim()) return text.trim();
      }
    } catch {
      // ignore
    }
  }

  return anyError.message ?? "generate_social_video_failed";
}

export async function generateSocialAiVideo(
  loop: Loop,
  layout: VisualizerLayout = "story",
  options?: { idempotencyKey?: string; videoPrompt?: string },
): Promise<SocialVideoGenerateResult> {
  const videoPrompt = (options?.videoPrompt ?? resolveCoverArtPrompt(loop)).trim();
  if (videoPrompt.length < 3) throw new Error("prompt_too_short");

  const coverPrompt = resolveCoverArtPrompt(loop);
  const seed = coverImageSeed(loop);
  const key = options?.idempotencyKey?.trim() || newSocialVideoIdempotencyKey(loop.id);

  const { data, error } = await supabase.functions.invoke("generate-social-video", {
    body: { loopId: loop.id, coverPrompt, videoPrompt, seed, layout, idempotencyKey: key },
  });

  if (error) {
    const code = await extractSocialVideoInvokeError(error);
    throw new Error(code);
  }
  if (data?.error === "no_credits") throw new Error("no_credits");
  if (typeof data?.videoUrl !== "string" || !data.videoUrl.startsWith("http")) {
    throw new Error(typeof data?.error === "string" ? data.error : "video_generation_failed");
  }

  return {
    videoUrl: data.videoUrl,
    durationSec: typeof data.durationSec === "number" ? data.durationSec : SOCIAL_VIDEO_POLLINATIONS_SEC,
    layout: data.layout === "square" ? "square" : "story",
    used: typeof data.used === "number" ? data.used : undefined,
    limit: typeof data.limit === "number" ? data.limit : undefined,
  };
}

function pseudo(seed: number, x: number, y: number, t: number): number {
  return Math.abs(Math.sin(seed * 0.001 + x * 12.9898 + y * 78.233 + t * 4.141)) % 1;
}

function drawVhsGrain(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, t: number) {
  const step = Math.max(3, Math.floor(w / 160));
  ctx.save();
  ctx.globalAlpha = 0.11;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const n = pseudo(seed, x, y, t);
      if (n > 0.8) {
        ctx.fillStyle = n > 0.93 ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
        ctx.fillRect(x, y, step, step);
      }
    }
  }
  ctx.restore();

  if (Math.sin(t * 0.55 + seed * 0.001) > 0.992) {
    const sy = h * (0.12 + pseudo(seed, 11, 1, t) * 0.7);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(w, sy + Math.sin(t * 1.2) * 4);
    ctx.stroke();
    ctx.restore();
  }
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "video/webm";
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) return "video/webm;codecs=vp9,opus";
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) return "video/webm;codecs=vp8,opus";
  return "video/webm";
}

/** Mux AI loop video + track audio + VHS overlay for social export. */
export async function exportSocialVideoWithAudio(
  loop: Loop,
  videoUrl: string,
  layout: VisualizerLayout,
  options?: { durationSec?: number; showWatermark?: boolean; watermarkText?: string },
): Promise<Blob> {
  if (!loop.audioUrl) throw new Error("missing_audio");
  if (typeof MediaRecorder === "undefined") throw new Error("unsupported");

  const exportSec = Math.min(
    SOCIAL_VIDEO_EXPORT_MAX_SEC,
    resolveExportDuration(loop, options?.durationSec ?? SOCIAL_VIDEO_EXPORT_MAX_SEC),
  );
  const { width: w, height: h } = canvasSizeForLayout(layout);
  const seed = hashString(`${loop.id}:social:${layout}`);
  const showWatermark = options?.showWatermark !== false;
  const watermarkText = options?.watermarkText ?? "made with ProducerHit";

  const [audioUrl] = await Promise.all([resolvePlayableAudioUrl(loop.audioUrl, loop.id)]);

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.src = videoUrl;

  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error("video_load_failed"));
  });

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
  const rec = new MediaRecorder(out, { mimeType: mime, videoBitsPerSecond: 5_500_000 });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => {
    if (e.data?.size) chunks.push(e.data);
  };
  const stopPromise = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
  });

  const startTs = performance.now();
  let lastTs = startTs;

  const drawFrame = (t: number) => {
    const vw = video.videoWidth || w;
    const vh = video.videoHeight || h;
    const scale = Math.max(w / vw, h / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;

    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(video, dx, dy, dw, dh);

    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = "rgba(120, 80, 255, 0.06)";
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    drawVhsGrain(ctx, w, h, seed, t);

    if (showWatermark) {
      ctx.save();
      ctx.font = `600 ${Math.max(10, Math.floor(w * 0.028))}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.textAlign = "center";
      ctx.fillText(watermarkText, w / 2, h - Math.max(14, h * 0.04));
      ctx.restore();
    }
  };

  const tick = () => {
    const now = performance.now();
    const t = (now - startTs) / 1000;
    lastTs = now;
    if (video.readyState >= 2) drawFrame(t);
    if (t < exportSec) requestAnimationFrame(tick);
  };

  rec.start(100);
  await video.play().catch(() => undefined);
  await audioCtx.resume().catch(() => undefined);
  await audio.play().catch(() => undefined);
  tick();

  await new Promise<void>((resolve) => window.setTimeout(resolve, exportSec * 1000));

  rec.stop();
  video.pause();
  audio.pause();
  canvasStream.getTracks().forEach((tr) => tr.stop());
  dest.stream.getTracks().forEach((tr) => tr.stop());
  await audioCtx.close().catch(() => undefined);

  return stopPromise;
}

export function downloadSocialVideoBlob(loop: Loop, blob: Blob, layout: VisualizerLayout): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cleanName = (loop.name || "producerhit")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 64);
  const suffix = layout === "square" ? "ai-square" : "ai-tiktok";
  a.download = `${cleanName || "producerhit"}-${suffix}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
