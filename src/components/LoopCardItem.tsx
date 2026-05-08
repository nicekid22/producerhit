import { useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AudioWaveform } from "@/components/WaveformVisualizer";
import { useLoopsStore } from "@/stores/loopsStore";
import { usePlayerStore } from "@/stores/playerStore";
import type { Loop } from "@/types/loop";
import { generateBeat } from "@/lib/audioApi";
import { Bookmark, Download, Info, Loader2, Pause, Play, RefreshCcw } from "lucide-react";

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

function hashString(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function coverGradient(loop: Loop) {
  const seed = hashString(`${loop.id}:${loop.genre}:${loop.mood}:${loop.bpm}`);
  const h1 = seed % 360;
  const h2 = (h1 + 35 + ((seed >>> 8) % 40)) % 360;
  const h3 = (h2 + 35 + ((seed >>> 16) % 40)) % 360;
  const a = 0.92;
  return `linear-gradient(135deg, hsla(${h1}, 85%, 55%, ${a}) 0%, hsla(${h2}, 85%, 50%, ${a}) 45%, hsla(${h3}, 85%, 45%, ${a}) 100%)`;
}

export function LoopCardItem({
  loop,
  onDelete,
  onOpenDetails,
}: {
  loop: Loop;
  onDelete?: () => void;
  onOpenDetails?: (loop: Loop) => void;
}) {
  const current = usePlayerStore((s) => s.current);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const currentTimeSec = usePlayerStore((s) => s.currentTimeSec);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const requestSeek = usePlayerStore((s) => s.requestSeek);
  const setPlaying = usePlayerStore((s) => s.setPlaying);

  const toggleSavedRemote = useLoopsStore((s) => s.toggleSavedRemote);
  const createLoop = useLoopsStore((s) => s.createLoop);
  const cachedDurationSec = useLoopsStore((s) => s.durationsSecById[loop.id] ?? 0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isVarying, setIsVarying] = useState(false);

  const active = current?.id === loop.id;
  const activePlaying = active && isPlaying;
  const canPlay = Boolean(loop.audioUrl);
  const totalLabel = cachedDurationSec > 0 ? formatTime(cachedDurationSec) : "—";
  const durationLabel = active ? formatTime(currentTimeSec) : totalLabel;

  return (
    <div
      className={cn("rounded-pk border border-pk-border bg-pk-panel p-4", active ? "shadow-glow" : "")}
      onClick={() => onOpenDetails?.(loop)}
      role={onOpenDetails ? "button" : undefined}
      tabIndex={onOpenDetails ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onOpenDetails) return;
        if (e.key === "Enter" || e.key === " ") onOpenDetails(loop);
      }}
    >
      <div className="flex gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-pk border border-pk-border" style={{ backgroundImage: coverGradient(loop) }} aria-hidden />
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="truncate text-sm font-semibold">{loop.name}</div>
            {onOpenDetails ? (
              <Button
                variant="secondary"
                size="sm"
                className="px-2 py-1 text-[11px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(loop);
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
            if (!canPlay) return;
            if (!active) {
              setCurrent(loop, true);
              const audioEl = document.getElementById("pk-audio") as HTMLAudioElement | null;
              if (audioEl) {
                audioEl.src = loop.audioUrl ?? "";
                audioEl.load();
                void audioEl
                  .play()
                  .then(() => setPlaying(true))
                  .catch(() => setPlaying(false));
              } else {
                setCurrent(loop, true);
              }
              return;
            }
            setPlaying(!isPlaying);
          }}
          disabled={!canPlay}
          aria-label={activePlaying ? "Pause" : "Play"}
          title={!canPlay ? "Audio expired — generate a variation" : activePlaying ? "Pause" : "Play"}
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
          title={!loop.audioUrl ? "Audio expired — generate a variation" : "Download"}
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isVarying}
          onClick={(e) => {
            e.stopPropagation();
            void (async () => {
              if (isVarying) return;
              setIsVarying(true);
              let audioUrl: string | null = null;
              try {
                const isSongLike =
                  (typeof loop.details?.lyrics === "string" && loop.details.lyrics.trim().length > 0) ||
                  /\bsong\b/i.test(loop.name);
                const barsCount = barsFromLoopLength(loop.loopLength);
                const now = Date.now();
                const variationPrompt = isSongLike
                  ? [
                      loop.prompt?.trim() || "",
                      "variation",
                      `seed:${now}`,
                      "same song idea and vibe, new arrangement and instrumentation",
                      "keep the exact same lyrics provided (do not rewrite lyrics)",
                    ]
                      .filter(Boolean)
                      .join(", ")
                  : [
                      loop.prompt?.trim() || "",
                      "variation",
                      `seed:${now}`,
                      "fresh melody and drum details while keeping the same style and groove",
                    ]
                      .filter(Boolean)
                      .join(", ");

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
                    prompt: variationPrompt,
                  },
                  engine,
                  isSongLike
                    ? {
                        instrumental: false,
                        lyrics: loop.details?.lyrics || "",
                        vocalLanguage: "en",
                        isSong: true,
                        autoMeta,
                        useFormat: true,
                        duration: typeof loop.details?.duration === "number" ? loop.details.duration : undefined,
                        timeSignature: loop.details?.timeSignature || undefined,
                        audioFormat: loop.details?.audioFormat || "mp3",
                      }
                    : {
                        instrumental: true,
                        lyrics: "",
                        vocalLanguage: "en",
                        isSong: false,
                        autoMeta,
                        useFormat: true,
                        audioFormat: loop.details?.audioFormat || "mp3",
                      },
                );

                audioUrl = result.audioUrl;
                const draft: Omit<Loop, "id" | "createdAt" | "userId"> = {
                  engine: result.engine,
                  name: `${loop.genre} ${isSongLike ? "Song" : "Beat"} Variation — ${loop.key || "Auto"} ${loop.scale || ""}`.trim(),
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
                  prompt: variationPrompt,
                  audioUrl: audioUrl ?? null,
                  details: result.meta
                    ? {
                        caption: result.meta.prompt ?? variationPrompt,
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
                  stemsUrl: null,
                  isSaved: false,
                };

                try {
                  const created = await createLoop(draft);
                  setCurrent(created, true);
                  toast.success("Variation generated!");
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Saving failed";
                  if (audioUrl) {
                    const id =
                      typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `local-${Date.now()}`;
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
                      details: draft.details ?? null,
                      stemsUrl: null,
                      isSaved: false,
                      createdAt: new Date().toISOString(),
                    };
                    setCurrent(temp, true);
                    toast.error(`Variation generated, but saving failed: ${message}`);
                  } else {
                    throw err;
                  }
                }
              } catch (err) {
                const anyErr = err as unknown as { limitReached?: boolean };
                if (anyErr?.limitReached) {
                  toast.error("Monthly limit reached — upgrade your plan");
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
                    const message = rawMessage || "Variation failed — try again";
                    toast.error(message);
                  }
                }
              } finally {
                setIsVarying(false);
              }
            })();
          }}
          title="Regenerate"
        >
          <RefreshCcw className="h-4 w-4" />
          {isVarying ? "Generating..." : "Variation"}
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
    </div>
  );
}

