import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Upload, X } from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";
import { Slider } from "@/components/ui/Slider";
import { GeneratorSection } from "@/components/dashboard/GeneratorSection";
import type { PanelGenerateBridge } from "@/components/dashboard/panelGenerateBridge";
import type { Loop } from "@/types/loop";
import { REMIX_ACCEPT, validateRemixFile, type AceRemixTaskType } from "@/lib/aceRemix";
import type { PendingRemix } from "@/lib/pendingRemix";
import { REMIX_VIBE_FALLBACK_COPY } from "@/lib/remixVibeFallback";
import { fetchRemixSourceLoop, loopToRemixSource, remixSourceSummary, remixSourceToLoop } from "@/lib/remixSourceLoop";
import { isSongLoop } from "@/lib/vocalLanguages";
import { cn } from "@/lib/utils";

import type { AppLocale } from "@/i18n/config";

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
  locale: AppLocale;
  loops: Loop[];
  generating: boolean;
  remaining: number;
  externalRemix?: PendingRemix | null;
  onExternalRemixConsumed?: () => void;
  compactSections?: boolean;
  onGenerateBridgeChange?: (state: PanelGenerateBridge | null) => void;
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
  externalRemix,
  onExternalRemixConsumed,
  compactSections = false,
  onGenerateBridgeChange,
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
  const [sourceLoop, setSourceLoop] = useState<Loop | null>(null);
  const [styleTouch, setStyleTouch] = useState("");

  /** Toutes les tracks bibliothèque — sélection métadonnées, pas besoin d’audio jouable. */
  const selectableLibraryLoops = useMemo(
    () => [...loops].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [loops],
  );

  const sourceTrackOptions = useMemo(
    () =>
      selectableLibraryLoops.map((loop) => ({
        value: loop.id,
        label: loopLibraryChipLabel(loop, selectableLibraryLoops),
      })),
    [selectableLibraryLoops],
  );

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
      })();
    },
    [applySourceLoop, loadFromLoop, vibeRecreateMode],
  );

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
    if (!onGenerateBridgeChange) return;
    onGenerateBridgeChange({
      canSubmit,
      generating,
      submit: runGenerate,
      idleLabel: vibeRecreateMode ? vibeCopy.ctaIdle : isFr ? "Lancer le remix" : "Run remix",
      generatingLabel: vibeRecreateMode ? vibeCopy.ctaGenerating : isFr ? "Remix en cours…" : "Remixing…",
    });
    return () => onGenerateBridgeChange(null);
  }, [canSubmit, generating, isFr, onGenerateBridgeChange, runGenerate, vibeCopy.ctaGenerating, vibeCopy.ctaIdle, vibeRecreateMode]);

  return (
    <>
      <GeneratorSection
        title={vibeRecreateMode ? vibeCopy.panelTitle : isFr ? "Remix" : "Remix"}
        hint={
          vibeRecreateMode
            ? vibeCopy.panelHint
            : isFr
              ? "Upload audio ou choisis une track, puis décris le style."
              : "Upload audio or pick a track, then describe the style."
        }
        collapsible={compactSections}
        defaultOpen
      >
        {vibeRecreateMode && sourceLabel.trim() ? (
          <p className="text-[11px] font-medium text-pk-muted">{vibeCopy.inspiredBy(sourceLabel)}</p>
        ) : null}
      </GeneratorSection>

      {!vibeRecreateMode ? (
        <GeneratorSection title={isFr ? "Audio source" : "Audio source"} collapsible={compactSections} defaultOpen>
          <div
            className={cn(
              "relative flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-colors",
              audioFile ? "border-pk-accent/35 bg-pk-accent/5" : "border-pk-border bg-pk-bg hover:border-pk-accent/25",
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
            <Upload className="mb-2 h-6 w-6 text-pk-muted" />
            <div className="text-sm font-semibold">{audioFile ? sourceLabel : isFr ? "Upload audio" : "Upload audio"}</div>
            <div className="mt-1 text-xs text-pk-muted">
              {isFr ? "MP3, WAV, FLAC · max 12 Mo" : "MP3, WAV, FLAC · max 12 MB"}
            </div>
            {audioFile ? (
              <button
                type="button"
                className="mt-3 inline-flex items-center gap-1 text-xs text-pk-muted hover:text-pk-text"
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
        </GeneratorSection>
      ) : null}

      {selectableLibraryLoops.length ? (
        <GeneratorSection
          title={isFr ? "Track source" : "Source track"}
          hint={
            isFr
              ? "On reprend les infos de la track — pas besoin de la lire ici."
              : "We reuse track metadata — no need to play it here."
          }
          collapsible={compactSections}
          defaultOpen
        >
          <Dropdown
            label={isFr ? "Bibliothèque" : "Library"}
            menuTitle={isFr ? "Choisir une track" : "Pick a track"}
            value={sourceLoop?.id ?? ""}
            onChange={(id) => {
              const loop = selectableLibraryLoops.find((l) => l.id === id);
              if (loop) void selectLibraryLoop(loop);
            }}
            options={sourceTrackOptions}
            placeholder={isFr ? "Sélectionne une track…" : "Select a track…"}
          />
          {sourceLoop && sourceSummary ? (
            <p className="mt-2 text-[11px] leading-relaxed text-pk-muted">{sourceSummary}</p>
          ) : null}
        </GeneratorSection>
      ) : null}

      {!vibeRecreateMode ? (
        <GeneratorSection title="Mode" collapsible={compactSections} defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {(["cover", "repaint"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTaskType(t)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  taskType === t ? "pk-prism-pill-active" : "bg-white/5 text-pk-muted hover:text-pk-text",
                )}
              >
                {t === "cover" ? "Cover" : "Repaint"}
              </button>
            ))}
          </div>
        </GeneratorSection>
      ) : null}

      {vibeRecreateMode ? (
        <GeneratorSection title={isFr ? "Style & sortie" : "Style & output"} collapsible={compactSections} defaultOpen>
          {!sourceLoop && !selectableLibraryLoops.length ? (
            <p className="text-xs text-pk-muted">
              {isFr ? "Génère d’abord une track, ou remix depuis la communauté." : "Generate a track first, or remix from the community."}
            </p>
          ) : null}
          <div>
            <label className="text-xs text-pk-muted">{vibeCopy.styleTouchLabel}</label>
            <textarea
              value={styleTouch}
              onChange={(e) => setStyleTouch(e.target.value)}
              rows={2}
              placeholder={vibeCopy.styleTouchPlaceholder}
              className="mt-1 w-full rounded-xl border border-pk-border bg-pk-bg px-3 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent/40"
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-pk-border bg-pk-bg/60 px-3 py-2">
            <span className="text-xs text-pk-muted">{isFr ? "Mode de sortie" : "Output mode"}</span>
            <button
              type="button"
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors",
                instrumental ? "bg-white/10 text-pk-muted" : "pk-prism-pill-active",
              )}
              onClick={() => setInstrumental((v) => !v)}
            >
              {instrumental ? (isFr ? "Type Beat" : "Type Beat") : isFr ? "Song (paroles)" : "Song (lyrics)"}
            </button>
          </div>
        </GeneratorSection>
      ) : (
        <GeneratorSection title={isFr ? "Style du remix" : "Remix style"} collapsible={compactSections} defaultOpen>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder={
              isFr
                ? "Ex: trap dark remix, 808 lourds, mélodie émotionnelle…"
                : "Ex: dark trap remix, heavy 808s, emotional melody…"
            }
            className="w-full rounded-xl border border-pk-border bg-pk-bg px-3 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent/40"
          />
          <div className="mt-3 flex items-center justify-between">
            <label className="text-xs text-pk-muted">{isFr ? "Paroles (optionnel)" : "Lyrics (optional)"}</label>
            <button
              type="button"
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                instrumental ? "bg-white/10 text-pk-muted" : "pk-prism-pill-active",
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
            className="mt-1 w-full rounded-xl border border-pk-border bg-pk-bg px-3 py-2 text-sm outline-none placeholder:text-pk-muted disabled:opacity-40"
          />
        </GeneratorSection>
      )}

      {!vibeRecreateMode ? (
        <GeneratorSection title={isFr ? "Réglages ACE" : "ACE settings"} collapsible defaultOpen={false}>
          <div>
            <div className="flex items-center justify-between text-xs text-pk-muted">
              <span>{isFr ? "Force cover" : "Cover strength"}</span>
              <span>{Math.round(coverStrength * 100)}%</span>
            </div>
            <Slider label="" min={15} max={100} value={Math.round(coverStrength * 100)} onChange={(v) => setCoverStrength(v / 100)} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between text-xs text-pk-muted">
                <span>{isFr ? "Durée" : "Duration"}</span>
                <button type="button" className="text-[10px] text-pk-accent" onClick={() => setDurationAuto((v) => !v)}>
                  {durationAuto ? "Auto" : `${durationSec}s`}
                </button>
              </div>
              {!durationAuto ? <Slider label="" min={10} max={240} value={durationSec} onChange={setDurationSec} /> : null}
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-pk-muted">
                <span>BPM</span>
                <button type="button" className="text-[10px] text-pk-accent" onClick={() => setBpmAuto((v) => !v)}>
                  {bpmAuto ? "Auto" : String(bpm)}
                </button>
              </div>
              {!bpmAuto ? <Slider label="" min={30} max={200} value={bpm} onChange={setBpm} /> : null}
            </div>
          </div>
        </GeneratorSection>
      ) : null}
    </>
  );
}
