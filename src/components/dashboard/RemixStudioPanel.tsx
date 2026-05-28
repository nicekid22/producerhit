import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Music2, Sparkles, Upload, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import type { Loop } from "@/types/loop";
import { REMIX_ACCEPT, validateRemixFile, type AceRemixTaskType } from "@/lib/aceRemix";
import type { PendingRemix } from "@/lib/pendingRemix";
import { buildRemixPromptFromMeta } from "@/lib/pendingRemix";
import { cn } from "@/lib/utils";

type Props = {
  locale: "en" | "fr";
  loops: Loop[];
  generating: boolean;
  remaining: number;
  plan?: string;
  externalRemix?: PendingRemix | null;
  onExternalRemixConsumed?: () => void;
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
};

export function RemixStudioPanel({
  locale,
  loops,
  generating,
  remaining,
  plan,
  externalRemix,
  onExternalRemixConsumed,
  onGenerate,
}: Props) {
  const isFr = locale === "fr";
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

  const libraryCandidates = useMemo(() => {
    const q = libraryQuery.trim().toLowerCase();
    return loops
      .filter((l) => typeof l.audioUrl === "string" && l.audioUrl.trim().length > 0)
      .filter((l) => !q || l.name.toLowerCase().includes(q) || l.genre.toLowerCase().includes(q))
      .slice(0, 8);
  }, [libraryQuery, loops]);

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

  useEffect(() => {
    if (!externalRemix?.audioUrl) return;
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
        setSourceLabel(externalRemix.sourceLoopName);
        setPrompt(
          buildRemixPromptFromMeta({
            prompt: externalRemix.prompt,
            genre: externalRemix.genre,
            mood: externalRemix.mood,
            locale,
          }),
        );
        if (externalRemix.bpm && externalRemix.bpm > 0) {
          setBpmAuto(false);
          setBpm(externalRemix.bpm);
        }
        toast.success(isFr ? "Vibe chargée — lance ton remix ✨" : "Vibe loaded — run your remix ✨");
        onExternalRemixConsumed?.();
      } catch {
        if (!cancelled) toast.error(isFr ? "Impossible de charger l'audio" : "Could not load audio");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [externalRemix, isFr, locale, onExternalRemixConsumed]);

  const loadFromLoop = useCallback(
    async (loop: Loop) => {
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
            isFr
              ? `${loop.genre} remix moderne, même vibe mais relooké 2026, mix pro`
              : `Modern ${loop.genre} remix, same vibe but refreshed 2026, pro mix`,
          );
        }
      } catch {
        toast.error(isFr ? "Impossible de charger cette track" : "Could not load this track");
      }
    },
    [isFr, prompt],
  );

  const canSubmit = !!audioFile && prompt.trim().length > 3 && remaining > 0 && !generating;

  return (
    <div className="space-y-4 p-4 pb-6">
      <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 p-3 md:p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 shrink-0 text-cyan-300" />
          {isFr ? "Remix Studio" : "Remix Studio"}
          <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200/90">
            ACE Cover
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-white/60">
          {isFr
            ? "Upload ou choisis une track, décris le style, lance le cover/remix."
            : "Upload or pick a track, describe the style, run your cover/remix."}
        </p>
      </div>

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

      {loops.length ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-white/70">{isFr ? "Depuis ta bibliothèque" : "From your library"}</div>
          <input
            value={libraryQuery}
            onChange={(e) => setLibraryQuery(e.target.value)}
            placeholder={isFr ? "Chercher une track…" : "Search a track…"}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none placeholder:text-white/35 focus:border-cyan-400/35"
          />
          <div className="flex flex-wrap gap-2">
            {libraryCandidates.map((loop) => (
              <button
                key={loop.id}
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  sourceLabel === loop.name
                    ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                    : "border-white/10 bg-white/[0.04] text-white/70 hover:border-cyan-400/30 hover:text-white",
                )}
                onClick={() => void loadFromLoop(loop)}
              >
                <Music2 className="mr-1 inline h-3 w-3" />
                {loop.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

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

      <div className="space-y-2 border-t border-white/10 pt-4">
        {remaining <= 0 ? (
          <p className="text-xs text-amber-200/90">
            {isFr ? "Plus de crédits ce mois-ci — upgrade ton plan pour remixer." : "No credits left this month — upgrade to remix."}
          </p>
        ) : !audioFile ? (
          <p className="text-xs text-white/45">{isFr ? "Ajoute un audio pour activer le remix." : "Add audio to enable remix."}</p>
        ) : prompt.trim().length <= 3 ? (
          <p className="text-xs text-white/45">{isFr ? "Décris le style du remix (4+ caractères)." : "Describe the remix style (4+ chars)."}</p>
        ) : (
          <p className="text-xs text-white/45">
            {isFr ? "1 crédit · résultat dans ta bibliothèque" : "1 credit · saved to your library"}
            {plan ? ` · ${plan}` : ""}
          </p>
        )}

        <Button
          variant="primary"
          className="w-full"
          disabled={!canSubmit}
          onClick={() => {
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
          }}
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {generating ? (isFr ? "Remix en cours…" : "Remixing…") : isFr ? "Lancer le remix" : "Run remix"}
        </Button>
      </div>
    </div>
  );
}
