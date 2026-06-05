import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Music2, Sparkles, Upload, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import type { Loop } from "@/types/loop";
import { REMIX_ACCEPT, validateRemixFile, type AceRemixTaskType } from "@/lib/aceRemix";
import type { PendingRemix } from "@/lib/pendingRemix";
import { REMIX_VIBE_FALLBACK_COPY } from "@/lib/remixVibeFallback";
import { fetchRemixSourceLoop, loopToRemixSource, remixSourceSummary, remixSourceToLoop } from "@/lib/remixSourceLoop";
import { isSongLoop } from "@/lib/vocalLanguages";
import { resolveLoopDisplayCoverUrl } from "@/lib/coverArt";
import { GenerationCreditAmount } from "@/components/GenerationCreditIcon";
import { cn, COVER_SURFACE_CLASS } from "@/lib/utils";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";

function loopLibrarySubtitle(loop: Loop, isFr: boolean): string {
  const parts: string[] = [];
  if (loop.genre?.trim()) parts.push(loop.genre.trim());
  if (loop.bpm > 0) parts.push(`${loop.bpm} BPM`);
  const keyScale = [loop.key, loop.scale].filter(Boolean).join(" ");
  if (keyScale) parts.push(keyScale);
  if (!parts.length) return isFr ? "Track" : "Track";
  return parts.join(" · ");
}

function loopLibraryChipLabel(loop: Loop, all: Loop[]): string {
  const name = loop.name.trim() || "Track";
  const dupes = all.filter((l) => l.name.trim() === name).length;
  if (dupes <= 1) return name;
  const bits = [name];
  if (loop.bpm > 0) bits.push(String(loop.bpm));
  else bits.push(loop.id.slice(0, 6));
  return bits.join(" · ");
}

type Props = {
  locale: "en" | "fr";
  loops: Loop[];
  generating: boolean;
  remaining: number;
  plan?: string;
  externalRemix?: PendingRemix | null;
  onExternalRemixConsumed?: () => void;
  mobileDock?: boolean;
  onMobileDockChange?: (
    state: {
      canSubmit: boolean;
      generating: boolean;
      submit: () => void;
      idleLabel: string;
      generatingLabel: string;
    } | null,
  ) => void;
  /** Recréation vibe (Song/Beat) — sans upload ACE. */
  vibeRecreateMode?: boolean;
  onGenerate: (input: {
    audioFile: File;
    prompt: string;
    lyrics: string;
    taskType: AceRemixTaskType;
    coverStrength: number;
    durationSec: number | null;
    bpm: number | null;
    instrumental: boolean;
    sourceLoopName?: string;
  }) => void;
  onRecreateVibe?: (input: { sourceLoop: Loop; styleTouch: string; instrumental: boolean }) => void;
};

export function RemixStudioPanel({
  locale,
  loops,
  generating,
  remaining,
  plan,
  externalRemix,
  onExternalRemixConsumed,
  mobileDock = false,
  onMobileDockChange,
  vibeRecreateMode = false,
  onGenerate,
  onRecreateVibe,
}: Props) {
  const isFr = locale === "fr";
  const vibeCopy = REMIX_VIBE_FALLBACK_COPY[isFr ? "fr" : "en"];
  const inputRef = useRef<HTMLInputElement>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [sourceLabel, setSourceLabel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [taskType, setTaskType] = useState<AceRemixTaskType>("cover");
  const [coverStrength, setCoverStrength] = useState(0.65);
  const [instrumental, setInstrumental] = useState(true);
  const [durationAuto, setDurationAuto] = useState(true);
  const [durationSec, setDurationSec] = useState(60);
  const [bpmAuto, setBpmAuto] = useState(true);
  const [bpm, setBpm] = useState(120);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [sourceLoop, setSourceLoop] = useState<Loop | null>(null);
  const [styleTouch, setStyleTouch] = useState("");
  const libraryRailRef = useRef<HTMLDivElement | null>(null);

  /** Toutes les tracks bibliothèque — sélection métadonnées (comme le menu Genre), pas besoin d’audio jouable. */
  const selectableLibraryLoops = useMemo(
    () => [...loops].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [loops],
  );

  const filteredLibraryLoops = useMemo(() => {
    const q = libraryQuery.trim().toLowerCase();
    if (!q) return selectableLibraryLoops;
    return selectableLibraryLoops.filter((l) => {
      const hay = [l.name, l.genre, l.prompt, l.mood, l.key, l.scale].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [libraryQuery, selectableLibraryLoops]);

  const quickPickLoops = useMemo(() => selectableLibraryLoops.slice(0, 6), [selectableLibraryLoops]);

  const onPickFile = (file: File | null) => {
    if (!file) return;
    const err = validateRemixFile(file);
    if (err === "file_too_large") {
      toast.error(isFr ? "Max 12 Mo" : "Max 12 MB");
      return;
    }
    if (err) {
      toast.error(isFr ? "Format audio non supporté" : "Unsupported audio format");
      return;
    }
    setAudioFile(file);
    setSourceLabel(file.name);
  };

  const applySourceLoop = useCallback((loop: Loop) => {
    setSourceLoop(loop);
    setSourceLabel(loop.name);
    setInstrumental(!isSongLoop(loop));
    setLyrics(loop.details?.lyrics || "");
    if (loop.bpm > 0) {
      setBpmAuto(false);
      setBpm(loop.bpm);
    }
  }, []);

  useEffect(() => {
    if (!externalRemix) return;

    if (vibeRecreateMode) {
      let cancelled = false;
      void (async () => {
        const snapshot = externalRemix.sourceLoop ?? (await fetchRemixSourceLoop(externalRemix.sourceLoopId));
        if (cancelled) return;
        if (snapshot) {
          applySourceLoop(remixSourceToLoop(snapshot));
          toast.success(vibeCopy.loadedToast);
        } else {
          toast.error(isFr ? "Impossible de charger les infos du track" : "Could not load track metadata");
        }
        onExternalRemixConsumed?.();
      })();
      return () => {
        cancelled = true;
      };
    }

    const applyMeta = () => {
      setSourceLabel(externalRemix.sourceLoopName);
      setPrompt(externalRemix.prompt || "");
      if (externalRemix.bpm && externalRemix.bpm > 0) {
        setBpmAuto(false);
        setBpm(externalRemix.bpm);
      }
    };

    if (!externalRemix.audioUrl?.trim()) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(externalRemix.audioUrl);
        if (!res.ok) throw new Error("fetch failed");
        const blob = await res.blob();
        const safeName = externalRemix.sourceLoopName.replace(/[^a-zA-Z0-9._-]+/g, "_") || "community_track";
        const file = new File([blob], `${safeName}.mp3`, { type: blob.type || "audio/mpeg" });
        if (cancelled) return;
        onPickFile(file);
        applyMeta();
        toast.success(isFr ? "Vibe chargée — lance ton remix ✨" : "Vibe loaded — run your remix ✨");
        onExternalRemixConsumed?.();
      } catch {
        if (!cancelled) toast.error(isFr ? "Impossible de charger l'audio" : "Could not load audio");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applySourceLoop, externalRemix, isFr, onExternalRemixConsumed, vibeCopy.loadedToast, vibeRecreateMode]);

  const loadFromLoop = useCallback(
    async (loop: Loop) => {
      if (vibeRecreateMode) {
        applySourceLoop(loop);
        return;
      }

      if (!loop.audioUrl) return;
      try {
        const res = await fetch(loop.audioUrl);
        if (!res.ok) throw new Error("fetch failed");
        const blob = await res.blob();
        const file = new File([blob], `${loop.name.replace(/[^a-zA-Z0-9._-]+/g, "_") || "track"}.mp3`, {
          type: blob.type || "audio/mpeg",
        });
        onPickFile(file);
        setSourceLabel(loop.name);
        if (!prompt.trim()) {
          setPrompt(
            loop.prompt?.trim() ||
              (isFr
                ? `${loop.genre} remix moderne, même vibe mais relooké 2026, mix pro`
                : `Modern ${loop.genre} remix, same vibe but refreshed 2026, pro mix`),
          );
        }
      } catch {
        toast.error(isFr ? "Impossible de charger cette track" : "Could not load this track");
      }
    },
    [applySourceLoop, isFr, prompt, vibeRecreateMode],
  );

  const selectLibraryLoop = useCallback(
    (loop: Loop) => {
      void (async () => {
        if (vibeRecreateMode) {
          const snapshot = await fetchRemixSourceLoop(loop.id);
          applySourceLoop(snapshot ? remixSourceToLoop(snapshot) : loop);
        } else {
          await loadFromLoop(loop);
        }
        requestAnimationFrame(() => {
          const el = libraryRailRef.current?.querySelector(`[data-remix-loop-id="${loop.id}"]`);
          el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        });
      })();
    },
    [applySourceLoop, loadFromLoop, vibeRecreateMode],
  );

  useEffect(() => {
    if (!sourceLoop?.id || !libraryRailRef.current) return;
    const el = libraryRailRef.current.querySelector(`[data-remix-loop-id="${sourceLoop.id}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [sourceLoop?.id]);

  const sourceSummary = useMemo(() => {
    if (!sourceLoop) return "";
    return remixSourceSummary(loopToRemixSource(sourceLoop), locale);
  }, [locale, sourceLoop]);

  const canSubmitVibe = !!sourceLoop && remaining > 0 && !generating;
  const canSubmitUpload = !!audioFile && canSubmitVibe;
  const canSubmit = vibeRecreateMode ? canSubmitVibe : canSubmitUpload;

  const runGenerate = useCallback(() => {
    if (!canSubmit) return;
    if (vibeRecreateMode && sourceLoop) {
      onRecreateVibe?.({ sourceLoop, styleTouch: styleTouch.trim(), instrumental });
      return;
    }
    if (!audioFile) return;
    onGenerate({
      audioFile,
      prompt: prompt.trim(),
      lyrics: lyrics.trim(),
      taskType,
      coverStrength,
      durationSec: durationAuto ? null : durationSec,
      bpm: bpmAuto ? null : bpm,
      instrumental,
      sourceLoopName: sourceLabel,
    });
  }, [
    audioFile,
    bpm,
    bpmAuto,
    canSubmit,
    coverStrength,
    durationAuto,
    durationSec,
    sourceLoop,
    styleTouch,
    instrumental,
    lyrics,
    onGenerate,
    onRecreateVibe,
    prompt,
    sourceLabel,
    taskType,
    vibeRecreateMode,
  ]);

  useEffect(() => {
    if (!mobileDock || !onMobileDockChange) return;
    onMobileDockChange({
      canSubmit,
      generating,
      submit: runGenerate,
      idleLabel: vibeRecreateMode ? vibeCopy.ctaIdle : isFr ? "Lancer le remix" : "Run remix",
      generatingLabel: vibeRecreateMode ? vibeCopy.ctaGenerating : isFr ? "Remix en cours…" : "Remixing…",
    });
    return () => onMobileDockChange(null);
  }, [canSubmit, generating, isFr, mobileDock, onMobileDockChange, runGenerate]);

  return (
    <div className={cn("space-y-4", mobileDock ? "p-3 pb-2" : "p-4 pb-6")}>
      <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 p-3 md:p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 shrink-0 text-cyan-300" />
          {vibeRecreateMode ? vibeCopy.panelTitle : isFr ? "Remix Studio" : "Remix Studio"}
          <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200/90">
            {vibeRecreateMode ? vibeCopy.panelBadge : "ACE Cover"}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/60">
          {vibeRecreateMode
            ? vibeCopy.panelHint
            : isFr
              ? "Upload ou choisis une track, décris le style, lance le cover/remix."
              : "Upload or pick a track, describe the style, run your cover/remix."}
        </p>
        {vibeRecreateMode && sourceLabel.trim() ? (
          <p className="mt-2 text-[11px] font-medium text-cyan-200/80">{vibeCopy.inspiredBy(sourceLabel)}</p>
        ) : null}
      </div>

      {!vibeRecreateMode ? (
      <div
        className={cn(
          "relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-4 text-center transition-colors md:min-h-[140px] md:p-5",
          audioFile ? "border-cyan-400/40 bg-cyan-500/5" : "border-white/15 bg-white/[0.02] hover:border-white/25",
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPickFile(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={REMIX_ACCEPT}
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
        />
        <Upload className="mb-2 h-7 w-7 text-cyan-300/80 md:h-8 md:w-8" />
        <div className="text-sm font-semibold text-white">{audioFile ? sourceLabel : isFr ? "Upload audio" : "Upload audio"}</div>
        <div className="mt-1 text-xs text-white/45">
          {isFr ? "MP3, WAV, FLAC · max 12 Mo" : "MP3, WAV, FLAC · max 12 MB"}
        </div>
        {audioFile ? (
          <button
            type="button"
            className="mt-3 inline-flex items-center gap-1 text-xs text-white/50 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              setAudioFile(null);
              setSourceLabel("");
            }}
          >
            <X className="h-3 w-3" />
            {isFr ? "Retirer" : "Remove"}
          </button>
        ) : null}
      </div>
      ) : null}

      {selectableLibraryLoops.length ? (
        <div className="grid gap-3">
          <div>
            <div className="text-xs text-pk-muted">{isFr ? "Track source" : "Source track"}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-pk-muted">
              {isFr
                ? "Choisis une track comme pour le genre — on reprend ses infos, pas besoin de la lire ici."
                : "Pick a track like a genre chip — we reuse its metadata, no need to play it here."}
            </p>
          </div>

          <input
            value={libraryQuery}
            onChange={(e) => setLibraryQuery(e.target.value)}
            placeholder={isFr ? "Chercher une track…" : "Search a track…"}
            className="w-full rounded-xl border border-pk-border bg-pk-bg px-3 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent/40"
          />

          <div ref={libraryRailRef} className="pk-remix-library-rail">
            {filteredLibraryLoops.length ? (
              filteredLibraryLoops.map((loop) => {
                const selected = sourceLoop?.id === loop.id;
                const coverUrl = resolveLoopDisplayCoverUrl(loop, 96);
                return (
                  <button
                    key={loop.id}
                    type="button"
                    data-remix-loop-id={loop.id}
                    onClick={() => selectLibraryLoop(loop)}
                    className={cn(
                      "pk-remix-library-pill shrink-0 text-left transition-colors",
                      selected ? "pk-remix-library-pill--selected" : "",
                    )}
                  >
                    <span
                      className={cn(
                        "pk-remix-library-pill__thumb relative block shrink-0 overflow-hidden rounded-lg",
                        COVER_SURFACE_CLASS,
                      )}
                    >
                      {coverUrl ? (
                        <img src={coverUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-white/30">
                          <Music2 className="h-4 w-4" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold leading-tight">{loop.name}</span>
                      <span className="block truncate text-[10px] text-pk-muted">{loopLibrarySubtitle(loop, isFr)}</span>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-2 py-4 text-center text-xs text-pk-muted">
                {isFr ? "Aucune track pour cette recherche." : "No tracks match your search."}
              </p>
            )}
          </div>

          {quickPickLoops.length && !libraryQuery.trim() ? (
            <div>
              <div className="text-xs text-pk-muted">{isFr ? "Raccourcis" : "Shortcuts"}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {quickPickLoops.map((loop) => {
                  const selected = sourceLoop?.id === loop.id;
                  return (
                    <button
                      key={`chip-${loop.id}`}
                      type="button"
                      className={cn(
                        "max-w-full rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                        selected
                          ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent"
                          : "border-pk-border bg-pk-bg text-pk-muted hover:bg-white/5 hover:text-pk-text",
                      )}
                      onClick={() => selectLibraryLoop(loop)}
                    >
                      {loopLibraryChipLabel(loop, selectableLibraryLoops)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!vibeRecreateMode ? (
      <div className="flex gap-2">
        {(["cover", "repaint"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTaskType(t)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              taskType === t ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white",
            )}
          >
            {t === "cover" ? "Cover" : "Repaint"}
          </button>
        ))}
        <span className="ml-auto self-center text-[10px] text-white/35">
          {taskType === "cover"
            ? isFr
              ? "Proche de l'original"
              : "Closer to original"
            : isFr
              ? "Transformation forte"
              : "Bold transform"}
        </span>
      </div>
      ) : null}

      {vibeRecreateMode ? (
        <>
          {!sourceLoop && !selectableLibraryLoops.length ? (
            <p className="text-xs text-white/45">
              {isFr ? "Génère d’abord une track, ou remix depuis la communauté." : "Generate a track first, or remix from the community."}
            </p>
          ) : null}
          <div>
            <label className="text-xs text-white/55">{vibeCopy.basePromptLabel}</label>
            <div className="mt-1 max-h-24 overflow-y-auto rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs leading-relaxed text-white/55">
              {sourceLoop?.prompt?.trim() || "—"}
            </div>
          </div>
          <div>
            <label className="text-xs text-white/55">{vibeCopy.styleTouchLabel}</label>
            <textarea
              value={styleTouch}
              onChange={(e) => setStyleTouch(e.target.value)}
              rows={2}
              placeholder={vibeCopy.styleTouchPlaceholder}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none placeholder:text-white/35 focus:border-cyan-400/40"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
            <span className="text-xs text-white/55">{isFr ? "Mode de sortie" : "Output mode"}</span>
            <button
              type="button"
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors",
                instrumental ? "bg-white/10 text-white/70" : "bg-cyan-500/15 text-cyan-200",
              )}
              onClick={() => setInstrumental((v) => !v)}
            >
              {instrumental ? (isFr ? "Type Beat" : "Type Beat") : isFr ? "Song (paroles conservées)" : "Song (lyrics kept)"}
            </button>
          </div>
          {!instrumental && sourceLoop?.details?.lyrics?.trim() ? (
            <div>
              <label className="text-xs text-white/55">{isFr ? "Paroles source (conservées)" : "Source lyrics (kept)"}</label>
              <div className="mt-1 max-h-20 overflow-y-auto rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] leading-relaxed text-white/50">
                {sourceLoop.details.lyrics}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div>
            <label className="text-xs text-white/55">{isFr ? "Prompt (style du remix)" : "Prompt (remix style)"}</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder={
                isFr
                  ? "Ex: trap dark remix, 808 lourds, mélodie émotionnelle…"
                  : "Ex: dark trap remix, heavy 808s, emotional melody…"
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none placeholder:text-white/35 focus:border-cyan-400/40"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-white/55">{isFr ? "Paroles (optionnel)" : "Lyrics (optional)"}</label>
              <button
                type="button"
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                  instrumental ? "bg-white/10 text-white/70" : "bg-cyan-500/15 text-cyan-200",
                )}
                onClick={() => setInstrumental((v) => !v)}
              >
                {instrumental ? (isFr ? "Instrumental" : "Instrumental") : isFr ? "Avec voix" : "With vocals"}
              </button>
            </div>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={2}
              disabled={instrumental}
              placeholder={isFr ? "Laisse vide pour instrumental…" : "Leave blank for instrumental…"}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none placeholder:text-white/35 disabled:opacity-40"
            />
          </div>
        </>
      )}

      {!vibeRecreateMode ? (
      <div>
        <div className="flex items-center justify-between text-xs text-white/55">
          <span>{isFr ? "Force cover" : "Cover strength"}</span>
          <span>{Math.round(coverStrength * 100)}%</span>
        </div>
        <Slider label="" min={15} max={100} value={Math.round(coverStrength * 100)} onChange={(v) => setCoverStrength(v / 100)} />
        <div className="mt-1 text-[10px] text-white/35">
          {isFr ? "Bas = plus proche de l'original · Haut = transformation forte" : "Low = closer to original · High = bold transform"}
        </div>
      </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between text-xs text-white/55">
            <span>{isFr ? "Durée" : "Duration"}</span>
            <button type="button" className="text-[10px] text-cyan-300/80" onClick={() => setDurationAuto((v) => !v)}>
              {durationAuto ? "Auto" : `${durationSec}s`}
            </button>
          </div>
          {!durationAuto ? <Slider label="" min={10} max={240} value={durationSec} onChange={setDurationSec} /> : null}
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-white/55">
            <span>BPM</span>
            <button type="button" className="text-[10px] text-cyan-300/80" onClick={() => setBpmAuto((v) => !v)}>
              {bpmAuto ? "Auto" : String(bpm)}
            </button>
          </div>
          {!bpmAuto ? <Slider label="" min={30} max={200} value={bpm} onChange={setBpm} /> : null}
        </div>
      </div>

      {!mobileDock ? (
        <div className="space-y-2 border-t border-white/10 pt-4">
          {remaining <= 0 ? (
            <p className="text-xs text-amber-200/90">
              {isFr ? "Plus de crédits ce mois-ci — " : "No credits left this month — "}
              <button
                type="button"
                className="font-semibold text-cyan-200 underline-offset-2 hover:text-white hover:underline"
                onClick={() =>
              useGrowthUpsellStore.getState().openUpsell("credits_exhausted", {
                source: "remix_studio",
                plan,
                remaining,
              })
            }
              >
                {isFr ? "voir les plans" : "view plans"}
              </button>
            </p>
          ) : !vibeRecreateMode && !audioFile ? (
            <p className="text-xs text-white/45">{isFr ? "Ajoute un audio pour activer le remix." : "Add audio to enable remix."}</p>
          ) : vibeRecreateMode && !sourceLoop ? (
            <p className="text-xs text-white/45">{isFr ? "Sélectionne une track source." : "Select a source track."}</p>
          ) : !vibeRecreateMode && prompt.trim().length <= 3 ? (
            <p className="text-xs text-white/45">{isFr ? "Décris le style du remix (4+ caractères)." : "Describe the remix style (4+ chars)."}</p>
          ) : (
            <p className="inline-flex flex-wrap items-center gap-1 text-xs text-white/45">
              <GenerationCreditAmount amount={1} iconClassName="h-2.5 w-2.5" />
              <span>
                {vibeRecreateMode
                  ? vibeCopy.creditHintSuffix
                  : isFr
                    ? " · résultat dans ta bibliothèque"
                    : " · saved to your library"}
                {plan ? ` · ${plan}` : ""}
              </span>
            </p>
          )}

          <Button variant="primary" className="w-full" disabled={!canSubmit} onClick={runGenerate}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {generating
              ? vibeRecreateMode
                ? vibeCopy.ctaGenerating
                : isFr
                  ? "Remix en cours…"
                  : "Remixing…"
              : vibeRecreateMode
                ? vibeCopy.ctaIdle
                : isFr
                  ? "Lancer le remix"
                  : "Run remix"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
