import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { cn, coverGradient, coverImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AudioWaveform } from "@/components/WaveformVisualizer";
import { useLoopsStore } from "@/stores/loopsStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useLocaleStore } from "@/stores/localeStore";
import type { Loop } from "@/types/loop";
import { generateBeat } from "@/lib/audioApi";
import { Bookmark, Check, Copy, Download, Globe, Info, Layers, Loader2, Pause, Pencil, Play, RefreshCcw, Share2, Video, X } from "lucide-react";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function barsFromLoopLength(loopLength: string) {
  const n = Number(loopLength.split(" ")[0]);
  return Number.isFinite(n) && n > 0 ? n : 4;
}

export function LoopCardItem({
  loop,
  onDelete,
  onOpenDetails,
  onGenerationUsed,
  onStartWorkspaceJob,
}: {
  loop: Loop;
  onDelete?: () => void;
  onOpenDetails?: (loop: Loop, anchorTop: number) => void;
  onGenerationUsed?: () => void;
  onStartWorkspaceJob?: (title: string, sub: string) => (() => void) | void;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const plan = (() => {
    try {
      const raw = window.localStorage.getItem("producerhit_plan");
      return raw === "pro" || raw === "studio" || raw === "free" ? raw : "free";
    } catch {
      return "free";
    }
  })();
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const currentTimeSec = usePlayerStore((s) => s.currentTimeSec);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const requestSeek = usePlayerStore((s) => s.requestSeek);
  const setPlaying = usePlayerStore((s) => s.setPlaying);

  const toggleSavedRemote = useLoopsStore((s) => s.toggleSavedRemote);
  const togglePublicRemote = useLoopsStore((s) => s.togglePublicRemote);
  const renameLoopRemote = useLoopsStore((s) => s.renameLoopRemote);
  const createLoop = useLoopsStore((s) => s.createLoop);
  const upsertLoop = useLoopsStore((s) => s.upsertLoop);
  const enqueuePendingSave = useLoopsStore((s) => s.enqueuePendingSave);
  const ensureAudioReady = useLoopsStore((s) => s.ensureAudioReady);
  const cachedDurationSec = useLoopsStore((s) => s.durationsSecById[loop.id] ?? 0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingStems, setIsDownloadingStems] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(loop.name);
  const [savingTitle, setSavingTitle] = useState(false);
  const [isVarying, setIsVarying] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const active = current?.id === loop.id;
  const activePlaying = active && isPlaying;
  const canPlay = Boolean(loop.audioUrl);
  const totalLabel = cachedDurationSec > 0 ? formatTime(cachedDurationSec) : "—";
  const durationLabel = active ? formatTime(currentTimeSec) : totalLabel;
  const stemsDownloadUrl = (() => {
    const raw = loop.stemsUrl as unknown;
    if (!raw) return "";
    if (typeof raw === "string") {
      const s = raw.trim();
      return s.startsWith("http://") || s.startsWith("https://") ? s : "";
    }
    if (typeof raw !== "object") return "";
    const obj = raw as Record<string, unknown>;
    const ace = obj.ace && typeof obj.ace === "object" ? (obj.ace as Record<string, unknown>) : null;
    const candidates: unknown[] = [
      obj.stemsZipUrl,
      obj.stems_zip_url,
      obj.zipUrl,
      obj.zip_url,
      obj.archiveUrl,
      obj.archive_url,
      obj.stemsUrl,
      obj.stems_url,
      ace?.stemsZipUrl,
      ace?.stems_zip_url,
      ace?.zipUrl,
      ace?.zip_url,
      ace?.archiveUrl,
      ace?.archive_url,
      ace?.stemsUrl,
      ace?.stems_url,
    ];
    for (const c of candidates) {
      if (typeof c !== "string") continue;
      const s = c.trim();
      if (!s) continue;
      if (s.startsWith("http://") || s.startsWith("https://")) return s;
    }
    return "";
  })();

  useEffect(() => {
    if (isEditingTitle) return;
    setDraftTitle(loop.name);
  }, [isEditingTitle, loop.name]);

  const commitTitle = useCallback(() => {
    const next = draftTitle.trim().replace(/\s+/g, " ").slice(0, 72);
    if (!next || next === loop.name) {
      setDraftTitle(loop.name);
      setIsEditingTitle(false);
      return;
    }
    void (async () => {
      setSavingTitle(true);
      try {
        await renameLoopRemote(loop.id, next);
        toast.success(locale === "fr" ? "Titre mis à jour" : "Title updated");
        setIsEditingTitle(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : locale === "fr" ? "Erreur" : "Error";
        toast.error(msg);
      } finally {
        setSavingTitle(false);
      }
    })();
  }, [draftTitle, locale, loop.id, loop.name, renameLoopRemote]);

  const runVariant = (kind: "variation" | "remix") => {
    void (async () => {
      if (isVarying) return;
      setIsVarying(true);
      const stopJob = onStartWorkspaceJob?.(
        `${loop.name} — ${kind === "remix" ? "Remix" : "Variation"}`,
        locale === "fr" ? "Création en cours…" : "Generating...",
      );
      let audioUrl: string | null = null;
      try {
        const isSongLike =
          (typeof loop.details?.lyrics === "string" && loop.details.lyrics.trim().length > 0) || /\bsong\b/i.test(loop.name);
        const barsCount = barsFromLoopLength(loop.loopLength);
        const now = Date.now();
        const baseSeed = typeof loop.seed === "number" && Number.isFinite(loop.seed) ? loop.seed : 0;
        const nextSeed = baseSeed + Math.floor(Math.random() * 100) + 1;
        const generationKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `var-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const tag = kind === "remix" ? "remix" : "variation";
        const direction =
          kind === "remix"
            ? isSongLike
              ? "same song idea and vibe, new drums and arrangement, keep the hook feeling"
              : "remix: new drums and sound selection, keep the same genre and bounce"
            : isSongLike
              ? "same song idea and vibe, new arrangement and instrumentation"
              : "fresh melody and drum details while keeping the same style and groove";

        const variantPrompt = isSongLike
          ? [loop.prompt?.trim() || "", tag, `seed:${now}`, direction, "keep the exact same lyrics provided (do not rewrite lyrics)"]
              .filter(Boolean)
              .join(", ")
          : [loop.prompt?.trim() || "", tag, `seed:${now}`, direction].filter(Boolean).join(", ");

        const engine = loop.engine?.startsWith("sonauto") ? ("sonauto" as const) : ("ace-step" as const);
        const hasManualMeta = Boolean(loop.bpm > 0 && loop.key && loop.scale);
        const autoMeta = !hasManualMeta;
        const result = await generateBeat(
          {
            genre: loop.genre,
            influence: loop.influence,
            key: loop.key,
            scale: loop.scale,
            bpm: loop.bpm,
            loopLengthBars: barsCount,
            swing: loop.swing,
            mood: loop.mood,
            energyLevel: loop.energyLevel,
            reverb: loop.reverb,
            prompt: variantPrompt,
          },
          engine,
          isSongLike
            ? {
                instrumental: false,
                lyrics: loop.details?.lyrics || "",
                vocalLanguage: "en",
                isSong: true,
                autoMeta,
                duration: typeof loop.details?.duration === "number" ? loop.details.duration : undefined,
                timeSignature: loop.details?.timeSignature || undefined,
                audioFormat: loop.details?.audioFormat || "mp3",
                seed: nextSeed,
                generationKey,
              }
            : {
                instrumental: true,
                lyrics: "",
                vocalLanguage: "en",
                isSong: false,
                autoMeta,
                audioFormat: loop.details?.audioFormat || "mp3",
                seed: nextSeed,
                generationKey,
              },
        );

        audioUrl = result.audioUrl;
        const draft: Omit<Loop, "id" | "createdAt" | "userId"> = {
          engine: result.engine,
          name: `${loop.genre} ${kind === "remix" ? "Remix" : "Variation"} — ${loop.key || "Auto"} ${
            loop.scale || ""
          }`.trim(),
          genre: loop.genre,
          influence: loop.influence,
          key: loop.key,
          scale: loop.scale,
          bpm: loop.bpm,
          loopLength: loop.loopLength,
          swing: loop.swing,
          mood: loop.mood,
          energyLevel: loop.energyLevel,
          reverb: loop.reverb,
          prompt: variantPrompt,
          audioUrl: audioUrl ?? null,
          seed: typeof result.meta?.seed === "number" && Number.isFinite(result.meta.seed) ? result.meta.seed : nextSeed,
          details: result.meta
            ? {
                caption: result.meta.prompt ?? variantPrompt,
                lyrics: result.meta.lyrics ?? "",
                bpm: result.meta.bpm ?? null,
                duration: result.meta.duration ?? null,
                keyScale: result.meta.keyScale ?? "",
                timeSignature: result.meta.timeSignature ?? "",
                audioFormat: result.meta.audioFormat ?? loop.details?.audioFormat ?? "mp3",
              }
            : loop.details
              ? { ...loop.details }
              : null,
          stemsUrl: result.meta?.taskId
            ? ({
                ace: {
                  taskId: result.meta.taskId,
                  ...(typeof result.meta.stemsZipUrl === "string" && result.meta.stemsZipUrl.trim().length > 0 ? { stemsZipUrl: result.meta.stemsZipUrl.trim() } : {}),
                },
              } as Record<string, unknown>)
            : null,
          isSaved: false,
          isPublic: true,
        };

        try {
          const created = await createLoop(draft);
          setCurrent(created, true);
          toast.success(kind === "remix" ? (locale === "fr" ? "Remix généré !" : "Remix generated!") : locale === "fr" ? "Variation générée !" : "Variation generated!");
          onGenerationUsed?.();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Saving failed";
          if (audioUrl) {
            const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? `local-${crypto.randomUUID()}` : `local-${Date.now()}`;
            const createdAt = new Date().toISOString();
            const temp: Loop = {
              id,
              engine: result.engine,
              name: draft.name,
              genre: draft.genre,
              influence: draft.influence,
              key: draft.key,
              scale: draft.scale,
              bpm: draft.bpm,
              loopLength: draft.loopLength,
              swing: draft.swing,
              mood: draft.mood,
              energyLevel: draft.energyLevel,
              reverb: draft.reverb,
              prompt: draft.prompt,
              audioUrl,
              seed: draft.seed ?? null,
              details: draft.details ?? null,
              stemsUrl: null,
              isSaved: false,
              isPublic: true,
              createdAt,
            };
            upsertLoop(temp);
            enqueuePendingSave(draft, id, createdAt);
            setCurrent(temp, true);
            toast.error(locale === "fr" ? `Généré, mais l’enregistrement a échoué : ${message}` : `Generated, but saving failed: ${message}`);
            onGenerationUsed?.();
          } else {
            throw err;
          }
        }
      } catch (err) {
        const anyErr = err as unknown as { limitReached?: boolean };
        if (anyErr?.limitReached) {
          toast.error(locale === "fr" ? "Limite mensuelle atteinte — upgrade ton plan" : "Monthly limit reached — upgrade your plan");
        } else {
          const rawMessage = err instanceof Error ? err.message : "";
          const lower = rawMessage.toLowerCase();
          const isTemporaryNetwork =
            lower.includes("failed to fetch") ||
            lower.includes("networkerror") ||
            lower.includes("load resource") ||
            lower.includes("net::err_failed") ||
            lower.includes("cors") ||
            lower.includes("timeout") ||
            lower.includes("timed out") ||
            lower.includes("502") ||
            lower.includes("503") ||
            lower.includes("504");

          if (isTemporaryNetwork) {
            toast.error("Réseau chargé — réessaie dans quelques secondes. Upgrade pour avoir la priorité.");
          } else {
            const message = rawMessage || (kind === "remix" ? "Remix failed — try again" : "Variation failed — try again");
            toast.error(message);
          }
        }
      } finally {
        if (typeof stopJob === "function") stopJob();
        setIsVarying(false);
      }
    })();
  };

  const computeAnchorTop = useCallback(() => {
    const rect = cardRef.current?.getBoundingClientRect();
    const rawTop = rect ? rect.top : 80;
    const maxTop = Math.max(12, window.innerHeight - 220);
    return Math.max(12, Math.min(maxTop, Math.floor(rawTop)));
  }, []);

  const shareUrl = `https://www.producerhit.com/loop/${loop.id}`;
  const shareText =
    locale === "fr"
      ? `Écoute mon dernier track "${loop.name}" (${loop.genre}) sur ProducerHit : ${shareUrl}`
      : `Listen to my latest track "${loop.name}" (${loop.genre}) on ProducerHit: ${shareUrl}`;

  const openShareLink = useCallback((url: string) => {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.location.href = url;
    }
  }, []);

  const nativeShare = useCallback(async () => {
    const anyNav = navigator as unknown as { share?: (data: { title?: string; text?: string; url?: string }) => Promise<void> };
    if (typeof anyNav.share !== "function") {
      toast.error(locale === "fr" ? "Partage direct non supporté — copie le lien" : "Direct share not supported — copy the link");
      return;
    }
    try {
      await anyNav.share({ title: loop.name, text: shareText, url: shareUrl });
    } catch {
      void 0;
    }
  }, [locale, loop.name, shareText, shareUrl]);

  const copyText = useCallback(async (text: string, okMsg: string, errMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(okMsg);
    } catch {
      toast.error(errMsg);
    }
  }, []);

  const downloadShareVideo = useCallback(async () => {
    if (!loop.audioUrl) {
      toast.error(locale === "fr" ? "Audio indisponible — régénère une variation" : "Audio unavailable — generate a variation");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      toast.error(locale === "fr" ? "Vidéo non supportée sur ce navigateur" : "Video not supported in this browser");
      return;
    }
    setShareBusy(true);
    try {
      const w = 1080;
      const h = 1920;
      const fps = 30;
      const durationSec = 12;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");

      const coverUrl = coverImageUrl(loop);
      const coverBitmap = await (async () => {
        try {
          const res = await fetch(coverUrl);
          if (!res.ok) return null;
          const blob = await res.blob();
          return await createImageBitmap(blob);
        } catch {
          return null;
        }
      })();

      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.preload = "auto";
      audio.src = loop.audioUrl;
      audio.currentTime = 0;

      const audioStream =
        (audio as unknown as { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).captureStream?.() ??
        (audio as unknown as { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream }).mozCaptureStream?.() ??
        null;

      const canvasStream = canvas.captureStream(fps);
      const out = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...(audioStream ? audioStream.getAudioTracks() : []),
      ]);

      const mime =
        MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
            ? "video/webm;codecs=vp8,opus"
            : "video/webm";

      const rec = new MediaRecorder(out, { mimeType: mime, videoBitsPerSecond: 5_500_000 });
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      const stopPromise = new Promise<Blob>((resolve) => {
        rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
      });

      const startTs = performance.now();
      const pad = 72;
      const coverSize = 980;
      const coverX = Math.floor((w - coverSize) / 2);
      const coverY = 220;
      const radius = 46;

      const drawRoundedRect = (x: number, y: number, rw: number, rh: number, r: number) => {
        const rr = Math.max(0, Math.min(r, Math.floor(Math.min(rw, rh) / 2)));
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + rw, y, x + rw, y + rh, rr);
        ctx.arcTo(x + rw, y + rh, x, y + rh, rr);
        ctx.arcTo(x, y + rh, x, y, rr);
        ctx.arcTo(x, y, x + rw, y, rr);
        ctx.closePath();
      };

      const tick = () => {
        const t = (performance.now() - startTs) / 1000;

        const bg = ctx.createLinearGradient(0, 0, w, h);
        bg.addColorStop(0, "rgba(10,10,18,1)");
        bg.addColorStop(0.5, "rgba(18,12,28,1)");
        bg.addColorStop(1, "rgba(7,16,24,1)");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        const glow1 = ctx.createRadialGradient(w * 0.25, h * 0.22, 0, w * 0.25, h * 0.22, 520);
        glow1.addColorStop(0, "rgba(124,58,237,0.35)");
        glow1.addColorStop(1, "rgba(124,58,237,0)");
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, w, h);

        const glow2 = ctx.createRadialGradient(w * 0.78, h * 0.74, 0, w * 0.78, h * 0.74, 620);
        glow2.addColorStop(0, "rgba(6,182,212,0.25)");
        glow2.addColorStop(1, "rgba(6,182,212,0)");
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        drawRoundedRect(coverX, coverY, coverSize, coverSize, radius);
        ctx.clip();
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(coverX, coverY, coverSize, coverSize);
        if (coverBitmap) {
          const sw = coverBitmap.width;
          const sh = coverBitmap.height;
          const scale = Math.max(coverSize / sw, coverSize / sh);
          const dw = sw * scale;
          const dh = sh * scale;
          const dx = coverX + (coverSize - dw) / 2;
          const dy = coverY + (coverSize - dh) / 2;
          ctx.drawImage(coverBitmap, dx, dy, dw, dh);
        }
        const sheenX = (t * 380) % (coverSize + 520) - 520;
        const sheen = ctx.createLinearGradient(coverX + sheenX, coverY, coverX + sheenX + 520, coverY + coverSize);
        sheen.addColorStop(0, "rgba(255,255,255,0)");
        sheen.addColorStop(0.5, "rgba(255,255,255,0.08)");
        sheen.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = sheen;
        ctx.fillRect(coverX, coverY, coverSize, coverSize);
        ctx.restore();

        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.font = "700 56px Inter, system-ui, -apple-system, Segoe UI, Arial";
        const title = (loop.name || "ProducerHit").slice(0, 40);
        ctx.fillText(title, pad, 140);
        ctx.fillStyle = "rgba(255,255,255,0.64)";
        ctx.font = "500 34px Inter, system-ui, -apple-system, Segoe UI, Arial";
        ctx.fillText(`${loop.genre} • ${loop.bpm ? `${loop.bpm} BPM` : "Auto BPM"}`, pad, 188);

        const barCount = 64;
        const areaW = w - pad * 2;
        const baseY = 1580;
        const maxH = 180;
        const barW = Math.max(3, Math.floor(areaW / (barCount * 1.8)));
        const gap = Math.max(3, Math.floor(barW * 0.8));
        const totalW = barCount * barW + (barCount - 1) * gap;
        const startX = pad + Math.floor((areaW - totalW) / 2);
        for (let i = 0; i < barCount; i++) {
          const v =
            0.12 +
            0.88 *
              (0.5 + 0.5 * Math.sin(t * 3.2 + i * 0.28)) *
              (0.65 + 0.35 * Math.sin(t * 1.1 + i * 0.17));
          const hh = Math.max(6, Math.floor(v * maxH));
          const x = startX + i * (barW + gap);
          const y = baseY - hh;
          const tt = i / (barCount - 1);
          const r = Math.round(124 + (167 - 124) * tt);
          const g = Math.round(58 + (139 - 58) * tt);
          const b = Math.round(237 + (250 - 237) * tt);
          ctx.fillStyle = `rgba(${r},${g},${b},0.92)`;
          ctx.fillRect(x, y, barW, hh);
        }

        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.font = "600 28px Inter, system-ui, -apple-system, Segoe UI, Arial";
        ctx.fillText("producerhit.com", pad, 1828);

        if (t < durationSec) {
          requestAnimationFrame(tick);
        }
      };

      rec.start(100);
      await audio.play().catch(() => undefined);
      tick();

      await new Promise<void>((resolve) => {
        const stopAt = window.setTimeout(() => {
          window.clearTimeout(stopAt);
          resolve();
        }, durationSec * 1000);
      });

      rec.stop();
      audio.pause();
      canvasStream.getTracks().forEach((tr) => tr.stop());
      audioStream?.getTracks().forEach((tr) => tr.stop());

      const blob = await stopPromise;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanName = (loop.name || "producerhit")
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .slice(0, 64);
      a.download = `${cleanName || "producerhit"}-share.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(locale === "fr" ? "Vidéo prête à partager" : "Video ready to share");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      toast.error(locale === "fr" ? `Impossible de créer la vidéo${msg ? `: ${msg}` : ""}` : `Failed to create video${msg ? `: ${msg}` : ""}`);
    } finally {
      setShareBusy(false);
    }
  }, [locale, loop]);

  return (
    <div
      data-loop-card
      ref={cardRef}
      className={cn("rounded-pk border border-pk-border bg-pk-panel p-4", active ? "shadow-glow" : "")}
      onClick={() => {
        if (!onOpenDetails) return;
        onOpenDetails(loop, computeAnchorTop());
      }}
      role={onOpenDetails ? "button" : undefined}
      tabIndex={onOpenDetails ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onOpenDetails) return;
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onOpenDetails(loop, computeAnchorTop());
      }}
    >
      <div className="flex gap-3">
        <div
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-pk border border-pk-border bg-center bg-cover"
          style={{ backgroundImage: coverGradient(loop) }}
        >
          <img
            key={coverImageUrl(loop)}
            src={coverImageUrl(loop)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            style={{ display: "block", opacity: 0 }}
            onLoad={(e) => {
              e.currentTarget.style.display = "block";
              e.currentTarget.style.opacity = "1";
              e.currentTarget.dataset.retry = "0";
            }}
            onError={(e) => {
              const img = e.currentTarget;
              img.style.opacity = "0";
              const retry = Number(img.dataset.retry ?? "0");
              if (retry < 4) {
                img.dataset.retry = String(retry + 1);
                const url = coverImageUrl(loop);
                window.setTimeout(() => {
                  img.style.display = "block";
                  img.style.opacity = "0";
                  img.src = "";
                  img.src = url;
                }, 800 * (retry + 1));
                return;
              }
              img.style.display = "none";
            }}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex flex-1 items-center gap-2">
              {isEditingTitle ? (
                <>
                  <input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    autoFocus
                    className="w-full min-w-0 rounded-pk border border-pk-border bg-pk-input px-2 py-1 text-sm font-semibold text-pk-text outline-none placeholder:text-pk-muted focus:border-pk-accent"
                    placeholder={locale === "fr" ? "Titre…" : "Title…"}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!savingTitle) commitTitle();
                        return;
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        e.stopPropagation();
                        setDraftTitle(loop.name);
                        setIsEditingTitle(false);
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="px-2 py-1"
                    disabled={savingTitle}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!savingTitle) commitTitle();
                    }}
                    aria-label={locale === "fr" ? "Valider" : "Save"}
                    title={locale === "fr" ? "Valider" : "Save"}
                  >
                    {savingTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1"
                    disabled={savingTitle}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDraftTitle(loop.name);
                      setIsEditingTitle(false);
                    }}
                    aria-label={locale === "fr" ? "Annuler" : "Cancel"}
                    title={locale === "fr" ? "Annuler" : "Cancel"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="truncate text-sm font-semibold">{loop.name}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                    }}
                    aria-label={locale === "fr" ? "Modifier le titre" : "Edit title"}
                    title={locale === "fr" ? "Modifier le titre" : "Edit title"}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            {onOpenDetails ? (
              <Button
                variant="secondary"
                size="sm"
                className="px-2 py-1 text-[11px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(loop, computeAnchorTop());
                }}
                aria-label="Infos"
                title="Infos"
              >
                <Info className="h-4 w-4" />
                Infos
              </Button>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>{loop.genre}</Badge>
            <Badge variant="muted">{loop.mood}</Badge>
            {loop.bpm && loop.bpm > 0 ? (
              <Badge variant="muted">{loop.bpm} BPM</Badge>
            ) : (
              <Badge variant="muted">Auto BPM</Badge>
            )}
          </div>
          <div className="mt-2 text-xs text-pk-muted">
            {loop.key || loop.scale ? `${loop.key} ${loop.scale}` : "Auto Key"}
          </div>
        </div>
      </div>

      <div className={cn("mt-3", canPlay ? "" : "opacity-60")}>
        <AudioWaveform
          audioUrl={loop.audioUrl ?? null}
          isPlaying={activePlaying}
          progress={active ? progress : 0}
          height={28}
          onSeek={
            canPlay
              ? (pct) => {
                  if (!active) setCurrent(loop, true);
                  requestSeek(pct);
                }
              : undefined
          }
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-pk-muted">
        <div>{loop.loopLength}</div>
        <div>{durationLabel}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            void (async () => {
              if (active) {
                setPlaying(!isPlaying);
                return;
              }

              const directUrl = typeof loop.audioUrl === "string" ? loop.audioUrl.trim() : "";
              if (directUrl) {
                setCurrent({ ...loop, audioUrl: directUrl }, true);
                return;
              }

              let url = "";
              try {
                url = await ensureAudioReady(loop.id);
              } catch {
                url = "";
              }
              if (!url) {
                toast.error(locale === "fr" ? "Audio indisponible — réessaie dans un instant" : "Audio unavailable — try again in a moment");
                return;
              }

              const fresh = useLoopsStore.getState().loops.find((l) => l.id === loop.id) ?? loop;
              setCurrent({ ...fresh, audioUrl: url }, true);
            })();
          }}
          aria-label={activePlaying ? "Pause" : "Play"}
          title={
            activePlaying
              ? "Pause"
              : canPlay
                ? "Play"
                : locale === "fr"
                  ? "Préparation audio…"
                  : "Preparing audio…"
          }
        >
          {activePlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {activePlaying ? "Pause" : "Play"}
        </Button>
        <Button
          variant={loop.isSaved ? "primary" : "secondary"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            void (async () => {
              try {
                const next = await toggleSavedRemote(loop.id);
                toast.success(next ? "Sauvegardé" : "Retiré de la bibliothèque");
              } catch (err) {
                const message = err instanceof Error ? err.message : "Erreur inconnue";
                toast.error(message);
              }
            })();
          }}
          title={loop.isSaved ? "Unsave" : "Save"}
        >
          <Bookmark className="h-4 w-4" />
          Save
        </Button>
        <Button
          variant={loop.isPublic ? "primary" : "secondary"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            void (async () => {
              try {
                const next = await togglePublicRemote(loop.id);
                toast.success(next ? "Public" : "Private");
              } catch (err) {
                const message = err instanceof Error ? err.message : "Erreur inconnue";
                toast.error(message);
              }
            })();
          }}
          title={loop.isPublic ? "Make private" : "Make public"}
        >
          <Globe className="h-4 w-4" />
          {loop.isPublic ? (locale === "fr" ? "Privé" : "Private") : locale === "fr" ? "Public" : "Public"}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            void (async () => {
              if (!loop.audioUrl || isDownloading) return;
              setIsDownloading(true);
              try {
                const response = await fetch(loop.audioUrl);
                const blob = await response.blob();
                const formatHint = (loop.details?.audioFormat || "").toLowerCase();
                const type = (blob.type || "").toLowerCase();
                const ext =
                  formatHint === "wav" || formatHint === "wav32"
                    ? "wav"
                    : formatHint === "flac"
                      ? "flac"
                      : formatHint === "opus"
                        ? "opus"
                        : formatHint === "aac"
                          ? "aac"
                          : type.includes("wav")
                            ? "wav"
                            : type.includes("flac")
                              ? "flac"
                              : type.includes("opus")
                                ? "opus"
                                : type.includes("aac")
                                  ? "aac"
                                  : "mp3";
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const cleanName = loop.name
                  .replace(/[^a-zA-Z0-9\s-]/g, "")
                  .replace(/\s+/g, "-")
                  .toLowerCase();
                a.download = `${cleanName}-producerhit.${ext}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success("Beat downloaded!");
              } catch {
                toast.error("Download failed — try again");
              } finally {
                setIsDownloading(false);
              }
            })();
          }}
          disabled={isDownloading || !loop.audioUrl}
          title={
            !loop.audioUrl
              ? locale === "fr"
                ? "Audio indisponible"
                : "Audio unavailable"
              : "Download"
          }
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download
        </Button>
        {stemsDownloadUrl ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (plan === "free") {
                toast(locale === "fr" ? "Export stems: Pro/Studio" : "Stem export: Pro/Studio");
                window.location.href = "/pricing";
                return;
              }
              if (isDownloadingStems) return;
              setIsDownloadingStems(true);
              try {
                const a = document.createElement("a");
                a.href = stemsDownloadUrl;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.click();
              } finally {
                setIsDownloadingStems(false);
              }
            }}
            disabled={isDownloadingStems}
            title={locale === "fr" ? "Télécharger les stems" : "Download stems"}
          >
            {isDownloadingStems ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
            {locale === "fr" ? "Stems" : "Stems"}
          </Button>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShareOpen(true);
          }}
          aria-label={locale === "fr" ? "Partager" : "Share"}
          title={locale === "fr" ? "Partager" : "Share"}
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isVarying}
          onClick={(e) => {
            e.stopPropagation();
            runVariant("variation");
          }}
          title="Regenerate"
        >
          {isVarying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          {isVarying ? (locale === "fr" ? "Génération…" : "Generating...") : "Variation"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isVarying}
          onClick={(e) => {
            e.stopPropagation();
            runVariant("remix");
          }}
          title="Remix"
        >
          {isVarying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          {isVarying ? (locale === "fr" ? "Génération…" : "Generating...") : "Remix"}
        </Button>
        {onDelete ? (
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
          >
            Delete
          </Button>
        ) : null}
      </div>

      {shareOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/60"
            aria-label={locale === "fr" ? "Fermer" : "Close"}
            onClick={() => setShareOpen(false)}
          />
          <div className="absolute left-1/2 top-1/2 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-pk-border bg-pk-panel/90 shadow-[0_0_80px_rgba(0,0,0,0.55)] backdrop-blur">
            <div className="flex items-center justify-between gap-3 border-b border-pk-border p-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{locale === "fr" ? "Partager" : "Share"}</div>
                <div className="mt-1 text-xs text-pk-muted">
                  {locale === "fr"
                    ? "Télécharge une vidéo verticale prête pour TikTok / Instagram."
                    : "Download a vertical video ready for TikTok / Instagram."}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setShareOpen(false)} aria-label={locale === "fr" ? "Fermer" : "Close"}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <div className="grid gap-2">
                {!loop.isPublic ? (
                  <div className="rounded-2xl border border-pk-border bg-white/5 p-3 text-xs text-pk-muted">
                    <div className="font-semibold text-pk-text">{locale === "fr" ? "Pour partager un lien public" : "To share a public link"}</div>
                    <div className="mt-1">
                      {locale === "fr"
                        ? "Passe la track en Public pour que le lien fonctionne sur TikTok/Instagram/etc."
                        : "Make the track Public so the link works on TikTok/Instagram/etc."}
                    </div>
                    <div className="mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!loop.audioUrl}
                        onClick={(e) => {
                          e.stopPropagation();
                          void (async () => {
                            try {
                              if (!loop.audioUrl) {
                                toast.error(
                                  locale === "fr"
                                    ? "Audio indisponible — régénère une variation"
                                    : "Audio unavailable — generate a variation",
                                );
                                return;
                              }
                              await togglePublicRemote(loop.id);
                              toast.success(locale === "fr" ? "Public activé" : "Public enabled");
                            } catch {
                              toast.error(locale === "fr" ? "Impossible" : "Failed");
                            }
                          })();
                        }}
                      >
                        <Globe className="h-4 w-4" />
                        {locale === "fr" ? "Passer en Public" : "Make Public"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-pk-border bg-white/5 p-3">
                  <div className="text-xs font-semibold text-pk-text">{locale === "fr" ? "Partager le lien" : "Share link"}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void nativeShare()}
                      title={locale === "fr" ? "Ouvre le partage du téléphone (TikTok/Instagram…)" : "Opens device share (TikTok/Instagram…)"}
                    >
                      <Share2 className="h-4 w-4" />
                      {locale === "fr" ? "TikTok / IG" : "TikTok / IG"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        void copyText(
                          shareUrl,
                          locale === "fr" ? "Lien copié" : "Link copied",
                          locale === "fr" ? "Copie impossible" : "Copy failed",
                        )
                      }
                    >
                      <Copy className="h-4 w-4" />
                      {locale === "fr" ? "Copier le lien" : "Copy link"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openShareLink(`https://wa.me/?text=${encodeURIComponent(shareText)}`)}
                    >
                      WA
                      <span className="ml-1">{locale === "fr" ? "WhatsApp" : "WhatsApp"}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openShareLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`)}
                    >
                      TG
                      <span className="ml-1">{locale === "fr" ? "Telegram" : "Telegram"}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        openShareLink(
                          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
                        )
                      }
                    >
                      X
                      <span className="ml-1">Twitter</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openShareLink(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
                    >
                      FB
                      <span className="ml-1">Facebook</span>
                    </Button>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={shareBusy || !loop.audioUrl}
                  onClick={() => void downloadShareVideo()}
                  title={!loop.audioUrl ? (locale === "fr" ? "Audio indisponible" : "Audio unavailable") : undefined}
                >
                  {shareBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  {locale === "fr" ? "Télécharger la vidéo (9:16)" : "Download video (9:16)"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!loop.audioUrl}
                  onClick={() => {
                    void (async () => {
                      if (!loop.audioUrl) return;
                      try {
                        const response = await fetch(loop.audioUrl);
                        const blob = await response.blob();
                        const formatHint = (loop.details?.audioFormat || "").toLowerCase();
                        const type = (blob.type || "").toLowerCase();
                        const ext =
                          formatHint === "wav" || formatHint === "wav32"
                            ? "wav"
                            : formatHint === "flac"
                              ? "flac"
                              : formatHint === "opus"
                                ? "opus"
                                : formatHint === "aac"
                                  ? "aac"
                                  : type.includes("wav")
                                    ? "wav"
                                    : type.includes("flac")
                                      ? "flac"
                                      : type.includes("opus")
                                        ? "opus"
                                        : type.includes("aac")
                                          ? "aac"
                                          : "mp3";
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        const cleanName = (loop.name || "producerhit")
                          .replace(/[^a-zA-Z0-9\s-]/g, "")
                          .replace(/\s+/g, "-")
                          .toLowerCase()
                          .slice(0, 64);
                        a.download = `${cleanName || "producerhit"}.${ext}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch {
                        toast.error(locale === "fr" ? "Téléchargement impossible" : "Download failed");
                      }
                    })();
                  }}
                >
                  <Download className="h-4 w-4" />
                  {locale === "fr" ? "Télécharger l’audio" : "Download audio"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const text = (loop.details?.caption || loop.prompt || "").trim();
                    if (!text) {
                      toast.error(locale === "fr" ? "Aucun texte" : "No text");
                      return;
                    }
                    void copyText(text, locale === "fr" ? "Texte copié" : "Copied", locale === "fr" ? "Copie impossible" : "Copy failed");
                  }}
                >
                  <Copy className="h-4 w-4" />
                  {locale === "fr" ? "Copier le texte" : "Copy caption"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
