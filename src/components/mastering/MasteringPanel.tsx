import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Lock, Pause, Play, Search, Sparkles, Wand2, ArrowLeft } from "lucide-react";
import { AudioWaveform } from "@/components/WaveformVisualizer";
import { Button } from "@/components/ui/Button";
import { audioBufferToBlobUrl, encodeWavBlob } from "@/lib/mastering/export";
import { loadMasteringSource, masterAudioBuffer } from "@/lib/mastering/engine";
import { MASTER_PRESET_LIST, MASTER_PRESETS, suggestPresetId, type MasterPresetId } from "@/lib/mastering/presets";
import { trackClientEvent } from "@/lib/supabaseClient";
import { canApplyMastering, canExportMastering } from "@/lib/planLimits";
import { notifyGamificationMasteringPreview } from "@/components/growth/GamificationStrip";
import { useLoopsStore } from "@/stores/loopsStore";
import { usePlayerStore } from "@/stores/playerStore";
import type { Loop } from "@/types/loop";

type Props = {
  locale: "en" | "fr";
  loops: Loop[];
  selectedLoopId: string | null;
  onSelectLoop: (id: string | null) => void;
  onApplied?: (loop: Loop) => void;
  onExit?: () => void;
  plan?: string;
  onUpgrade?: () => void;
  gamificationRefresh?: () => void;
};

export function MasteringPanel({ locale, loops, selectedLoopId, onSelectLoop, onApplied, onExit, plan = "free", onUpgrade, gamificationRefresh }: Props) {
  const isFr = locale === "fr";
  const canApply = canApplyMastering(plan);
  const canExport = canExportMastering(plan);
  const previewOnly = !canApply || !canExport;
  const ensureAudioReady = useLoopsStore((s) => s.ensureAudioReady);
  const replaceLoopAudioRemote = useLoopsStore((s) => s.replaceLoopAudioRemote);

  const [query, setQuery] = useState("");
  const [presetId, setPresetId] = useState<MasterPresetId>("balanced");
  const [compare, setCompare] = useState<"original" | "mastered">("original");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [applying, setApplying] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [masteredUrl, setMasteredUrl] = useState<string | null>(null);
  const [masteredBlob, setMasteredBlob] = useState<Blob | null>(null);
  const [analysisLine, setAnalysisLine] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlsRef = useRef<string[]>([]);

  const playableLoops = useMemo(
    () => loops.filter((l) => !l.id.startsWith("preview-") && !l.id.startsWith("local-")),
    [loops],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return playableLoops.slice(0, 40);
    return playableLoops
      .filter((l) => [l.name, l.genre, l.mood, l.influence].join(" ").toLowerCase().includes(q))
      .slice(0, 40);
  }, [playableLoops, query]);

  const selected = useMemo(
    () => playableLoops.find((l) => l.id === selectedLoopId) ?? filtered[0] ?? null,
    [filtered, playableLoops, selectedLoopId],
  );

  const preset = MASTER_PRESETS[presetId];

  const revokePreviewUrls = useCallback(() => {
    previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    previewUrlsRef.current = [];
  }, []);

  const pauseGlobalPlayer = useCallback(() => {
    const player = usePlayerStore.getState();
    if (player.isPlaying) player.setPlaying(false);
  }, []);

  const stopLocalPreview = useCallback(() => {
    const el = audioRef.current;
    if (!el) {
      setPreviewPlaying(false);
      setPreviewProgress(0);
      return;
    }
    el.pause();
    el.removeAttribute("src");
    el.load();
    setPreviewPlaying(false);
    setPreviewProgress(0);
  }, []);

  useEffect(() => {
    if (!selected && selectedLoopId) onSelectLoop(null);
    if (selected && !selectedLoopId) onSelectLoop(selected.id);
  }, [onSelectLoop, selected, selectedLoopId]);

  useEffect(() => {
    revokePreviewUrls();
    setOriginalUrl(null);
    setMasteredUrl(null);
    setMasteredBlob(null);
    setAnalysisLine(null);
    setCompare("original");
    setPreviewPlaying(false);
    setPreviewProgress(0);
    pauseGlobalPlayer();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [pauseGlobalPlayer, revokePreviewUrls, selected?.id]);

  useEffect(() => {
    if (!selected) return;
    setPresetId(suggestPresetId(selected.genre, selected.mood));
  }, [selected?.genre, selected?.id, selected?.mood]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    void (async () => {
      try {
        const url = selected.audioUrl || (await ensureAudioReady(selected.id));
        if (cancelled) return;
        setOriginalUrl(url);
      } catch {
        if (!cancelled) setOriginalUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureAudioReady, selected]);

  useEffect(() => () => {
    revokePreviewUrls();
    stopLocalPreview();
  }, [revokePreviewUrls, stopLocalPreview]);

  const activePreviewUrl =
    compare === "mastered" && masteredUrl ? masteredUrl : originalUrl;

  const switchCompare = (next: "original" | "mastered") => {
    if (next === "mastered" && !masteredUrl) {
      toast(isFr ? "Lance d’abord le master pour comparer la version studio." : "Run the master first to compare the studio version.");
      return;
    }
    stopLocalPreview();
    setCompare(next);
  };

  const togglePreview = () => {
    const el = audioRef.current;
    if (!el || !activePreviewUrl) return;
    if (previewPlaying) {
      stopLocalPreview();
      return;
    }
    pauseGlobalPlayer();
    el.src = activePreviewUrl;
    void el
      .play()
      .then(() => setPreviewPlaying(true))
      .catch(() => toast.error(isFr ? "Lecture impossible" : "Preview failed"));
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => {
      setPreviewPlaying(false);
      setPreviewProgress(0);
    };
    const onTime = () => {
      if (el.duration > 0) setPreviewProgress(el.currentTime / el.duration);
    };
    el.addEventListener("ended", onEnded);
    el.addEventListener("timeupdate", onTime);
    return () => {
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("timeupdate", onTime);
    };
  }, []);

  useEffect(() => {
    if (!previewPlaying || !audioRef.current || !activePreviewUrl) return;
    pauseGlobalPlayer();
    const el = audioRef.current;
    try {
      const absoluteSrc = new URL(activePreviewUrl, window.location.href).href;
      if (el.src !== absoluteSrc) {
        el.src = activePreviewUrl;
        void el.play().catch(() => setPreviewPlaying(false));
      }
    } catch {
      if (!el.src) {
        el.src = activePreviewUrl;
        void el.play().catch(() => setPreviewPlaying(false));
      }
    }
  }, [activePreviewUrl, pauseGlobalPlayer, previewPlaying]);

  const runMaster = async () => {
    if (!selected) return;
    setProcessing(true);
    setProgress(0.04);
    revokePreviewUrls();
    setMasteredUrl(null);
    setMasteredBlob(null);
    trackClientEvent("mastering_preview_start", { loop_id: selected.id, preset: presetId });
    try {
      const input = await loadMasteringSource(selected.id, selected.audioUrl, ensureAudioReady);
      const output = await masterAudioBuffer(input, preset, setProgress);
      const { blob, url } = audioBufferToBlobUrl(output);
      previewUrlsRef.current.push(url);
      setMasteredBlob(blob);
      setMasteredUrl(url);
      setCompare("mastered");
      stopLocalPreview();
      setAnalysisLine(
        isFr
          ? "Clarté renforcée · punch affiné · prêt pour le streaming"
          : "Enhanced clarity · tighter punch · streaming-ready",
      );
      trackClientEvent("mastering_preview_done", { loop_id: selected.id, preset: presetId, plan, preview_only: previewOnly });
      notifyGamificationMasteringPreview(locale);
      if (previewOnly) {
        toast.success(isFr ? "Aperçu CLEAN — export réservé Pro / Studio 🔒" : "CLEAN preview — export on Pro / Studio 🔒", {
          duration: 4000,
          icon: "✨",
        });
      }
      gamificationRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : isFr ? "Masterisation échouée" : "Mastering failed");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const applyMaster = async () => {
    if (!selected || !masteredBlob) return;
    if (!canApply) {
      toast(isFr ? "Application réservée Pro / Studio" : "Apply is Pro / Studio only", { icon: "🔒" });
      onUpgrade?.();
      return;
    }
    setApplying(true);
    try {
      const updated = await replaceLoopAudioRemote(selected.id, masteredBlob);
      toast.success(isFr ? "Track mise à jour avec le master studio" : "Track updated with studio master");
      trackClientEvent("mastering_apply", { loop_id: selected.id, preset: presetId });
      onApplied?.(updated);
      setOriginalUrl(updated.audioUrl);
      revokePreviewUrls();
      setMasteredUrl(null);
      setMasteredBlob(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : isFr ? "Enregistrement échoué" : "Save failed");
    } finally {
      setApplying(false);
    }
  };

  const downloadMaster = () => {
    if (!masteredBlob || !selected) return;
    if (!canExport) {
      toast(isFr ? "Export WAV réservé Pro / Studio" : "WAV export is Pro / Studio only", { icon: "🔒" });
      onUpgrade?.();
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(masteredBlob);
    a.download = `${selected.name.replace(/[^a-zA-Z0-9\s-]/g, "").trim() || "track"}-master.wav`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-5">
      {onExit ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="secondary" size="sm" onClick={onExit}>
            <ArrowLeft className="h-4 w-4" />
            {isFr ? "Retour à mon espace" : "Back to workspace"}
          </Button>
          <div className="text-xs text-white/45">{isFr ? "Mastering Studio" : "Mastering Studio"}</div>
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.12] via-transparent to-cyan-500/[0.08] p-5">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-5 w-5 text-violet-300" />
              <span className="pk-prism-holo-text">{isFr ? "Mastering Studio" : "Mastering Studio"}</span>
            </div>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
              {isFr
                ? "Le fini pro qui fait la différence : clarté, punch et présence — comme en studio, en quelques secondes."
                : "The pro finish that makes the difference: clarity, punch, and presence — studio-grade in seconds."}
            </p>
          </div>
          <div className="shrink-0 rounded-full border border-violet-300/25 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-100">
            {previewOnly
              ? isFr
                ? "Aperçu gratuit · écoute illimitée"
                : "Free preview · unlimited listen"
              : isFr
                ? "Inclus · illimité"
                : "Included · unlimited"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isFr ? "Trouver une track à sublimer…" : "Find a track to polish…"}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-sm outline-none placeholder:text-white/35 focus:border-violet-400/50"
            />
          </div>
          <div className="max-h-[320px] space-y-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.02] p-2">
            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-white/45">{isFr ? "Aucune track avec audio." : "No tracks with audio."}</div>
            ) : (
              filtered.map((loop) => {
                const active = selected?.id === loop.id;
                return (
                  <button
                    key={loop.id}
                    type="button"
                    onClick={() => onSelectLoop(loop.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      active ? "bg-violet-500/15 ring-1 ring-violet-400/30" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{loop.name}</div>
                      <div className="truncate text-xs text-white/45">
                        {loop.genre} · {loop.bpm} BPM
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          {selected ? (
            <>
              <div>
                <div className="text-sm font-semibold text-white">{selected.name}</div>
                <div className="mt-0.5 text-xs text-white/45">
                  {selected.genre} · {selected.mood} · {selected.bpm} BPM
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/45">
                  {isFr ? "Style studio" : "Studio style"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {MASTER_PRESET_LIST.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPresetId(p.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        presetId === p.id ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {isFr ? p.labelFr : p.labelEn}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-white/45">{isFr ? preset.descriptionFr : preset.descriptionEn}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => switchCompare("original")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    compare === "original" ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                  }`}
                >
                  {isFr ? "Original" : "Original"}
                </button>
                <button
                  type="button"
                  onClick={() => switchCompare("mastered")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    compare === "mastered" ? "pk-prism-pill-active" : masteredUrl ? "bg-white/5 text-white/50 hover:text-white" : "bg-white/5 text-white/35 hover:text-white/55"
                  }`}
                  title={
                    !masteredUrl
                      ? isFr
                        ? "Lance le master pour activer la comparaison studio"
                        : "Run the master to enable studio comparison"
                      : undefined
                  }
                >
                  {isFr ? "Studio" : "Studio"}
                </button>
                <Button variant="secondary" size="sm" disabled={!activePreviewUrl} onClick={togglePreview}>
                  {previewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isFr ? "Écouter" : "Listen"}
                </Button>
              </div>
              {!masteredUrl ? (
                <p className="text-xs text-white/40">
                  {isFr ? "Lance le master pour activer la comparaison A/B studio." : "Run the master to unlock A/B studio comparison."}
                </p>
              ) : null}

              <div className="space-y-2">
                <div className="text-xs font-semibold text-white/45">
                  {compare === "mastered" && masteredUrl
                    ? isFr
                      ? "Version studio — plus dense, plus présente"
                      : "Studio version — denser, more present"
                    : isFr
                      ? "Mix original"
                      : "Original mix"}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
                  <AudioWaveform
                    key={`${selected.id}-${compare}-${masteredUrl ?? originalUrl ?? "none"}`}
                    loopId={selected.id}
                    audioUrl={activePreviewUrl}
                    isPlaying={previewPlaying}
                    progress={previewProgress}
                    height={56}
                    color={compare === "mastered" ? "#67c3ff" : "#9d7cff"}
                    unplayedColor="#2a2a38"
                  />
                </div>
                {analysisLine ? <div className="text-xs text-cyan-200/80">{analysisLine}</div> : null}
                {previewOnly && masteredUrl ? (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
                    {isFr
                      ? "Aperçu gratuit — passe Pro ou Studio pour exporter le WAV et appliquer le master à ta track."
                      : "Free preview — upgrade to Pro or Studio to export WAV and apply the master to your track."}
                    {onUpgrade ? (
                      <button type="button" className="ml-1 underline hover:text-white" onClick={onUpgrade}>
                        {isFr ? "Voir les plans" : "See plans"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {processing ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-white/55">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {isFr ? "Sculpture du son…" : "Sculpting your sound…"} {Math.round(progress * 100)}%
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-violet-400 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm" disabled={processing || !selected} onClick={() => void runMaster()}>
                  <Wand2 className="h-4 w-4" />
                  {isFr ? "Lancer le master" : "Run master"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!masteredBlob || applying}
                  onClick={() => void applyMaster()}
                  title={!canApply ? (isFr ? "Réservé Pro / Studio" : "Pro / Studio only") : undefined}
                >
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : !canApply ? <Lock className="h-4 w-4" /> : null}
                  {isFr ? "Appliquer à la track" : "Apply to track"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!masteredBlob}
                  onClick={downloadMaster}
                  title={!canExport ? (isFr ? "Réservé Pro / Studio" : "Pro / Studio only") : undefined}
                >
                  {!canExport ? <Lock className="h-4 w-4" /> : null}
                  {isFr ? "Exporter WAV" : "Export WAV"}
                </Button>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-white/45">
              {isFr ? "Sélectionne une track à sublimer en studio." : "Select a track to polish in the studio."}
            </div>
          )}
        </div>
      </div>

      <audio ref={audioRef} className="hidden" preload="auto" />
    </div>
  );
}

export async function quickMasterLoopBlob(loop: Loop, presetId: MasterPresetId, ensureAudioReady: (id: string) => Promise<string>): Promise<Blob> {
  const preset = MASTER_PRESETS[presetId];
  const input = await loadMasteringSource(loop.id, loop.audioUrl, ensureAudioReady);
  const output = await masterAudioBuffer(input, preset);
  return encodeWavBlob(output);
}
