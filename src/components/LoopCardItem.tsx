import { memo, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import toast from "react-hot-toast";
import {
  coverImageKeyFromLoop,
  displayCoverUrl,
  isPersistedStorageCoverUrl,
  needsPinterestCover,
  resolveLoopDisplayCoverUrl,
} from "@/lib/coverArt";
import { useLazyPinterestCover } from "@/hooks/useLazyPinterestCover";
import { StoredLoopCover } from "@/components/cover/StoredLoopCover";
import { CoverMedia } from "@/components/CoverMedia";
import { buildCoverPromptSnapshot, cn, COVER_SURFACE_CLASS } from "@/lib/utils";
import { displayProducerInfluence } from "@/lib/beatInfluence";
import { loopCardClass, loopCoverClass, loopPlayButtonClass, loopPublicButtonClass, loopToggleButtonClass, getLoopCardFooterHint } from "@/lib/loopCardUi";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShareMomentModal } from "@/components/growth/ShareMomentModal";
import { AudioWaveform } from "@/components/WaveformVisualizer";
import { useLoopsStore } from "@/stores/loopsStore";
import { unlockAudioPlaybackFromGesture } from "@/lib/audioPlaybackUnlock";
import { resolvePlaybackUrlForLoop } from "@/stores/loopsStore";
import { playLoopInContext, usePlayerStore } from "@/stores/playerStore";
import { useLocaleStore } from "@/stores/localeStore";
import type { Loop } from "@/types/loop";
import { prepareLoopVariantGeneration, variantResultTitle } from "@/lib/loopVariantGeneration";
import { extractLoopVocalLanguage, formatVocalLanguageLabel, isSongLoop } from "@/lib/vocalLanguages";
import { resolveLoopVoiceCloneInfo, voiceCloneStatusLabel } from "@/lib/voiceCloneMeta";
import { resolveStemsDownloadUrl } from "@/lib/stemsDownload";
import { canDownloadStems, hasCommercialUseRights } from "@/lib/planEntitlements";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";
import { GenerationCreditAmount } from "@/components/GenerationCreditIcon";
import { rerollLoopCover, LOOP_COVER_REROLL_CREDIT_COST } from "@/lib/loopCoverReroll";
import { PINTEREST_PERSIST_COVERS } from "@/lib/featureFlags";
import {
  Bookmark,
  Check,
  Download,
  Globe,
  Info,
  Languages,
  Layers,
  Loader2,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  RefreshCcw,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export const LoopCardItem = memo(function LoopCardItem({
  loop,
  onDelete,
  onOpenDetails,
  onGenerationUsed,
  onCoverRerollUsed,
  creditsRemaining,
  onNeedCredits,
  onStartWorkspaceJob,
  compact = false,
  cardVariant = "default",
  slotIndex = 0,
  queueLoops,
  queueSource = "workspace",
  onOpenMaster,
}: {
  loop: Loop;
  onDelete?: () => void;
  onOpenDetails?: (loop: Loop, anchorTop: number) => void;
  onGenerationUsed?: () => void;
  /** Appelé après reroll cover réussi (1 crédit). */
  onCoverRerollUsed?: () => void;
  creditsRemaining?: number;
  onNeedCredits?: () => void;
  onStartWorkspaceJob?: (title: string, sub: string) => (() => void) | void;
  compact?: boolean;
  /** Carte bibliothèque — cover large, grille premium */
  cardVariant?: "default" | "library";
  slotIndex?: number;
  queueLoops?: Loop[];
  queueSource?: string;
  onOpenMaster?: (loop: Loop) => void;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const plan = (() => {
    try {
      const raw = window.localStorage.getItem("producerhit_plan");
      return raw === "pro" || raw === "studio" || raw === "plus" || raw === "free" ? raw : "free";
    } catch {
      return "free";
    }
  })();
  const active = usePlayerStore((s) => s.current?.id === loop.id);
  const activePlaying = usePlayerStore((s) => s.current?.id === loop.id && s.isPlaying);
  const progress = usePlayerStore((s) => (s.current?.id === loop.id ? s.progress : 0));
  const currentTimeSec = usePlayerStore((s) => (s.current?.id === loop.id ? s.currentTimeSec : 0));
  const requestSeek = usePlayerStore((s) => s.requestSeek);
  const setPlaying = usePlayerStore((s) => s.setPlaying);
  const markPausedPlayback = usePlayerStore((s) => s.markPausedPlayback);

  const startPlayback = useCallback(
    (target: Loop, autoPlay = true) => {
      playLoopInContext(target, queueLoops, autoPlay, queueSource);
    },
    [queueLoops, queueSource],
  );

  const toggleSavedRemote = useLoopsStore((s) => s.toggleSavedRemote);
  const togglePublicRemote = useLoopsStore((s) => s.togglePublicRemote);
  const loops = useLoopsStore((s) => s.loops);
  const renameLoopRemote = useLoopsStore((s) => s.renameLoopRemote);
  const applyLoopCoverUrl = useLoopsStore((s) => s.applyLoopCoverUrl);
  const createLoop = useLoopsStore((s) => s.createLoop);
  const upsertLoop = useLoopsStore((s) => s.upsertLoop);
  const enqueuePendingSave = useLoopsStore((s) => s.enqueuePendingSave);
  const ensureAudioReady = useLoopsStore((s) => s.ensureAudioReady);
  const cachedDurationSec = useLoopsStore((s) => s.durationsSecById[loop.id] ?? 0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingStems, setIsDownloadingStems] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(loop.name);
  const [savingTitle, setSavingTitle] = useState(false);
  const [isVarying, setIsVarying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRerollingCover, setIsRerollingCover] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const user = useAuthStore((s) => s.user);
  const coverUrlRaw = useMemo(
    () => resolveLoopDisplayCoverUrl(loop),
    [loop.details?.coverPrompt, loop.details?.coverUrl, loop.details?.coverKind, loop.genre, loop.id, loop.influence, loop.mood, loop.seed],
  );
  const coverUrl = useMemo(
    () => displayCoverUrl(coverUrlRaw, loop.details?.coverRevision),
    [coverUrlRaw, loop.details?.coverRevision],
  );
  const coverKey = useMemo(
    () => coverImageKeyFromLoop(loop),
    [
      loop.details?.coverPrompt,
      loop.details?.coverUrl,
      loop.details?.coverKind,
      loop.details?.coverRevision,
      loop.genre,
      loop.id,
      loop.influence,
      loop.mood,
      loop.seed,
    ],
  );

  const needsLazyCover = needsPinterestCover(loop) || !coverUrl.startsWith("http");
  const { ref: coverLazyRef, url: lazyCoverUrl } = useLazyPinterestCover(
    {
      id: loop.id,
      genre: loop.genre,
      mood: loop.mood,
      name: loop.name,
      prompt: loop.details?.coverPrompt,
    },
    slotIndex,
    needsLazyCover,
    "320px",
    "workspace",
  );
  const bannerCoverUrl =
    coverUrl.startsWith("http") ? coverUrl : lazyCoverUrl?.startsWith("http") ? lazyCoverUrl : "";

  const isLibraryCard = cardVariant === "library";
  const showWorkspaceCoverPeek = isLibraryCard || !compact;
  const shareLoop = useMemo(() => loops.find((l) => l.id === loop.id) ?? loop, [loop, loops]);
  const isOwnLoop = Boolean(user?.id && loop.userId === user.id);
  const canRerollCover =
    PINTEREST_PERSIST_COVERS && isOwnLoop && !loop.id.startsWith("local-") && !loop.id.startsWith("preview-");

  const handleRerollCover = useCallback(() => {
    if (!canRerollCover || isRerollingCover) return;
    const remaining = creditsRemaining ?? LOOP_COVER_REROLL_CREDIT_COST;
    if (remaining < LOOP_COVER_REROLL_CREDIT_COST) {
      onNeedCredits?.();
      return;
    }
    void (async () => {
      setIsRerollingCover(true);
      try {
        const latest = useLoopsStore.getState().loops.find((l) => l.id === loop.id) ?? loop;
        const prevDisplay = resolveLoopDisplayCoverUrl(latest);
        const pin = await rerollLoopCover(latest);
        if (pin.skipped) {
          toast.error(
            locale === "fr"
              ? "Aucune autre image disponible — réessaie plus tard"
              : "No other image available — try again later",
          );
          return;
        }
        if (pin.coverUrl?.startsWith("http")) {
          applyLoopCoverUrl(loop.id, pin.coverUrl, pin.coverKind ?? "image", { bumpRevision: true });
          onCoverRerollUsed?.();
          const changed = pin.coverUrl.split("?")[0] !== prevDisplay.split("?")[0];
          toast.success(
            locale === "fr"
              ? changed
                ? "Nouvelle image appliquée"
                : "Image mise à jour"
              : changed
                ? "New cover applied"
                : "Cover refreshed",
          );
        } else {
          toast.error(locale === "fr" ? "Impossible de charger une nouvelle image" : "Could not load a new image");
        }
      } catch (err) {
        const code = err instanceof Error ? err.message : "";
        if (code === "no_credits") {
          onNeedCredits?.();
          return;
        }
        if (code === "pinterest_all_used") {
          toast.error(
            locale === "fr"
              ? "Plus d’images uniques pour ce style — réessaie plus tard"
              : "No unique images left for this style — try again later",
          );
          return;
        }
        toast.error(locale === "fr" ? "Échec du changement d’image" : "Cover change failed");
      } finally {
        setIsRerollingCover(false);
      }
    })();
  }, [
    applyLoopCoverUrl,
    canRerollCover,
    creditsRemaining,
    isRerollingCover,
    locale,
    loop,
    onCoverRerollUsed,
    onNeedCredits,
  ]);

  const canPlay = Boolean(loop.audioUrl);
  const totalLabel = cachedDurationSec > 0 ? formatTime(cachedDurationSec) : "—";
  const durationLabel = active ? formatTime(currentTimeSec) : totalLabel;
  const stemsDownloadUrl = resolveStemsDownloadUrl(loop.stemsUrl);

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
        const generationKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `var-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const { inputParams, generateOptions, variantPrompt, nextSeed, engine, isSongLike } = prepareLoopVariantGeneration(loop, kind);
        const parentVocalLang = extractLoopVocalLanguage(loop) ?? "en";
        const { generateBeat } = await import("@/lib/audioApi");
        const result = await generateBeat(inputParams, engine, { ...generateOptions, generationKey });

        audioUrl = result.audioUrl;
        const draft: Omit<Loop, "id" | "createdAt" | "userId"> = {
          engine: result.engine,
          name: variantResultTitle(loop, kind),
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
                coverPrompt: buildCoverPromptSnapshot({
                  prompt: variantPrompt,
                  genre: loop.genre,
                  mood: loop.mood,
                  influence: loop.influence,
                }),
              }
            : loop.details
              ? { ...loop.details }
              : null,
          stemsUrl: result.meta?.taskId
            ? ({
                ace: {
                  taskId: result.meta.taskId,
                  ...(typeof result.meta.stemsZipUrl === "string" && result.meta.stemsZipUrl.trim().length > 0
                    ? { stemsZipUrl: result.meta.stemsZipUrl.trim() }
                    : {}),
                  isSong: isSongLike,
                  ...(isSongLike ? { vocalLanguage: parentVocalLang } : {}),
                },
              } as Record<string, unknown>)
            : null,
          isSaved: false,
          isPublic: true,
        };

        try {
          const created = await createLoop(draft);
          startPlayback(created, true);
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
            startPlayback(temp, true);
            toast.error(locale === "fr" ? `Généré, mais l’enregistrement a échoué : ${message}` : `Generated, but saving failed: ${message}`);
            onGenerationUsed?.();
          } else {
            throw err;
          }
        }
      } catch (err) {
        const anyErr = err as unknown as { limitReached?: boolean };
        if (anyErr?.limitReached) {
          useGrowthUpsellStore.getState().openUpsell("limit_reached", { source: "loop_card_variation" });
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

  const handlePlayToggle = useCallback(
    (e?: ReactMouseEvent) => {
      e?.stopPropagation();
      unlockAudioPlaybackFromGesture();
      void (async () => {
        if (active) {
          if (activePlaying) markPausedPlayback();
          setPlaying(!activePlaying);
          return;
        }
        let url = "";
        try {
          const raw = typeof loop.audioUrl === "string" ? loop.audioUrl.trim() : "";
          url = raw ? await resolvePlaybackUrlForLoop(loop.id, raw) : await ensureAudioReady(loop.id);
        } catch {
          url = "";
        }
        if (!url) {
          toast.error(
            locale === "fr" ? "Audio indisponible — réessaie dans un instant" : "Audio unavailable — try again in a moment",
          );
          return;
        }
        const fresh = useLoopsStore.getState().loops.find((l) => l.id === loop.id) ?? loop;
        startPlayback({ ...fresh, audioUrl: url }, true);
      })();
    },
    [active, activePlaying, ensureAudioReady, locale, loop, markPausedPlayback, setPlaying, startPlayback],
  );

  const handleDownloadBeat = useCallback(() => {
    void (async () => {
      if (!loop.audioUrl || isDownloading) return;
      if (!hasCommercialUseRights(plan)) {
        useGrowthUpsellStore.getState().openUpsell("feature_commercial_download", {
          source: "loop_card_download",
          plan,
        });
        return;
      }
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
        const cleanName = loop.name.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase();
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
  }, [isDownloading, loop.audioUrl, loop.details?.audioFormat, loop.name, plan]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const songCard = isSongLoop(loop);
  const vocalLangCode = songCard ? extractLoopVocalLanguage(loop) : null;
  const vocalLangLabel = vocalLangCode ? formatVocalLanguageLabel(vocalLangCode, locale) : null;
  const voiceCloneInfo = songCard ? resolveLoopVoiceCloneInfo(loop) : null;
  const voiceCloneLabel = voiceCloneInfo ? voiceCloneStatusLabel(voiceCloneInfo, locale === "fr") : null;
  const footerHint = getLoopCardFooterHint(loop, locale);
  const producerInfluence = displayProducerInfluence(loop.influence);

  const libraryMenu = (
    <>
      <button
        type="button"
        className="pk-library-card__menu-item"
        disabled={!loop.audioUrl || isDownloading}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(false);
          handleDownloadBeat();
        }}
      >
        {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {locale === "fr" ? "Télécharger" : "Download"}
      </button>
      {stemsDownloadUrl ? (
        <button
          type="button"
          className="pk-library-card__menu-item"
          disabled={isDownloadingStems}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
            if (!canDownloadStems(plan)) {
              useGrowthUpsellStore.getState().openUpsell("feature_stems", { source: "loop_card_stems", plan });
              return;
            }
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
        >
          {isDownloadingStems ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
          Stems
        </button>
      ) : null}
      {canRerollCover ? (
        <button
          type="button"
          className="pk-library-card__menu-item"
          disabled={isRerollingCover}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
            handleRerollCover();
          }}
        >
          {isRerollingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
          {locale === "fr" ? "Autre image" : "New inspo"}
        </button>
      ) : null}
      <button
        type="button"
        className="pk-library-card__menu-item"
        disabled={isVarying}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(false);
          runVariant("variation");
        }}
      >
        <RefreshCcw className="h-3.5 w-3.5" />
        Variation
      </button>
      <button
        type="button"
        className="pk-library-card__menu-item"
        disabled={isVarying}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(false);
          runVariant("remix");
        }}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Remix
      </button>
      {onOpenMaster ? (
        <button
          type="button"
          className="pk-library-card__menu-item"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
            onOpenMaster(loop);
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Mastering
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          className="pk-library-card__menu-item pk-library-card__menu-item--danger"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {locale === "fr" ? "Supprimer" : "Delete"}
        </button>
      ) : null}
    </>
  );

  if (isLibraryCard) {
    return (
      <div
        data-loop-card
        ref={(node) => {
          cardRef.current = node;
          coverLazyRef.current = node;
        }}
        className={cn("pk-library-card group", loopCardClass(active, activePlaying))}
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
        <div className={cn("pk-library-card__cover-wrap", loopCoverClass(active, activePlaying))}>
          <StoredLoopCover
            key={`${coverKey}:${bannerCoverUrl}`}
            coverUrl={bannerCoverUrl}
            className="pk-library-card__cover"
            loading="lazy"
          />
          <div className="pk-library-card__shade" aria-hidden />
          <span className="pk-library-card__genre">{loop.genre}</span>
          {producerInfluence ? (
            <span className="pk-library-card__influence" title={producerInfluence}>
              {producerInfluence}
            </span>
          ) : null}
          {footerHint ? (
            <span
              className={cn(
                "pk-library-card__hint",
                footerHint.variant === "public" && "pk-library-card__hint--public",
                footerHint.variant === "stems" && "pk-library-card__hint--stems",
              )}
            >
              {footerHint.label}
            </span>
          ) : null}
          <button
            type="button"
            className={cn("pk-library-card__play", loopPlayButtonClass(active, activePlaying))}
            onClick={handlePlayToggle}
            aria-label={activePlaying ? "Pause" : "Play"}
            title={activePlaying ? "Pause" : "Play"}
            disabled={!canPlay}
          >
            {activePlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
        </div>

        <div className="pk-library-card__body">
          <h3 className="pk-library-card__title">{loop.name}</h3>
          <p className="pk-library-card__meta">
            {[
              loop.bpm && loop.bpm > 0 ? `${loop.bpm} BPM` : null,
              loop.key || loop.scale ? `${loop.key} ${loop.scale}`.trim() : null,
              songCard && vocalLangLabel ? vocalLangLabel : loop.mood || null,
              durationLabel,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {active ? (
            <div className="pk-library-card__progress" aria-hidden>
              <div className="pk-library-card__progress-fill" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
            </div>
          ) : null}

          <div className="pk-library-card__toolbar" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={cn("pk-library-card__icon-btn", loop.isSaved && "pk-library-card__icon-btn--on")}
              onClick={() => {
                void toggleSavedRemote(loop.id)
                  .then((next) => toast.success(next ? "Sauvegardé" : "Retiré de la bibliothèque"))
                  .catch((err) => toast.error(err instanceof Error ? err.message : "Erreur"));
              }}
              title={loop.isSaved ? (locale === "fr" ? "Retirer" : "Unsave") : "Save"}
              aria-pressed={loop.isSaved}
            >
              <Bookmark className={cn("h-4 w-4", loop.isSaved && "fill-current")} />
            </button>
            <button
              type="button"
              className={cn("pk-library-card__icon-btn", loop.isPublic && "pk-library-card__icon-btn--public")}
              onClick={() => {
                void togglePublicRemote(loop.id)
                  .then((next) => toast.success(next ? "Public" : "Private"))
                  .catch((err) => toast.error(err instanceof Error ? err.message : "Erreur"));
              }}
              title={loop.isPublic ? (locale === "fr" ? "Passer privé" : "Make private") : locale === "fr" ? "Rendre public" : "Make public"}
              aria-pressed={loop.isPublic}
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="pk-library-card__icon-btn"
              onClick={() => setShareOpen(true)}
              title={locale === "fr" ? "Partager" : "Share"}
            >
              <Share2 className="h-4 w-4" />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="pk-library-card__icon-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={locale === "fr" ? "Plus d'actions" : "More actions"}
                aria-expanded={menuOpen}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen ? (
                <div className="pk-library-card__menu">{libraryMenu}</div>
              ) : null}
            </div>
          </div>
        </div>

        <ShareMomentModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          loop={shareLoop}
          locale={locale}
          plan={plan}
          onMakePublic={
            !shareLoop.isPublic
              ? () => {
                  void (async () => {
                    try {
                      await togglePublicRemote(shareLoop.id);
                      toast.success(locale === "fr" ? "Track publique — lien actif" : "Track public — link live");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : locale === "fr" ? "Erreur" : "Error");
                    }
                  })();
                }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div
      data-loop-card
      ref={(node) => {
        cardRef.current = node;
        coverLazyRef.current = node;
      }}
      className={cn(
        "relative rounded-pk border border-pk-border bg-pk-panel p-4",
        isLibraryCard ? "pk-loop-card--library" : "",
        onOpenDetails ? "pr-14" : "",
        loopCardClass(active, activePlaying),
      )}
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
      {onOpenDetails ? (
        <button
          type="button"
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-pk text-pk-muted transition-colors hover:bg-white/5 hover:text-pk-text"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(loop, computeAnchorTop());
          }}
          aria-label={locale === "fr" ? "Infos" : "Details"}
          title={locale === "fr" ? "Infos" : "Details"}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      ) : null}
      {showWorkspaceCoverPeek ? (
        <div
          className={cn(
            "pk-loop-cover-banner mb-2 rounded-xl p-[2px]",
            loopCoverClass(active, activePlaying),
          )}
        >
          <StoredLoopCover
            key={`${coverKey}:${bannerCoverUrl}`}
            coverUrl={bannerCoverUrl}
            className={cn(
              "w-full rounded-[10px]",
              isLibraryCard ? "pk-loop-card--library-cover aspect-[5/4] min-h-[9.5rem]" : "h-32",
            )}
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="flex gap-3">
        {!showWorkspaceCoverPeek ? (
          <div
            className={cn(
              "relative h-12 w-12 shrink-0 rounded-pk p-[2px] pk-loop-cover-thumb",
              loopCoverClass(active, activePlaying),
            )}
          >
            <div className={cn("relative h-full w-full overflow-hidden rounded-[6px]", COVER_SURFACE_CLASS)}>
              <CoverMedia
                loop={loop}
                coverUrl={bannerCoverUrl || coverUrl}
                coverKey={`${coverKey}:${bannerCoverUrl}`}
                onImageError={(e) => {
                  const img = e.currentTarget;
                  img.style.opacity = "0";
                  const retry = Number(img.dataset.retry ?? "0");
                  if (retry < 4) {
                    img.dataset.retry = String(retry + 1);
                    const url = coverUrl;
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
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
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
            {showWorkspaceCoverPeek && canRerollCover && !isEditingTitle ? (
              <button
                type="button"
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5",
                  "text-[10px] font-medium tracking-wide text-pk-muted backdrop-blur-sm",
                  "transition-colors hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-pk-text",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pk-accent/80",
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
                disabled={isRerollingCover}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRerollCover();
                }}
                aria-label={
                  locale === "fr"
                    ? `Changer la cover (${LOOP_COVER_REROLL_CREDIT_COST} crédit)`
                    : `Change cover (${LOOP_COVER_REROLL_CREDIT_COST} credit)`
                }
              >
                {isRerollingCover ? (
                  <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <RefreshCcw className="h-3 w-3 shrink-0 opacity-75" aria-hidden />
                )}
                <span className="inline-flex items-center gap-1 max-[380px]:hidden">
                  <span>{locale === "fr" ? "Autre image" : "New inspo"}</span>
                  <GenerationCreditAmount
                    amount={LOOP_COVER_REROLL_CREDIT_COST}
                    showPlus
                    className="opacity-90"
                    iconClassName="h-2.5 w-2.5"
                  />
                </span>
              </button>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>{loop.genre}</Badge>
            {songCard && vocalLangLabel ? (
              <Badge variant="muted" className="gap-1">
                <Languages className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                {vocalLangLabel}
              </Badge>
            ) : null}
            {voiceCloneLabel ? (
              <Badge
                variant="muted"
                className={
                  voiceCloneInfo?.applied && !voiceCloneInfo.fallback
                    ? "gap-1 border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                    : "gap-1 border-amber-400/25 bg-amber-500/10 text-amber-100"
                }
              >
                {voiceCloneLabel}
              </Badge>
            ) : null}
            {!songCard && loop.mood ? <Badge variant="muted">{loop.mood}</Badge> : null}
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
          loopId={loop.id}
          isPlaying={activePlaying}
          progress={active ? progress : 0}
          height={28}
          onSeek={
            canPlay
              ? (pct) => {
                  if (!active) startPlayback(loop, true);
                  requestSeek(pct);
                }
              : undefined
          }
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-pk-muted">
        <div>{loop.loopLength}</div>
        <div className="flex shrink-0 items-center gap-2">
          {(() => {
            const hint = getLoopCardFooterHint(loop, locale);
            if (!hint) return null;
            return (
              <span
                className={cn(
                  "pk-loop-card-hint text-[10px] font-medium",
                  hint.variant === "public" && "pk-loop-card-hint--public",
                  hint.variant === "stems" && "pk-loop-card-hint--stems",
                )}
              >
                {hint.label}
              </span>
            );
          })()}
          <div>{durationLabel}</div>
        </div>
      </div>

      {compact ? (
        <div className="mt-4 flex items-stretch gap-2">
          <Button
            variant="secondary"
            size="sm"
            className={loopPlayButtonClass(active, activePlaying, "min-h-11 flex-1")}
            onClick={(e) => {
              e.stopPropagation();
              unlockAudioPlaybackFromGesture();
              void (async () => {
                if (active) {
                  if (activePlaying) markPausedPlayback();
                  setPlaying(!activePlaying);
                  return;
                }
                let url = "";
                try {
                  const raw = typeof loop.audioUrl === "string" ? loop.audioUrl.trim() : "";
                  url = raw ? await resolvePlaybackUrlForLoop(loop.id, raw) : await ensureAudioReady(loop.id);
                } catch {
                  url = "";
                }
                if (!url) {
                  toast.error(locale === "fr" ? "Audio indisponible — réessaie dans un instant" : "Audio unavailable — try again in a moment");
                  return;
                }
                const fresh = useLoopsStore.getState().loops.find((l) => l.id === loop.id) ?? loop;
                startPlayback({ ...fresh, audioUrl: url }, true);
              })();
            }}
          >
            {activePlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {activePlaying ? "Pause" : "Play"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className={loopToggleButtonClass(loop.isSaved, "min-h-11 min-w-11 px-0")}
            onClick={(e) => {
              e.stopPropagation();
              void toggleSavedRemote(loop.id).then((next) => toast.success(next ? "Sauvegardé" : "Retiré de la bibliothèque")).catch((err) => toast.error(err instanceof Error ? err.message : "Erreur"));
            }}
            title={loop.isSaved ? (locale === "fr" ? "Retirer" : "Unsave") : "Save"}
            aria-pressed={loop.isSaved}
          >
            <Bookmark className={cn("h-4 w-4", loop.isSaved && "fill-current")} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className={loopPublicButtonClass(loop.isPublic, "min-h-11 min-w-11 px-0")}
            onClick={(e) => {
              e.stopPropagation();
              void togglePublicRemote(loop.id).then((next) => toast.success(next ? "Public" : "Private")).catch((err) => toast.error(err instanceof Error ? err.message : "Erreur"));
            }}
            title={loop.isPublic ? (locale === "fr" ? "Passer privé" : "Make private") : locale === "fr" ? "Public" : "Public"}
            aria-pressed={loop.isPublic}
          >
            <Globe className="h-4 w-4" />
          </Button>
          <div className="relative" ref={menuRef}>
            <Button
              variant="secondary"
              size="sm"
              className="min-h-11 min-w-11 px-0"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              aria-label={locale === "fr" ? "Plus d’actions" : "More actions"}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {menuOpen ? (
              <div className="absolute bottom-full right-0 z-30 mb-2 w-44 overflow-hidden rounded-xl border border-pk-border bg-pk-panel py-1 shadow-xl">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-pk-text hover:bg-white/5 disabled:opacity-40"
                  disabled={!loop.audioUrl || isDownloading}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    void (async () => {
                      if (!loop.audioUrl || isDownloading) return;
                      setIsDownloading(true);
                      try {
                        const response = await fetch(loop.audioUrl);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${loop.name.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase()}-producerhit.mp3`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success("Beat downloaded!");
                      } catch {
                        toast.error("Download failed — try again");
                      } finally {
                        setIsDownloading(false);
                      }
                    })();
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-pk-text hover:bg-white/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    setShareOpen(true);
                  }}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
                {onOpenMaster ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-pk-text hover:bg-white/5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onOpenMaster(loop);
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {locale === "fr" ? "Mastering Studio" : "Mastering Studio"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-pk-text hover:bg-white/5 disabled:opacity-40"
                  disabled={isVarying}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    runVariant("variation");
                  }}
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Variation
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-pk-text hover:bg-white/5 disabled:opacity-40"
                  disabled={isVarying}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    runVariant("remix");
                  }}
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Remix
                </button>
                {onDelete ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete();
                    }}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          className={loopPlayButtonClass(active, activePlaying)}
          onClick={(e) => {
            e.stopPropagation();
            unlockAudioPlaybackFromGesture();
            void (async () => {
              if (active) {
                if (activePlaying) markPausedPlayback();
                setPlaying(!activePlaying);
                return;
              }

              let url = "";
              try {
                const raw = typeof loop.audioUrl === "string" ? loop.audioUrl.trim() : "";
                url = raw ? await resolvePlaybackUrlForLoop(loop.id, raw) : await ensureAudioReady(loop.id);
              } catch {
                url = "";
              }
              if (!url) {
                toast.error(locale === "fr" ? "Audio indisponible — réessaie dans un instant" : "Audio unavailable — try again in a moment");
                return;
              }

              const fresh = useLoopsStore.getState().loops.find((l) => l.id === loop.id) ?? loop;
              startPlayback({ ...fresh, audioUrl: url }, true);
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
          variant="secondary"
          size="sm"
          className={loopToggleButtonClass(loop.isSaved)}
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
          title={loop.isSaved ? (locale === "fr" ? "Retirer" : "Unsave") : "Save"}
          aria-pressed={loop.isSaved}
        >
          <Bookmark className={cn("h-4 w-4", loop.isSaved && "fill-current")} />
          Save
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className={loopPublicButtonClass(loop.isPublic)}
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
          title={loop.isPublic ? (locale === "fr" ? "Passer privé" : "Make private") : locale === "fr" ? "Rendre public" : "Make public"}
          aria-pressed={loop.isPublic}
        >
          <Globe className="h-4 w-4" />
          {loop.isPublic ? (locale === "fr" ? "Privé" : "Private") : locale === "fr" ? "Public" : "Public"}
        </Button>
        {onOpenMaster ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMaster(loop);
            }}
            title={locale === "fr" ? "Ouvrir Mastering Studio" : "Open Mastering Studio"}
          >
            <Sparkles className="h-4 w-4" />
            Studio
          </Button>
        ) : null}
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
              if (!canDownloadStems(plan)) {
                toast(locale === "fr" ? "Stems séparés ZIP : plan Plus" : "Separate stems ZIP: Plus plan");
                window.location.href = "/pricing?plan=plus&checkout=1";
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
          variant="secondary"
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
          variant="secondary"
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
      )}

      <ShareMomentModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        loop={shareLoop}
        locale={locale}
        plan={plan}
        onMakePublic={
          !shareLoop.isPublic
            ? () => {
                void (async () => {
                  try {
                    await togglePublicRemote(shareLoop.id);
                    toast.success(locale === "fr" ? "Track publique — lien d'écoute actif" : "Track public — listen link live");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : locale === "fr" ? "Erreur" : "Error");
                  }
                })();
              }
            : undefined
        }
      />
    </div>
  );
});
