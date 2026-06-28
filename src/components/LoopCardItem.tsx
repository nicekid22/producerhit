import { memo, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import toast from "react-hot-toast";
import {
  coverImageKeyFromLoop,
  displayCoverUrl,
  isPersistedStorageCoverUrl,
  resolveLoopDisplayCoverUrl,
} from "@/lib/coverArt";
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
import { buildDashboardSection } from "@/i18n/dashboardCatalog";
import { buildLoopCardSection, loopCardCoverRerollAria, loopCardVoiceCloneLabel } from "@/i18n/loopCardCatalog";
import type { Loop } from "@/types/loop";
import { resolveAceLyricsForMeta } from "@producerhit/shared";
import { prepareLoopVariantGeneration, variantResultTitle } from "@/lib/loopVariantGeneration";
import { extractLoopVocalLanguage, formatVocalLanguageLabel, isSongLoop } from "@/lib/vocalLanguages";
import { resolveLoopVoiceCloneInfo } from "@/lib/voiceCloneMeta";
import { resolveStemsDownloadUrl } from "@/lib/stemsDownload";
import { canDownloadStems, canUseProducerTag, hasCommercialUseRights } from "@/lib/planEntitlements";
import { readLoopProducerTagMeta } from "@/lib/producerTag";
import { clearProducerTagFromStems, mergeProducerTagIntoStems } from "@producerhit/shared";
import { ProducerTagApplyModal } from "@/components/producerTag/ProducerTagApplyModal";
import { trackClientEvent } from "@/lib/supabaseClient";
import { runCheckoutWithAuth } from "@/lib/billing";
import { downloadCommercialBeat, openTrackLicenseModal } from "@/lib/commercialBeatDownload";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";
import { GenerationCreditAmount } from "@/components/GenerationCreditIcon";
import { rerollLoopCover, LOOP_COVER_REROLL_CREDIT_COST } from "@/lib/loopCoverReroll";
import { USE_POLLINATIONS_CARD_COVERS } from "@/lib/featureFlags";
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
  Package,
  Pause,
  Pencil,
  Play,
  RefreshCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
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
  onProducerTagCreditUsed,
  creditsRemaining,
  onNeedCredits,
  onStartWorkspaceJob,
  compact = false,
  cardVariant = "default",
  slotIndex = 0,
  queueLoops,
  queueSource = "workspace",
  onOpenMaster,
  onDistribute,
}: {
  loop: Loop;
  onDelete?: () => void;
  onOpenDetails?: (loop: Loop, anchorTop: number) => void;
  onGenerationUsed?: () => void;
  /** Appelé après reroll cover réussi (1 crédit). */
  onCoverRerollUsed?: () => void;
  /** Appelé après apply tag (1 crédit si première fois sur ce morceau). */
  onProducerTagCreditUsed?: () => void;
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
  /** Ouvre le wizard pack distribution (bibliothèque) */
  onDistribute?: (loop: Loop) => void;
}) {
  const locale = useLocaleStore((s) => s.locale);
  const d = buildDashboardSection(locale);
  const lc = buildLoopCardSection(locale);
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
  const shareLoop = useLoopsStore((s) => s.loops.find((l) => l.id === loop.id) ?? loop);
  const renameLoopRemote = useLoopsStore((s) => s.renameLoopRemote);
  const applyLoopCoverUrl = useLoopsStore((s) => s.applyLoopCoverUrl);
  const applyLoopProducerTagResult = useLoopsStore((s) => s.applyLoopProducerTagResult);
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
  const [tagModalOpen, setTagModalOpen] = useState(false);
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

  const bannerCoverUrl = coverUrl.startsWith("http") ? coverUrl : "";

  const isLibraryCard = cardVariant === "library";
  const showWorkspaceCoverPeek = isLibraryCard || !compact;
  const isOwnLoop = Boolean(user?.id && loop.userId === user.id);
  const canRerollCover =
    USE_POLLINATIONS_CARD_COVERS &&
    isOwnLoop &&
    !loop.id.startsWith("local-") &&
    !loop.id.startsWith("preview-");
  const tagMeta = useMemo(() => readLoopProducerTagMeta(loop.stemsUrl), [loop.stemsUrl]);
  const canApplyProducerTag =
    canUseProducerTag(plan) &&
    isOwnLoop &&
    Boolean(loop.audioUrl?.startsWith("http")) &&
    !loop.id.startsWith("local-") &&
    !loop.id.startsWith("preview-");

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
            lc.coverNoOtherImage,
          );
          return;
        }
        if (pin.coverUrl?.startsWith("http")) {
          applyLoopCoverUrl(loop.id, pin.coverUrl, pin.coverKind ?? "image", { bumpRevision: true });
          onCoverRerollUsed?.();
          const changed = pin.coverUrl.split("?")[0] !== prevDisplay.split("?")[0];
          toast.success(
            changed ? lc.coverNewApplied : lc.coverRefreshed,
          );
        } else {
          toast.error(lc.coverLoadFailed);
        }
      } catch (err) {
        const code = err instanceof Error ? err.message : "";
        if (code === "no_credits") {
          onNeedCredits?.();
          return;
        }
        toast.error(lc.coverChangeFailed);
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
        toast.success(d.titleUpdated);
        setIsEditingTitle(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : d.error;
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
        lc.generating,
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
                lyrics: resolveAceLyricsForMeta({
                  parsedLyrics: result.meta.lyrics,
                  userLyrics: "",
                  caption: result.meta.prompt ?? variantPrompt,
                }),
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
          toast.success(kind === "remix" ? lc.remixGenerated : lc.variationGenerated);
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
            toast.error(`${lc.generatedSaveFailedPrefix}${message}`);
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
            toast.error(lc.networkBusyRetry);
          } else {
            const message = rawMessage || (kind === "remix" ? lc.remixFailed : lc.variationFailed);
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
            lc.audioUnavailable,
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
      setIsDownloading(true);
      try {
        await downloadCommercialBeat({
          loop,
          plan,
          locale,
          source: "loop_card_download",
        });
      } finally {
        setIsDownloading(false);
      }
    })();
  }, [isDownloading, locale, loop, plan]);

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
  const voiceCloneLabel = voiceCloneInfo ? loopCardVoiceCloneLabel(voiceCloneInfo, locale) : null;
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
        {lc.download}
      </button>
      {onDistribute ? (
        <button
          type="button"
          className="pk-library-card__menu-item pk-library-card__menu-item--distribute"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
            onDistribute(loop);
          }}
        >
          <Package className="h-3.5 w-3.5" />
          {lc.distributionPack}
        </button>
      ) : null}
      {hasCommercialUseRights(plan) ? (
        <button
          type="button"
          className="pk-library-card__menu-item"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
            openTrackLicenseModal(loop, "loop_card_license");
          }}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {lc.licenseCert}
        </button>
      ) : null}
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
      {canApplyProducerTag ? (
        <button
          type="button"
          className="pk-library-card__menu-item"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(false);
            setTagModalOpen(true);
          }}
        >
          <Tag className="h-3.5 w-3.5" />
          {lc.producerTagApply}
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
          {lc.newInspo}
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
          {lc.delete}
        </button>
      ) : null}
    </>
  );

  const producerTagModal = (
    <ProducerTagApplyModal
      open={tagModalOpen}
      onClose={() => setTagModalOpen(false)}
      loop={loop}
      locale={locale}
      plan={plan}
      creditsRemaining={creditsRemaining}
      onNeedCredits={onNeedCredits}
      onApplied={({ audioUrl, creditConsumed, producerTag }) => {
        applyLoopProducerTagResult(loop.id, {
          audioUrl,
          stemsUrl: mergeProducerTagIntoStems(loop.stemsUrl, producerTag),
        });
        if (creditConsumed) onProducerTagCreditUsed?.();
        trackClientEvent("producer_tag_apply", { loopId: loop.id, creditConsumed });
      }}
      onRemoved={(audioUrl) => {
        applyLoopProducerTagResult(loop.id, {
          audioUrl,
          stemsUrl: clearProducerTagFromStems(loop.stemsUrl),
        });
        trackClientEvent("producer_tag_remove", { loopId: loop.id });
      }}
    />
  );

  if (isLibraryCard) {
    return (
      <div
        data-loop-card
        ref={cardRef}
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
                  .then((next) => toast.success(next ? lc.savedToLibrary : lc.removedFromLibrary))
                  .catch((err) => toast.error(err instanceof Error ? err.message : d.error));
              }}
              title={loop.isSaved ? lc.unsave : lc.saveAction}
              aria-pressed={loop.isSaved}
            >
              <Bookmark className={cn("h-4 w-4", loop.isSaved && "fill-current")} />
            </button>
            <button
              type="button"
              className={cn("pk-library-card__icon-btn", loop.isPublic && "pk-library-card__icon-btn--public")}
              onClick={() => {
                void togglePublicRemote(loop.id)
                  .then((next) => toast.success(next ? lc.publicLabel : lc.privateLabel))
                  .catch((err) => toast.error(err instanceof Error ? err.message : d.error));
              }}
              title={loop.isPublic ? lc.makePrivate : lc.makePublic}
              aria-pressed={loop.isPublic}
            >
              <Globe className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="pk-library-card__icon-btn"
              onClick={() => setShareOpen(true)}
              title={lc.share}
            >
              <Share2 className="h-4 w-4" />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="pk-library-card__icon-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={lc.moreActions}
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
                      toast.success(lc.trackPublicLinkLive);
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : d.error);
                    }
                  })();
                }
              : undefined
          }
        />
        {producerTagModal}
      </div>
    );
  }

  return (
    <div
      data-loop-card
      ref={cardRef}
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
          aria-label={lc.infoDetails}
          title={lc.infoDetails}
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
                    placeholder={d.titleInputPlaceholder}
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
                    aria-label={lc.validate}
                    title={lc.validate}
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
                    aria-label={lc.cancel}
                    title={lc.cancel}
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
                    aria-label={lc.editTitle}
                    title={lc.editTitle}
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
                aria-label={loopCardCoverRerollAria(locale, LOOP_COVER_REROLL_CREDIT_COST)}
              >
                {isRerollingCover ? (
                  <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <RefreshCcw className="h-3 w-3 shrink-0 opacity-75" aria-hidden />
                )}
                <span className="inline-flex items-center gap-1 max-[380px]:hidden">
                  <span>{lc.newInspo}</span>
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
            {tagMeta ? (
              <Badge variant="muted" className="gap-1 border-violet-400/30 bg-violet-500/10 text-violet-200">
                <Tag className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                {lc.producerTagBadge}
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
                  toast.error(lc.audioUnavailable);
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
              void toggleSavedRemote(loop.id).then((next) => toast.success(next ? lc.savedToLibrary : lc.removedFromLibrary)).catch((err) => toast.error(err instanceof Error ? err.message : d.error));
            }}
            title={loop.isSaved ? lc.unsave : lc.saveAction}
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
              void togglePublicRemote(loop.id).then((next) => toast.success(next ? lc.publicLabel : lc.privateLabel)).catch((err) => toast.error(err instanceof Error ? err.message : d.error));
            }}
            title={loop.isPublic ? lc.makePrivate : lc.publicLabel}
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
              aria-label={lc.moreActions}
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
                    handleDownloadBeat();
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  {lc.download}
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
                    {lc.masteringStudio}
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
                toast.error(lc.audioUnavailable);
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
                : lc.preparingAudio
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
                toast.success(next ? lc.savedToLibrary : lc.removedFromLibrary);
              } catch (err) {
                const message = err instanceof Error ? err.message : d.error;
                toast.error(message);
              }
            })();
          }}
          title={loop.isSaved ? lc.unsave : lc.saveAction}
          aria-pressed={loop.isSaved}
        >
          <Bookmark className={cn("h-4 w-4", loop.isSaved && "fill-current")} />
          {lc.saveAction}
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
                toast.success(next ? lc.publicLabel : lc.privateLabel);
              } catch (err) {
                const message = err instanceof Error ? err.message : d.error;
                toast.error(message);
              }
            })();
          }}
          title={loop.isPublic ? lc.makePrivate : lc.makePublic}
          aria-pressed={loop.isPublic}
        >
          <Globe className="h-4 w-4" />
          {loop.isPublic ? lc.privateLabel : lc.publicLabel}
        </Button>
        {onOpenMaster ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMaster(loop);
            }}
            title={lc.openMasteringStudio}
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
            handleDownloadBeat();
          }}
          disabled={isDownloading || !loop.audioUrl}
          title={!loop.audioUrl ? lc.audioUnavailableShort : lc.download}
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {lc.download}
        </Button>
        {stemsDownloadUrl ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (!canDownloadStems(plan)) {
                toast(lc.stemsPlusPlan);
                void runCheckoutWithAuth({ plan: "plus", location: "loop_card_stems", locale });
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
            title={lc.downloadStems}
          >
            {isDownloadingStems ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
            {lc.stemsLabel}
          </Button>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShareOpen(true);
          }}
          aria-label={lc.share}
          title={lc.share}
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
          {isVarying ? lc.generating : lc.variationBtn}
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
          {isVarying ? lc.generating : lc.remixBtn}
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
                    toast.success(lc.trackPublicListenLive);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : d.error);
                  }
                })();
              }
            : undefined
        }
      />
      {producerTagModal}
    </div>
  );
});
