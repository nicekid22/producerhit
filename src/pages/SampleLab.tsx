import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { AppShellAsideHeader } from "@/components/AppShellAsideHeader";
import { GenerationCreditIcon } from "@/components/GenerationCreditIcon";
import { PrismPageHero } from "@/components/prism/PrismPageHero";
import { Button } from "@/components/ui/Button";
import { PkIconLoader } from "@/components/ui/PkIconLoader";
import { useAuthStore } from "@/stores/authStore";
import { useLoopsStore } from "@/stores/loopsStore";
import { useLocaleStore } from "@/stores/localeStore";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";
import { readProfileCache } from "@/lib/profileBootstrap";
import { getRemainingBeats } from "@/lib/planLimits";
import { shouldShowPlanUpsell } from "@/lib/growthUpsell";
import { estimateGenerationDurationMs } from "@/lib/aceDuration";
import { generateSampleLabLoop } from "@/lib/sampleLabGenerate";
import {
  SAMPLE_BAR_OPTIONS,
  SAMPLE_FORMATS,
  SAMPLE_GENRES,
  SAMPLE_INSTRUMENTS,
  SAMPLE_KEYS,
  SAMPLE_MOODS,
  SAMPLE_PACK_PRESETS,
  SAMPLE_SCALES,
  compositionInstrumentsForUi,
  isSampleLabEnabled,
  resolveSampleDurationSec,
  resolveSampleFormat,
  resolveSamplePack,
  type SampleBars,
  type SampleFormatId,
  type SampleInstrumentId,
} from "@/lib/sampleLab";
import type { Loop } from "@/types/loop";
import { cn } from "@/lib/utils";
import { Download, Layers, Library as LibraryIcon, Play, Sparkles } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";

export default function SampleLab() {
  if (!isSampleLabEnabled()) {
    return <Navigate to="/dashboard" replace />;
  }
  return <SampleLabContent />;
}

function SampleLabContent() {
  const locale = useLocaleStore((s) => s.locale);
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const openUpsell = useGrowthUpsellStore((s) => s.openUpsell);
  const createLoop = useLoopsStore((s) => s.createLoop);
  const setCurrent = usePlayerStore((s) => s.setCurrent);

  const [plan, setPlan] = useState("free");
  const [usedThisMonth, setUsedThisMonth] = useState(0);
  const [referralBonus, setReferralBonus] = useState(0);
  const [levelBonus, setLevelBonus] = useState(0);
  const [dailyBonusMonth, setDailyBonusMonth] = useState(0);

  const [format, setFormat] = useState<SampleFormatId>("composition");
  const [durationSec, setDurationSec] = useState(90);
  const [instrument, setInstrument] = useState<SampleInstrumentId>("stack");
  const [packPresetId, setPackPresetId] = useState<string | null>("guitar-drip");
  const [genre, setGenre] = useState<string>(SAMPLE_GENRES[0]);
  const [mood, setMood] = useState<string>(SAMPLE_MOODS[1]);
  const [bars, setBars] = useState<SampleBars>(8);
  const [bpm, setBpm] = useState(92);
  const [key, setKey] = useState<string>("A");
  const [scale, setScale] = useState<string>("Minor");

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultMeta, setResultMeta] = useState<Awaited<ReturnType<typeof generateSampleLabLoop>> | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedLoopId, setSavedLoopId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setPlan(profile.plan ?? "free");
    setUsedThisMonth(profile.loops_used_this_month ?? 0);
    setReferralBonus(profile.referral_bonus ?? 0);
    setLevelBonus(profile.level_bonus ?? 0);
    setDailyBonusMonth(profile.daily_bonus_month ?? 0);
  }, [profile]);

  useEffect(() => {
    if (!user?.id) return;
    const cached = readProfileCache(user.id);
    if (!cached) return;
    setPlan(cached.plan);
    setUsedThisMonth(cached.usedThisMonth);
    setReferralBonus(cached.referralBonus);
    setLevelBonus(cached.levelBonus);
    setDailyBonusMonth(cached.dailyBonusMonth);
  }, [user?.id]);

  const remaining = getRemainingBeats(plan, usedThisMonth, referralBonus, levelBonus, dailyBonusMonth);
  const audioFormat = plan === "free" ? "mp3" : "wav";

  const formatDef = resolveSampleFormat(format);
  const uiInstruments = useMemo(() => compositionInstrumentsForUi(), []);

  const packOptions = useMemo(() => {
    let list = SAMPLE_PACK_PRESETS.filter((p) => p.instrument === instrument);
    if (format === "vocal_composition") {
      list = list.filter((p) => p.vocalComposition || p.instrument === "vocal_chops" || p.instrument === "stack");
      if (!list.length) list = SAMPLE_PACK_PRESETS.filter((p) => p.vocalComposition);
    }
    return list;
  }, [format, instrument]);

  useEffect(() => {
    if (format === "vocal_composition") {
      if (instrument !== "vocal_chops" && instrument !== "stack") setInstrument("vocal_chops");
      if (!packPresetId || !SAMPLE_PACK_PRESETS.find((p) => p.id === packPresetId)?.vocalComposition) {
        setPackPresetId("soul-drill-vocals");
        setGenre("Drill");
      }
    }
  }, [format, instrument, packPresetId]);

  useEffect(() => {
    const stillValid = packOptions.some((p) => p.id === packPresetId);
    if (!stillValid) setPackPresetId(packOptions[0]?.id ?? null);
  }, [instrument, packOptions, packPresetId]);

  useEffect(() => {
    if (format !== "mini_loop" && !uiInstruments.some((i) => i.id === instrument)) {
      setInstrument("stack");
    }
  }, [format, instrument, uiInstruments]);

  const t = useCallback((en: string, fr: string) => (isFr ? fr : en), [isFr]);

  const onGenerate = useCallback(async () => {
    if (generating) return;
    if (remaining < 1) {
      if (shouldShowPlanUpsell(plan, "credits_exhausted", { source: "sample_lab", plan, remaining })) {
        openUpsell("credits_exhausted", { source: "sample_lab", plan, remaining });
      } else {
        toast.error(t("No credits remaining.", "Plus de crédits disponibles."));
      }
      return;
    }

    setGenerating(true);
    setProgress(0);
    setResultUrl(null);
    setResultMeta(null);
    setSavedLoopId(null);

    const dur = resolveSampleDurationSec({ format, durationSec, bars, bpm });
    const estMs = estimateGenerationDurationMs("beat", dur);
    const tick = window.setInterval(() => {
      setProgress((p) => Math.min(92, p + 100 / (estMs / 400)));
    }, 400);

    try {
      const out = await generateSampleLabLoop(
        { format, instrument, packPresetId, genre, mood, bars, bpm, key, scale, durationSec },
        { audioFormat, locale },
      );
      setResultUrl(out.audioUrl);
      setResultMeta(out);
      setProgress(100);
      void refreshProfile();
      toast.success(
        t(
          "Composition ready — chop it and add your drums.",
          "Composition prête — choppe et ajoute ta batterie.",
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(t(`Generation failed: ${msg}`, `Échec de génération : ${msg}`));
    } finally {
      window.clearInterval(tick);
      setGenerating(false);
    }
  }, [
    audioFormat,
    bars,
    bpm,
    durationSec,
    format,
    genre,
    generating,
    instrument,
    key,
    locale,
    mood,
    openUpsell,
    packPresetId,
    plan,
    refreshProfile,
    remaining,
    scale,
    t,
  ]);

  const onSave = useCallback(async () => {
    if (!resultUrl || !resultMeta || saving) return;
    setSaving(true);
    try {
      const pack = resolveSamplePack(packPresetId);
      const draft: Omit<Loop, "id" | "createdAt" | "userId"> = {
        engine: "sample-lab",
        name: resultMeta.loopName,
        genre: `Sample · ${genre}`,
        influence: pack?.labelEn ?? instrument,
        key,
        scale,
        bpm,
        loopLength: resultMeta.loopLength,
        swing: 0,
        mood,
        energyLevel: "medium",
        reverb: "dry",
        prompt: resultMeta.caption,
        audioUrl: resultUrl,
        seed: typeof resultMeta.meta?.seed === "number" ? resultMeta.meta.seed : null,
        details: {
          caption: resultMeta.caption,
          bpm: resultMeta.meta?.bpm ?? bpm,
          duration: resultMeta.durationSec,
          keyScale: `${key} ${scale}`,
          audioFormat: resultMeta.meta?.audioFormat ?? audioFormat,
          sampleInstrument: instrument,
          samplePack: packPresetId ?? undefined,
          sampleFormat: resultMeta.format,
        },
        stemsUrl: {
          sampleLab: { phase: 2, format: resultMeta.format, instrument, packId: packPresetId },
          ace: resultMeta.meta
            ? {
                ...(typeof resultMeta.meta.taskId === "string" ? { taskId: resultMeta.meta.taskId } : {}),
                ...(typeof resultMeta.meta.stemsZipUrl === "string" ? { stemsZipUrl: resultMeta.meta.stemsZipUrl } : {}),
              }
            : undefined,
        },
        isSaved: true,
        isPublic: false,
      };
      const loop = await createLoop(draft);
      setSavedLoopId(loop.id);
      toast.success(t("Saved to library.", "Enregistré dans la bibliothèque."));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(t(`Save failed: ${msg}`, `Échec enregistrement : ${msg}`));
    } finally {
      setSaving(false);
    }
  }, [
    audioFormat,
    bpm,
    createLoop,
    genre,
    instrument,
    key,
    mood,
    packPresetId,
    resultMeta,
    resultUrl,
    saving,
    scale,
    t,
  ]);

  const onPlay = useCallback(() => {
    if (!resultUrl || !resultMeta) return;
    const preview: Loop = {
      id: savedLoopId ?? `sample-preview-${Date.now()}`,
      engine: "sample-lab",
      name: resultMeta.loopName,
      audioUrl: resultUrl,
      genre: `Sample · ${genre}`,
      influence: instrument,
      key,
      scale,
      bpm,
      loopLength: resultMeta.loopLength,
      swing: 0,
      mood,
      energyLevel: "medium",
      reverb: "dry",
      prompt: resultMeta.caption,
      isSaved: false,
      isPublic: false,
      createdAt: new Date().toISOString(),
    };
    setCurrent(preview, true);
  }, [bpm, genre, instrument, key, mood, resultMeta, resultUrl, savedLoopId, scale, setCurrent]);

  const onDownload = useCallback(() => {
    if (!resultUrl || !resultMeta) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${resultMeta.loopName.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase()}-producerhit.${audioFormat === "wav" ? "wav" : "mp3"}`;
    a.rel = "noopener";
    a.click();
  }, [audioFormat, resultMeta, resultUrl]);

  const inputClass =
    "mt-1 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm outline-none focus:border-pk-accent";

  return (
    <AppShell
      theme="prism"
      variant="split"
      left={
        <AppShellAsideHeader
          icon={Layers}
          eyebrow={t("PRODUCER SAMPLES", "PRODUCER SAMPLES")}
          title={t("Sample Lab", "Sample Lab")}
          subtitle={t("AI loops & stems for beatmakers", "Boucles & stems IA pour beatmakers")}
        />
      }
    >
      <div className="pk-prism-page flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-4 md:px-6">
          <PrismPageHero
            eyebrow={t("ProducerHit Samples · Beta", "ProducerHit Samples · Bêta")}
            title={t("AI Sample Lab", "AI Sample Lab")}
            description={t(
              "1–2 min melody compositions (no drums) — like Beatstars & ProducerGrind packs. Chop, add your 808, place.",
              "Compositions mélodiques 1–2 min (sans drums) — comme les packs Beatstars & ProducerGrind. Choppe, ajoute ton 808, place.",
            )}
            actions={
              <span className="inline-flex items-center gap-1 rounded-full border border-pk-accent/30 bg-pk-accent/10 px-3 py-1 text-xs font-medium text-pk-accent">
                <span className="tabular-nums">{remaining}</span>
                <GenerationCreditIcon className="h-3 w-3" />
                <span>{t("left", "restants")}</span>
              </span>
            }
          />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <section className="space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-pk-text">{t("Format", "Format")}</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {SAMPLE_FORMATS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setFormat(f.id);
                        if (f.id !== "mini_loop") setDurationSec(f.defaultDurationSec);
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left transition-colors",
                        format === f.id
                          ? "border-pk-accent/50 bg-pk-accent/10 text-pk-text"
                          : "border-white/10 bg-white/[0.03] text-pk-muted hover:border-white/20 hover:text-pk-text",
                      )}
                    >
                      <div className="text-xs font-semibold">{isFr ? f.labelFr : f.labelEn}</div>
                      <div className="mt-1 text-[10px] leading-snug text-pk-muted">
                        {isFr ? f.descriptionFr : f.descriptionEn}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-pk-text">{t("Instrument", "Instrument")}</h2>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(format === "mini_loop" ? SAMPLE_INSTRUMENTS : uiInstruments).map((inst) => (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => setInstrument(inst.id)}
                      className={cn(
                        "rounded-xl border px-3 py-3 text-left transition-colors",
                        instrument === inst.id
                          ? "border-pk-accent/50 bg-pk-accent/10 text-pk-text"
                          : "border-white/10 bg-white/[0.03] text-pk-muted hover:border-white/20 hover:text-pk-text",
                      )}
                    >
                      <span className="text-lg" aria-hidden>
                        {inst.icon}
                      </span>
                      <div className="mt-1 text-xs font-medium">{isFr ? inst.labelFr : inst.labelEn}</div>
                    </button>
                  ))}
                </div>
              </div>

              {packOptions.length > 0 ? (
                <div>
                  <h2 className="text-sm font-semibold text-pk-text">{t("Pack vibe", "Vibe pack")}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {packOptions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPackPresetId(p.id)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          packPresetId === p.id
                            ? "border-pk-accent/50 bg-pk-accent/15 text-pk-accent"
                            : "border-white/10 text-pk-muted hover:text-pk-text",
                        )}
                      >
                        {isFr ? p.labelFr : p.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-medium text-pk-muted">{t("Genre", "Genre")}</span>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className={inputClass}
                  >
                    {SAMPLE_GENRES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-pk-muted">{t("Mood", "Ambiance")}</span>
                  <select value={mood} onChange={(e) => setMood(e.target.value)} className={inputClass}>
                    {SAMPLE_MOODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {format !== "mini_loop" ? (
                <div>
                  <span className="text-xs font-medium text-pk-muted">{t("Duration", "Durée")}</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formatDef.durationOptions.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setDurationSec(sec)}
                        className={cn(
                          "min-w-[3rem] rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          durationSec === sec
                            ? "border-pk-accent/50 bg-pk-accent/10 text-pk-accent"
                            : "border-white/10 text-pk-muted hover:text-pk-text",
                        )}
                      >
                        {sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : `${sec}s`}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-pk-muted">
                    {t(
                      "Arranged sections (intro → chorus → bridge). No drums — you add the beat.",
                      "Sections arrangées (intro → refrain → bridge). Sans drums — tu poses le beat.",
                    )}
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-medium text-pk-muted">{t("Length", "Longueur")}</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SAMPLE_BAR_OPTIONS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBars(b)}
                        className={cn(
                          "min-w-[3rem] rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          bars === b
                            ? "border-pk-accent/50 bg-pk-accent/10 text-pk-accent"
                            : "border-white/10 text-pk-muted hover:text-pk-text",
                        )}
                      >
                        {b} {t("bars", "mesures")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-medium text-pk-muted">BPM</span>
                  <input
                    type="number"
                    min={60}
                    max={200}
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value) || 90)}
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-pk-muted">{t("Key", "Tonalité")}</span>
                  <select value={key} onChange={(e) => setKey(e.target.value)} className={inputClass}>
                    {SAMPLE_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-pk-muted">{t("Scale", "Mode")}</span>
                  <select value={scale} onChange={(e) => setScale(e.target.value)} className={inputClass}>
                    {SAMPLE_SCALES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <Button
                type="button"
                variant="primary"
                className="w-full sm:w-auto"
                disabled={generating || remaining < 1}
                onClick={() => void onGenerate()}
              >
                {generating ? (
                  <span className="inline-flex items-center gap-2">
                    <PkIconLoader size="xs" inline />
                    {t("Generating…", "Génération…")} {Math.round(progress)}%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {format === "mini_loop"
                      ? t("Generate loop", "Générer la loop")
                      : t("Generate composition", "Générer la composition")}
                  </span>
                )}
              </Button>
            </section>

            <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-pk-text">
                <Layers className="h-4 w-4 text-pk-accent" />
                {t("Result", "Résultat")}
              </h2>
              {generating ? (
                <div className="mt-8 flex flex-col items-center gap-3 text-pk-muted">
                  <PkIconLoader icon="generator" size="md" />
                  <p className="text-center text-xs">
                    {format === "mini_loop"
                      ? t("Generating mini loop…", "Génération mini loop…")
                      : t("Building arranged composition (no drums)…", "Construction composition arrangée (sans drums)…")}
                  </p>
                </div>
              ) : resultUrl && resultMeta ? (
                <div className="mt-4 space-y-4">
                  <p className="font-medium text-pk-text">{resultMeta.loopName}</p>
                  <p className="text-xs text-pk-muted">
                    ~{resultMeta.durationSec}s · {bars} {t("bars", "mesures")} · {bpm} BPM
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={onPlay}>
                      <Play className="h-4 w-4" />
                      {t("Play", "Écouter")}
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={onDownload}>
                      <Download className="h-4 w-4" />
                      {audioFormat.toUpperCase()}
                    </Button>
                  </div>
                  <Button type="button" variant="primary" className="w-full" disabled={saving} onClick={() => void onSave()}>
                    <LibraryIcon className="h-4 w-4" />
                    {savedLoopId ? t("Saved", "Enregistré") : saving ? t("Saving…", "Enregistrement…") : t("Save to library", "Bibliothèque")}
                  </Button>
                  {savedLoopId ? (
                    <Link to="/library" className="block text-center text-xs text-pk-accent hover:underline">
                      {t("Open library", "Ouvrir la bibliothèque")}
                    </Link>
                  ) : null}
                  {resultMeta.meta?.stemsZipUrl ? (
                    <a
                      href={String(resultMeta.meta.stemsZipUrl)}
                      className="block text-center text-xs text-pk-muted hover:text-pk-accent"
                      download
                      rel="noopener noreferrer"
                    >
                      {t("Download stems.zip", "Télécharger stems.zip")}
                    </a>
                  ) : (
                    <p className="text-center text-[10px] text-pk-muted">
                      {t("Stems export — coming with ACE XL Base pipeline", "Export stems — pipeline ACE XL Base à venir")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-6 text-sm text-pk-muted">
                  {t(
                    "Choose a pack vibe and generate a 1–2 min melody composition — then chop and add your drums.",
                    "Choisis un vibe pack et génère une composition 1–2 min — puis choppe et ajoute tes drums.",
                  )}
                </p>
              )}
            </aside>
          </div>

          <p className="mt-10 max-w-2xl text-xs text-pk-muted">
            {t(
              "Market fit: Beatstars / ProducerGrind-style compositions · Next: stems per layer, MIDI, Soul Drill packs on Le Flux.",
              "Aligné marché Beatstars / ProducerGrind · Suite : stems par couche, MIDI, packs Soul Drill sur Le Flux.",
            )}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
