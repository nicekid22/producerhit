import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Lock, Pause, Play, Search, Sparkles, Wand2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

import type { AppLocale } from "@/i18n/config";

type Props = {
  locale: AppLocale;
  loops: Loop[];
  selectedLoopId: string | null;
  onSelectLoop: (id: string | null) => void;
  onApplied?: (loop: Loop) => void;
  onExit?: () => void;
  plan?: string;
  onUpgrade?: () => void;
  gamificationRefresh?: () => void;
};

export function MasteringPanel({
  locale,
  loops,
  selectedLoopId,
  onSelectLoop,
  onApplied,
  onExit,
  plan = "free",
  onUpgrade,
  gamificationRefresh,
}: Props) {
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

  useEffect(
    () => () => {
      revokePreviewUrls();
      stopLocalPreview();
    },
    [revokePreviewUrls, stopLocalPreview],
  );

  const activePreviewUrl = compare === "mastered" && masteredUrl ? masteredUrl : originalUrl;

  const switchCompare = (next: "original" | "mastered") => {
    if (next === "mastered" && !masteredUrl) {
      toast(isFr ? "Lance d’abord le master." : "Run the master first.");
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
      trackClientEvent("mastering_preview_done", { loop_id: selected.id, preset: presetId, plan, preview_only: previewOnly });
      notifyGamificationMasteringPreview(locale);
      if (previewOnly) {
        toast.success(isFr ? "Aperçu prêt — export sur Studio / Plus" : "Preview ready — export on Studio / Plus", {
          duration: 3500,
        });
      } else {
        toast.success(isFr ? "Master prêt — écoute la version studio" : "Master ready — listen to the studio version");
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
      toast(isFr ? "Application réservée Studio / Plus" : "Apply is Studio / Plus only", { icon: "🔒" });
      onUpgrade?.();
      return;
    }
    setApplying(true);
    try {
      const updated = await replaceLoopAudioRemote(selected.id, masteredBlob);
      toast.success(isFr ? "Track mise à jour" : "Track updated with master");
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

  const downloadMaster = async () => {
    if (!masteredBlob || !selected) return;
    if (!canExport) {
      toast(isFr ? "Export WAV réservé Studio / Plus" : "WAV export is Studio / Plus only", { icon: "🔒" });
      onUpgrade?.();
      return;
    }
    try {
      const input = await loadMasteringSource(selected.id, selected.audioUrl, ensureAudioReady);
      const output = await masterAudioBuffer(input, preset);
      const blob = encodeWavBlob(output, 24);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${selected.name.replace(/[^a-zA-Z0-9\s-]/g, "").trim() || "track"}-master.wav`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(masteredBlob);
      a.download = `${selected.name.replace(/[^a-zA-Z0-9\s-]/g, "").trim() || "track"}-master.wav`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  return (
    <div className="pk-mastering-studio space-y-4 md:space-y-5">
      {onExit ? (
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-pk-muted transition-colors hover:text-pk-text md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          {isFr ? "Retour" : "Back"}
        </button>
      ) : null}

      <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-pk-border/60 bg-pk-panel/30 p-4 backdrop-blur-sm">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-pk-text md:text-lg">
            <Sparkles className="h-4 w-4 shrink-0 text-pk-accent" aria-hidden />
            Mastering Studio
          </h2>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-pk-muted md:text-sm">
            {isFr
              ? "Clarté, punch et présence — fini pro en quelques secondes, directement dans le navigateur."
              : "Clarity, punch, and presence — pro finish in seconds, right in your browser."}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-pk-border/70 bg-pk-panel/50 px-2.5 py-1 text-[11px] font-semibold text-pk-text/80">
          {previewOnly
            ? isFr
              ? "Aperçu gratuit"
              : "Free preview"
            : isFr
              ? "Inclus · illimité"
              : "Included · unlimited"}
        </span>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="space-y-2">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-pk-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isFr ? "Chercher une track…" : "Search a track…"}
              className="w-full rounded-xl border border-pk-border/70 bg-pk-input/80 py-2 pl-9 pr-3 text-sm text-pk-text outline-none placeholder:text-pk-muted focus:border-pk-accent/50"
            />
          </label>
          <div className="max-h-[220px] space-y-1 overflow-y-auto rounded-xl border border-pk-border/60 bg-pk-panel/20 p-1.5 sm:max-h-[280px]">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-pk-muted">{isFr ? "Aucune track avec audio." : "No tracks with audio."}</p>
            ) : (
              filtered.map((loop) => {
                const active = selected?.id === loop.id;
                return (
                  <button
                    key={loop.id}
                    type="button"
                    onClick={() => onSelectLoop(loop.id)}
                    className={cn(
                      "flex w-full items-center rounded-lg px-3 py-2.5 text-left transition-colors",
                      active ? "bg-pk-accent/15 ring-1 ring-pk-accent/35" : "hover:bg-pk-panel/50",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-pk-text">{loop.name}</div>
                      <div className="truncate text-xs text-pk-muted">
                        {loop.genre} · {loop.bpm} BPM
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-pk-border/60 bg-pk-panel/25 p-4">
          {selected ? (
            <>
              <div>
                <div className="truncate text-sm font-semibold text-pk-text">{selected.name}</div>
                <div className="mt-0.5 text-xs text-pk-muted">
                  {selected.genre} · {selected.bpm} BPM
                </div>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-pk-muted">
                  {isFr ? "Style" : "Style"}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MASTER_PRESET_LIST.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPresetId(p.id)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                        presetId === p.id ? "pk-prism-pill-active" : "bg-pk-panel/60 text-pk-muted hover:text-pk-text",
                      )}
                    >
                      {isFr ? p.labelFr : p.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-full border border-pk-border/60 bg-pk-panel/40 p-0.5">
                  {(["original", "mastered"] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => switchCompare(id)}
                      disabled={id === "mastered" && !masteredUrl}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                        compare === id ? "pk-prism-pill-active" : "text-pk-muted hover:text-pk-text",
                        id === "mastered" && !masteredUrl && compare !== id && "opacity-45",
                      )}
                    >
                      {id === "original" ? (isFr ? "Original" : "Original") : "Studio"}
                    </button>
                  ))}
                </div>
                <Button variant="secondary" size="sm" disabled={!activePreviewUrl} onClick={togglePreview}>
                  {previewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isFr ? "Écouter" : "Listen"}
                </Button>
              </div>

              <div className="rounded-xl border border-pk-border/50 bg-black/15 px-2 py-2">
                <AudioWaveform
                  key={`${selected.id}-${compare}-${masteredUrl ?? originalUrl ?? "none"}`}
                  loopId={selected.id}
                  audioUrl={activePreviewUrl}
                  isPlaying={previewPlaying}
                  progress={previewProgress}
                  height={52}
                  color={compare === "mastered" ? "var(--pk-accent, #67c3ff)" : "#9d7cff"}
                  unplayedColor="rgba(255,255,255,0.12)"
                />
              </div>

              {processing ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-pk-muted">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {isFr ? "Master en cours…" : "Mastering…"} {Math.round(progress * 100)}%
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-pk-border/40">
                    <div className="h-full bg-pk-accent transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={processing || !selected}
                  onClick={() => void runMaster()}
                >
                  <Wand2 className="h-4 w-4" />
                  {isFr ? "Lancer le master" : "Run master"}
                </Button>
                {masteredBlob ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={applying}
                      onClick={() => void applyMaster()}
                    >
                      {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : !canApply ? <Lock className="h-4 w-4" /> : null}
                      {isFr ? "Appliquer" : "Apply"}
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full sm:w-auto" onClick={() => void downloadMaster()}>
                      {!canExport ? <Lock className="h-4 w-4" /> : null}
                      {isFr ? "Export WAV 24-bit" : "Export 24-bit WAV"}
                    </Button>
                  </>
                ) : null}
              </div>

              {previewOnly && masteredUrl ? (
                <p className="text-xs text-pk-muted">
                  {isFr ? "Aperçu gratuit — " : "Free preview — "}
                  {onUpgrade ? (
                    <button type="button" className="underline hover:text-pk-text" onClick={onUpgrade}>
                      {isFr ? "passer Studio / Plus pour exporter" : "upgrade to Studio / Plus to export"}
                    </button>
                  ) : (
                    isFr ? "export sur Studio / Plus" : "export on Studio / Plus"
                  )}
                </p>
              ) : null}
            </>
          ) : (
            <p className="py-10 text-center text-sm text-pk-muted">
              {isFr ? "Choisis une track à masteriser." : "Pick a track to master."}
            </p>
          )}
        </section>
      </div>

      <audio ref={audioRef} className="hidden" preload="auto" />
    </div>
  );
}

export async function quickMasterLoopBlob(
  loop: Loop,
  presetId: MasterPresetId,
  ensureAudioReady: (id: string) => Promise<string>,
): Promise<Blob> {
  const preset = MASTER_PRESETS[presetId];
  const input = await loadMasteringSource(loop.id, loop.audioUrl, ensureAudioReady);
  const output = await masterAudioBuffer(input, preset);
  return encodeWavBlob(output, 24);
}
