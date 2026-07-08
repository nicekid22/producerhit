import type { AppLocale } from "@/i18n/config";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Loader2, Lock, Pause, Play, Search, Sparkles, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
import toast from "react-hot-toast";

type Props = {
  open: boolean;
  loop: Loop | null;
  onClose: () => void;
  onApplied?: (loop: Loop) => void;
  onUpgrade?: () => void;
  locale: AppLocale;
  plan?: string;
};

export function MasteringModal({ open, loop, onClose, onApplied, onUpgrade, locale, plan = "free" }: Props) {
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
    if (!open || !loop) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, loop?.id, onClose]);

  useEffect(() => {
    if (!open) return;
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
  }, [open, loop?.id, pauseGlobalPlayer, revokePreviewUrls]);

  useEffect(() => {
    if (!loop) return;
    setPresetId(suggestPresetId(loop.genre, loop.mood));
  }, [loop?.genre, loop?.id, loop?.mood]);

  useEffect(() => {
    if (!open || !loop) return;
    let cancelled = false;
    void (async () => {
      try {
        const url = await ensureAudioReady(loop.id);
        if (!cancelled) setOriginalUrl(url);
      } catch {
        if (!cancelled) setOriginalUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensureAudioReady, loop?.id, open]);

  useEffect(() => {
    return () => {
      revokePreviewUrls();
      stopLocalPreview();
    };
  }, [revokePreviewUrls, stopLocalPreview]);

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
    void el.play().then(() => setPreviewPlaying(true)).catch(() => toast.error(isFr ? "Lecture impossible" : "Preview failed"));
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
    if (!loop) return;
    setProcessing(true);
    setProgress(0.04);
    revokePreviewUrls();
    setMasteredUrl(null);
    setMasteredBlob(null);
    trackClientEvent("mastering_preview_start", { loop_id: loop.id, preset: presetId });
    try {
      const input = await loadMasteringSource(loop.id, loop.audioUrl, ensureAudioReady);
      const output = await masterAudioBuffer(input, presetId, setProgress);
      const { blob, url } = audioBufferToBlobUrl(output);
      previewUrlsRef.current.push(url);
      setMasteredBlob(blob);
      setMasteredUrl(url);
      setCompare("mastered");
      stopLocalPreview();
      trackClientEvent("mastering_preview_done", { loop_id: loop.id, preset: presetId, preview_only: previewOnly });
      notifyGamificationMasteringPreview(locale);
      if (previewOnly) {
        toast.success(isFr ? "Aperçu prêt — export sur Studio / Plus" : "Preview ready — export on Studio / Plus", { duration: 3500 });
      } else {
        toast.success(isFr ? "Master prêt — écoute la version studio" : "Master ready — listen to the studio version");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : isFr ? "Masterisation échouée" : "Mastering failed");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  const applyMaster = async () => {
    if (!loop || !masteredBlob) return;
    if (!canApply) {
      toast(isFr ? "Application réservée Studio / Plus" : "Apply is Studio / Plus only", { icon: "🔒" });
      onUpgrade?.();
      return;
    }
    setApplying(true);
    try {
      const updated = await replaceLoopAudioRemote(loop.id, masteredBlob);
      toast.success(isFr ? "Track mise à jour" : "Track updated with master");
      trackClientEvent("mastering_apply", { loop_id: loop.id, preset: presetId });
      onApplied?.(updated);
      setOriginalUrl(updated.audioUrl);
      revokePreviewUrls();
      setMasteredUrl(null);
      setMasteredBlob(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : isFr ? "Enregistrement échouée" : "Save failed");
    } finally {
      setApplying(false);
    }
  };

  const downloadMaster = async () => {
    if (!masteredBlob || !loop) return;
    if (!canExport) {
      toast(isFr ? "Export WAV réservé Studio / Plus" : "WAV export is Studio / Plus only", { icon: "🔒" });
      onUpgrade?.();
      return;
    }
    try {
      const input = await loadMasteringSource(loop.id, loop.audioUrl, ensureAudioReady);
      const output = await masterAudioBuffer(input, presetId);
      const blob = encodeWavBlob(output, 24);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${loop.name.replace(/[^a-zA-Z0-9\s-]/g, "").trim() || "track"}-master.wav`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(masteredBlob);
      a.download = `${loop.name.replace(/[^a-zA-Z0-9\s-]/g, "").trim() || "track"}-master.wav`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center" role="dialog" aria-modal="true" aria-label={isFr ? "Mastering" : "Mastering"}>
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-label={isFr ? "Fermer" : "Close"} />
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-pk-panel p-4 shadow-2xl md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-pk-text">
            <Sparkles className="h-5 w-5 text-pk-accent" />
            <span className="text-sm font-semibold">{isFr ? "Mastering Studio" : "Mastering Studio"}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={isFr ? "Fermer" : "Close"}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!loop ? (
          <p className="mt-8 text-center text-sm text-pk-muted">{isFr ? "Choisis une track à masteriser." : "Pick a track to master."}</p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-pk-border/60 bg-pk-panel/30 p-3">
              <div className="truncate text-sm font-semibold text-pk-text">{loop.name}</div>
              <div className="mt-0.5 text-xs text-pk-muted">{loop.genre} · {loop.bpm} BPM</div>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-pk-muted">{isFr ? "Style" : "Style"}</div>
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
                key={`${loop.id}-${compare}-${masteredUrl ?? originalUrl ?? "none"}`}
                loopId={loop.id}
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
              <Button variant="primary" size="sm" className="w-full sm:w-auto" disabled={processing || !loop} onClick={() => void runMaster()}>
                <Wand2 className="h-4 w-4" />
                {isFr ? "Lancer le master" : "Run master"}
              </Button>
              {masteredBlob ? (
                <>
                  <Button variant="secondary" size="sm" className="w-full sm:w-auto" disabled={applying} onClick={() => void applyMaster()}>
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
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

