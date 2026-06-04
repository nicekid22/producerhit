import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Film, ImageIcon, Loader2, Share2, Sparkles, Video, Volume2, VolumeX, X } from "lucide-react";
import type { Loop } from "@/types/loop";
import { Modal } from "@/components/ui/Modal";
import { GenerationCreditAmount, GenerationCreditIcon } from "@/components/GenerationCreditIcon";
import { Button } from "@/components/ui/Button";
import { MusicVisualizerPreview } from "@/components/growth/MusicVisualizerPreview";
import { floatEmojis } from "@/lib/delight/confetti";
import {
  buildLoopShareUrl,
  buildSignupUrl,
  telegramShareUrl,
  twitterShareIntent,
  whatsAppShareUrl,
} from "@/lib/growthLinks";
import { buildShareMessage } from "@/lib/sharePrompt";
import { buildShareMomentSubtitle, buildShareMomentTitle, buildTikTokCaption } from "@/lib/tiktokPack";
import { canShareWithoutWatermark } from "@/lib/planEntitlements";
import { downloadShareVideoBlob, exportShareVideo } from "@/lib/shareVideo";
import {
  buildMoodBoardSearchQuery,
  downloadMoodBoardVideoBlob,
  exportMoodBoardVideo,
  fetchMoodBoardCredits,
  fetchMoodBoardImage,
  MOOD_VIDEO_CREDIT_COST,
  MOOD_VIDEO_EXPORT_MAX_SEC,
  newMoodBoardIdempotencyKey,
  type MoodBoardCredits,
} from "@/lib/moodBoardVideo";
import type { VisualizerLayout } from "@/lib/visualizer/types";
import { trackClientEvent } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  loop: Loop | null;
  locale: "en" | "fr";
  plan?: string;
  onMakePublic?: () => void;
};

type ShareExportMode = "local" | "mood";

const SHARE_PRESET = "void" as const;

export function ShareMomentModal({ open, onClose, loop, locale, plan = "free", onMakePublic }: Props) {
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);
  const [caption, setCaption] = useState("");
  const [exportMode, setExportMode] = useState<ShareExportMode>("local");
  const [exporting, setExporting] = useState(false);
  const [moodFetching, setMoodFetching] = useState(false);
  const [layout, setLayout] = useState<VisualizerLayout>("story");
  const [previewMuted, setPreviewMuted] = useState(true);
  const [moodImageUrl, setMoodImageUrl] = useState<string | null>(null);
  const [moodImageSource, setMoodImageSource] = useState<string | null>(null);
  const [moodSearchQuery, setMoodSearchQuery] = useState("");
  const [moodCredits, setMoodCredits] = useState<MoodBoardCredits | null>(null);
  const moodIdempotencyRef = useRef<string>("");
  const showWatermark = !canShareWithoutWatermark(plan);

  const refreshCredits = useCallback(async () => {
    if (!user?.id) {
      setMoodCredits(null);
      return;
    }
    const credits = await fetchMoodBoardCredits(user.id);
    setMoodCredits(credits);
  }, [user?.id]);

  useEffect(() => {
    if (!open || !loop) return;
    setCaption(buildTikTokCaption(loop, locale));
    setExportMode("local");
    setLayout("story");
    setPreviewMuted(true);
    setMoodImageUrl(null);
    setMoodImageSource(null);
    setMoodSearchQuery(buildMoodBoardSearchQuery(loop));
    setMoodFetching(false);
    moodIdempotencyRef.current = newMoodBoardIdempotencyKey(loop.id);
    floatEmojis(["✨", "🎵", "📱"], 8);
    trackClientEvent("share_moment_open", { loop_id: loop.id, public: loop.isPublic, preset: SHARE_PRESET });
    void refreshCredits();
  }, [locale, loop?.id, loop?.isPublic, open, refreshCredits]);

  useEffect(() => {
    if (!open) return;
    setMoodImageUrl(null);
    setMoodImageSource(null);
    moodIdempotencyRef.current = loop ? newMoodBoardIdempotencyKey(loop.id) : "";
  }, [layout, loop?.id, open]);

  if (!loop) return null;

  const shareUrl = loop.isPublic ? buildLoopShareUrl(loop.id, "tiktok") : buildSignupUrl("tiktok");
  const text = buildShareMessage(loop.name, locale, loop.isPublic);
  const creditsRemaining = moodCredits?.remaining ?? null;
  const canAffordMood = creditsRemaining === null || creditsRemaining >= MOOD_VIDEO_CREDIT_COST;

  const trackShare = (channel: string) => {
    trackClientEvent("growth_share_click", { channel, loop_id: loop.id, public: loop.isPublic, source: "share_moment" });
  };

  const copyCaption = async () => {
    trackShare("tiktok_caption");
    try {
      await navigator.clipboard.writeText(caption);
      toast.success(isFr ? "Caption TikTok copiée" : "TikTok caption copied");
    } catch {
      toast.error(isFr ? "Copie impossible" : "Copy failed");
    }
  };

  const copyLink = async () => {
    trackShare("copy");
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(isFr ? "Lien copié" : "Link copied");
    } catch {
      toast.error(isFr ? "Copie impossible" : "Copy failed");
    }
  };

  const exportVisual = async () => {
    if (!loop.audioUrl) {
      toast.error(isFr ? "Audio indisponible" : "Audio unavailable");
      return;
    }
    setExporting(true);
    trackClientEvent("share_moment_export_video", { loop_id: loop.id, preset: SHARE_PRESET, layout, mode: "local" });
    try {
      const blob = await exportShareVideo(loop, {
        durationSec: 15,
        preset: SHARE_PRESET,
        layout,
        showWatermark,
        watermarkText: "made with ProducerHit",
      });
      downloadShareVideoBlob(loop, blob, layout);
      toast.success(
        isFr ? "Visuel prêt — rendu local dans ton navigateur" : "Visual ready — rendered locally in your browser",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "unsupported") {
        toast.error(isFr ? "Export vidéo non supporté ici" : "Video export not supported here");
      } else {
        toast.error(isFr ? "Export échoué — réessaie" : "Export failed — try again");
      }
    } finally {
      setExporting(false);
    }
  };

  const fetchMoodPhoto = async () => {
    if (!user?.id) {
      toast.error(isFr ? "Connecte-toi pour créer une vidéo mood" : "Sign in to create a mood video");
      return;
    }
    const trimmedQuery = moodSearchQuery.trim();
    if (trimmedQuery.length < 2) {
      toast.error(isFr ? "Précise ta recherche (2 caractères min.)" : "Refine your search (2 chars min.)");
      return;
    }
    if (!canAffordMood) {
      toast.error(isFr ? "Plus de crédits ce mois-ci" : "No credits left this month");
      return;
    }
    setMoodFetching(true);
    trackClientEvent("share_moment_mood_fetch", { loop_id: loop.id, layout });
    try {
      const result = await fetchMoodBoardImage(loop, layout, {
        idempotencyKey: moodIdempotencyRef.current,
        searchQuery: trimmedQuery,
      });
      setMoodImageUrl(result.imageUrl);
      setMoodImageSource(result.source);
      if (typeof result.used === "number" && typeof result.limit === "number") {
        setMoodCredits((prev) =>
          prev
            ? { ...prev, used: result.used!, remaining: Math.max(0, result.limit! - result.used!) }
            : {
                used: result.used!,
                limit: result.limit!,
                remaining: Math.max(0, result.limit! - result.used!),
                plan: plan,
              },
        );
      } else {
        void refreshCredits();
      }
      moodIdempotencyRef.current = newMoodBoardIdempotencyKey(loop.id);
      const sourceLabel =
        result.source === "pexels"
          ? isFr
            ? "photo mood (Pexels)"
            : "mood photo (Pexels)"
          : isFr
            ? "photo de secours"
            : "fallback photo";
      toast.success(isFr ? `Image trouvée — ${sourceLabel}` : `Image found — ${sourceLabel}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("no_credits")) {
        useGrowthUpsellStore.getState().openUpsell("credits_exhausted", { source: "share_moment_mood" });
        void refreshCredits();
      } else if (msg.includes("query_too_short")) {
        toast.error(isFr ? "Recherche trop courte" : "Search query too short");
      } else {
        toast.error(isFr ? `Recherche échouée — ${msg}` : `Search failed — ${msg}`);
      }
    } finally {
      setMoodFetching(false);
    }
  };

  const exportMoodVideo = async () => {
    if (!moodImageUrl) {
      toast.error(isFr ? "Trouve d'abord une photo mood" : "Find a mood photo first");
      return;
    }
    if (!loop.audioUrl) {
      toast.error(isFr ? "Audio indisponible" : "Audio unavailable");
      return;
    }
    setExporting(true);
    trackClientEvent("share_moment_export_video", { loop_id: loop.id, layout, mode: "mood" });
    try {
      const blob = await exportMoodBoardVideo(loop, moodImageUrl, layout, {
        durationSec: MOOD_VIDEO_EXPORT_MAX_SEC,
        showWatermark,
        locale,
      });
      downloadMoodBoardVideoBlob(loop, blob, layout);
      toast.success(
        isFr
          ? `Vidéo prête (${MOOD_VIDEO_EXPORT_MAX_SEC}s) — logo + ton beat`
          : `Video ready (${MOOD_VIDEO_EXPORT_MAX_SEC}s) — logo + your beat`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "unsupported") {
        toast.error(isFr ? "Export vidéo non supporté ici" : "Video export not supported here");
      } else if (msg.includes("image_load_failed")) {
        toast.error(isFr ? "Image inaccessible — relance la recherche" : "Image blocked — search again");
      } else {
        toast.error(isFr ? "Export échoué — réessaie" : "Export failed — try again");
      }
    } finally {
      setExporting(false);
    }
  };

  const nativeShare = async () => {
    trackShare("native");
    if (navigator.share) {
      try {
        await navigator.share({ title: loop.name, text: `${caption}\n${shareUrl}`, url: shareUrl });
        return;
      } catch {
        void copyCaption();
        return;
      }
    }
    void copyCaption();
  };

  const aspectClass = layout === "square" ? "aspect-square max-h-64" : "aspect-[9/16] max-h-72";

  return (
    <Modal
      open={open}
      title={buildShareMomentTitle(locale)}
      description={buildShareMomentSubtitle(locale)}
      onClose={onClose}
      confirmText={isFr ? "Plus tard" : "Later"}
      onConfirm={onClose}
      hideFooter
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setExportMode("local")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold",
              exportMode === "local"
                ? "border-white/25 bg-white/[0.06] text-white/90"
                : "border-white/10 bg-white/[0.02] text-white/45",
            )}
          >
            <Film className="h-3.5 w-3.5" />
            {isFr ? "Visuel local" : "Local visual"}
          </button>
          <button
            type="button"
            onClick={() => setExportMode("mood")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold",
              exportMode === "mood"
                ? "border-violet-400/35 bg-violet-500/10 text-violet-100"
                : "border-white/10 bg-white/[0.02] text-white/45",
            )}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            {isFr ? "Vidéo mood" : "Mood video"}
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
          <div className={cn("relative mx-auto w-full overflow-hidden sm:max-w-[220px]", aspectClass)}>
            {exportMode === "local" ? (
              <MusicVisualizerPreview
                loop={loop}
                preset={SHARE_PRESET}
                layout={layout}
                active={open}
                muted={previewMuted}
                showWatermark={showWatermark}
                className="absolute inset-0"
              />
            ) : moodImageUrl ? (
              <img
                key={moodImageUrl}
                src={moodImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#050508] px-4 text-center">
                <ImageIcon className="h-6 w-6 text-violet-300/70" />
                <p className="text-[11px] leading-relaxed text-white/45">
                  {isFr
                    ? "Ajuste la recherche mood puis trouve une photo"
                    : "Tune your mood search, then find a photo"}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setPreviewMuted((v) => !v)}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white/70 backdrop-blur-sm hover:text-white"
              aria-label={previewMuted ? (isFr ? "Activer le son" : "Unmute preview") : isFr ? "Couper le son" : "Mute preview"}
            >
              {previewMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
          <div className="border-t border-white/8 px-3 py-2 text-center">
            <div className="truncate text-xs font-medium text-white/75">{loop.name}</div>
            <div className="mt-0.5 text-[10px] text-white/35">
              {loop.genre}
              {loop.mood ? ` · ${loop.mood}` : ""}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLayout("story")}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold",
              layout === "story"
                ? "border-white/25 bg-white/[0.06] text-white/90"
                : "border-white/10 bg-white/[0.02] text-white/45",
            )}
          >
            9:16 TikTok
          </button>
          <button
            type="button"
            onClick={() => setLayout("square")}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold",
              layout === "square"
                ? "border-white/25 bg-white/[0.06] text-white/90"
                : "border-white/10 bg-white/[0.02] text-white/45",
            )}
          >
            1:1 IG
          </button>
        </div>

        {exportMode === "mood" ? (
          <>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold text-violet-200/80">
                  {isFr ? "Recherche visuelle" : "Visual search"}
                </label>
                <button
                  type="button"
                  className="text-[10px] text-white/45 hover:text-white/70"
                  onClick={() => {
                    setMoodSearchQuery(buildMoodBoardSearchQuery(loop));
                    setMoodImageUrl(null);
                    setMoodImageSource(null);
                  }}
                >
                  {isFr ? "Réinitialiser" : "Reset"}
                </button>
              </div>
              <textarea
                value={moodSearchQuery}
                onChange={(e) => {
                  setMoodSearchQuery(e.target.value.slice(0, 100));
                  setMoodImageUrl(null);
                  setMoodImageSource(null);
                }}
                rows={3}
                placeholder={
                  isFr
                    ? "Ex. lo-fi portrait ambiance nuit chambre cozy…"
                    : "E.g. lo-fi portrait ambiance cozy bedroom night…"
                }
                className="w-full rounded-xl border border-violet-400/20 bg-violet-500/[0.04] px-3 py-2 text-xs leading-relaxed text-white/85 outline-none placeholder:text-white/25 focus:border-violet-300/35"
              />
              <p className="mt-1 text-[10px] text-white/35">
                {isFr
                  ? "Basé sur ton genre / mood — photos Pexels (style Pinterest), logo centré + ton beat à l'export."
                  : "Based on your genre / mood — Pexels photos (Pinterest-style), centered logo + your beat on export."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-xl border border-violet-400/20 bg-violet-500/[0.06] px-3 py-2 text-[10px] leading-relaxed text-violet-100/75">
              <GenerationCreditAmount amount={MOOD_VIDEO_CREDIT_COST} iconClassName="h-2.5 w-2.5 text-violet-200/90" />
              <span>{isFr ? "par photo" : "per photo"}</span>
              <span className="text-white/40">·</span>
              <span>
                {isFr
                  ? `export ${MOOD_VIDEO_EXPORT_MAX_SEC}s avec logo + audio`
                  : `${MOOD_VIDEO_EXPORT_MAX_SEC}s export with logo + audio`}
              </span>
              {moodImageSource ? (
                <>
                  <span className="text-white/40">·</span>
                  <span className="text-white/55">{isFr ? `source : ${moodImageSource}` : `source: ${moodImageSource}`}</span>
                </>
              ) : null}
              {creditsRemaining !== null ? (
                <>
                  <span className="text-white/40">·</span>
                  <span className="inline-flex items-center gap-0.5 text-white/55">
                    <span className="tabular-nums">{creditsRemaining}</span>
                    <GenerationCreditIcon className="h-2.5 w-2.5 text-violet-200/80" />
                    <span>{isFr ? "restants" : "left"}</span>
                  </span>
                </>
              ) : null}
            </div>
          </>
        ) : null}

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-semibold text-white/55">{isFr ? "Caption TikTok" : "TikTok caption"}</label>
            <button type="button" className="text-[10px] text-white/45 hover:text-white/70" onClick={() => void copyCaption()}>
              {isFr ? "Copier" : "Copy"}
            </button>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/85 outline-none focus:border-white/25"
          />
        </div>

        {exportMode === "local" ? (
          <>
            <Button variant="primary" className="w-full" disabled={exporting} onClick={() => void exportVisual()}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              {exporting
                ? isFr
                  ? "Rendu local en cours…"
                  : "Local render in progress…"
                : isFr
                  ? `Exporter visuel (${layout === "square" ? "1:1" : "9:16"})`
                  : `Export visual (${layout === "square" ? "1:1" : "9:16"})`}
            </Button>
            <p className="text-center text-[10px] leading-relaxed text-white/35">
              {isFr
                ? "Cover Pollinations + audio — rendu 100 % local, rien n'est stocké chez nous."
                : "Pollinations cover + audio — 100% local render, nothing stored on our servers."}
            </p>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              className="w-full"
              disabled={moodFetching || !canAffordMood}
              onClick={() => void fetchMoodPhoto()}
            >
              {moodFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              {moodFetching
                ? isFr
                  ? "Recherche photo…"
                  : "Finding photo…"
                : (
                  <span className="inline-flex items-center gap-1.5">
                    {isFr ? "Trouver une photo" : "Find a photo"}
                    <span className="inline-flex items-center gap-0.5 opacity-90">
                      (<GenerationCreditAmount amount={MOOD_VIDEO_CREDIT_COST} iconClassName="h-3 w-3" />)
                    </span>
                  </span>
                )}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={exporting || !moodImageUrl}
              onClick={() => void exportMoodVideo()}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              {exporting
                ? isFr
                  ? "Rendu logo + beat…"
                  : "Rendering logo + beat…"
                : isFr
                  ? `Télécharger vidéo (${MOOD_VIDEO_EXPORT_MAX_SEC}s, ${layout === "square" ? "1:1" : "9:16"})`
                  : `Download video (${MOOD_VIDEO_EXPORT_MAX_SEC}s, ${layout === "square" ? "1:1" : "9:16"})`}
            </Button>
            <p className="text-center text-[10px] leading-relaxed text-white/35">
              {isFr
                ? "Photo mood + logo ProducerHit au centre + ton morceau — prêt pour TikTok / Reels. L'export est gratuit après la photo."
                : "Mood photo + centered ProducerHit logo + your track — ready for TikTok / Reels. Export is free after the photo."}
            </p>
          </>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Button variant="secondary" size="sm" onClick={() => void copyCaption()}>
            <Copy className="h-4 w-4" />
            {isFr ? "Caption" : "Caption"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              trackShare("twitter");
              window.open(twitterShareIntent(text, shareUrl), "_blank", "noopener,noreferrer");
            }}
          >
            X
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              trackShare("whatsapp");
              window.open(whatsAppShareUrl(`${caption}\n${shareUrl}`, shareUrl), "_blank", "noopener,noreferrer");
            }}
          >
            WhatsApp
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              trackShare("telegram");
              window.open(telegramShareUrl(`${caption}\n${shareUrl}`, shareUrl), "_blank", "noopener,noreferrer");
            }}
          >
            Telegram
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void copyLink()}>
            <Copy className="h-4 w-4" />
            {isFr ? "Lien" : "Link"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void nativeShare()}>
            <Share2 className="h-4 w-4" />
            {isFr ? "Partager" : "Share"}
          </Button>
        </div>

        {!loop.isPublic && onMakePublic ? (
          <Button variant="secondary" size="sm" className="w-full" onClick={onMakePublic}>
            <Sparkles className="h-4 w-4" />
            {isFr ? "Rendre public — lien d'écoute direct" : "Go public — direct listen link"}
          </Button>
        ) : null}

        {!showWatermark ? (
          <div className="text-center text-[10px] text-emerald-300/70">
            {isFr ? "Plan Pro — export sans watermark" : "Pro plan — export without watermark"}
          </div>
        ) : null}

        <button type="button" className="flex w-full items-center justify-center gap-1 text-xs text-white/45 hover:text-white/70" onClick={onClose}>
          <X className="h-3 w-3" />
          {isFr ? "Continuer à créer" : "Keep creating"}
        </button>
      </div>
    </Modal>
  );
}
