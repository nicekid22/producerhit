import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Film, ImageIcon, Loader2, Share2, Sparkles, Video, Volume2, VolumeX } from "lucide-react";
import type { Loop } from "@/types/loop";
import { Modal } from "@/components/ui/Modal";
import { GenerationCreditAmount, GenerationCreditIcon } from "@/components/GenerationCreditIcon";
import { Button } from "@/components/ui/Button";
import { MusicVisualizerPreview } from "@/components/growth/MusicVisualizerPreview";
import { floatEmojis } from "@/lib/delight/confetti";
import { whatsAppShareUrl } from "@/lib/growthLinks";
import { buildShareMomentTitle, buildSocialKitText } from "@/lib/tiktokPack";
import {
  buildPlatformCaption,
  resolvePlatformShareUrl,
  sharePlatformFallbackHint,
  sharePlatformHint,
  sharePlatformLabel,
  SHARE_PLATFORMS,
  shareVideoViaSheet,
  type SharePlatform,
} from "@/lib/sharePlatform";
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
import type { VisualizerLayout, VisualizerPresetId } from "@/lib/visualizer/types";
import { VISUALIZER_PRESETS, getPresetMeta } from "@/lib/visualizer/presets";
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

const SHARE_PRESETS: VisualizerPresetId[] = ["sleeve", "void", "prism", "vhs"];

export function ShareMomentModal({ open, onClose, loop, locale, plan = "free", onMakePublic }: Props) {
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);
  const [caption, setCaption] = useState("");
  const [exportMode, setExportMode] = useState<ShareExportMode>("local");
  const [exporting, setExporting] = useState(false);
  const [moodFetching, setMoodFetching] = useState(false);
  const [layout, setLayout] = useState<VisualizerLayout>("story");
  const [sharePreset, setSharePreset] = useState<VisualizerPresetId>("sleeve");
  const [sharePlatform, setSharePlatform] = useState<SharePlatform>("tiktok");
  const [previewMuted, setPreviewMuted] = useState(true);
  const [moodImageUrl, setMoodImageUrl] = useState<string | null>(null);
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
    setCaption(buildPlatformCaption(loop, "tiktok", locale));
    setExportMode("local");
    setLayout("story");
    setSharePreset("sleeve");
    setSharePlatform("tiktok");
    setPreviewMuted(true);
    setMoodImageUrl(null);
    setMoodSearchQuery(buildMoodBoardSearchQuery(loop));
    setMoodFetching(false);
    moodIdempotencyRef.current = newMoodBoardIdempotencyKey(loop.id);
    floatEmojis(["✨", "🎵", "📱"], 8);
    trackClientEvent("share_moment_open", { loop_id: loop.id, public: loop.isPublic, preset: sharePreset });
    void refreshCredits();
  }, [locale, loop?.id, loop?.isPublic, open, refreshCredits]);

  useEffect(() => {
    if (!open) return;
    setMoodImageUrl(null);
    moodIdempotencyRef.current = loop ? newMoodBoardIdempotencyKey(loop.id) : "";
  }, [layout, loop?.id, open]);

  if (!loop) return null;

  const shareUrl = resolvePlatformShareUrl(loop, sharePlatform);
  const creditsRemaining = moodCredits?.remaining ?? null;
  const canAffordMood = creditsRemaining === null || creditsRemaining >= MOOD_VIDEO_CREDIT_COST;

  const trackShare = (channel: string) => {
    trackClientEvent("growth_share_click", { channel, loop_id: loop.id, public: loop.isPublic, source: "share_moment" });
  };

  const copySocialKit = async (channel = "social_kit") => {
    trackShare(channel);
    try {
      await navigator.clipboard.writeText(buildSocialKitText(caption, shareUrl));
      toast.success(isFr ? "Caption + lien copiés" : "Caption + link copied");
      return true;
    } catch {
      toast.error(isFr ? "Copie impossible" : "Copy failed");
      return false;
    }
  };

  const exportVisualBlob = async () => {
    if (!loop.audioUrl) throw new Error("missing_audio");
    return exportShareVideo(loop, {
      durationSec: 15,
      preset: sharePreset,
      layout,
      showWatermark,
      watermarkText: "made with ProducerHit",
    });
  };

  const shareVisual = async () => {
    if (!loop.audioUrl) {
      toast.error(isFr ? "Audio indisponible" : "Audio unavailable");
      return;
    }
    setExporting(true);
    trackClientEvent("share_moment_share_video", {
      loop_id: loop.id,
      preset: sharePreset,
      layout,
      platform: sharePlatform,
      mode: exportMode,
    });
    trackShare(sharePlatform);
    try {
      const blob = await exportVisualBlob();
      const result = await shareVideoViaSheet({
        blob,
        loop,
        layout,
        platform: sharePlatform,
        caption,
        shareUrl,
      });

      if (result === "shared") {
        toast.success(sharePlatformHint(sharePlatform, locale), { duration: 4200 });
        return;
      }
      if (result === "cancelled") return;

      downloadShareVideoBlob(loop, blob, layout, sharePlatform);
      await copySocialKit(`${sharePlatform}_fallback`);
      toast.success(sharePlatformFallbackHint(sharePlatform, locale), { duration: 5200 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "unsupported" || msg === "missing_audio" || msg === "mp4_unsupported") {
        toast.error(
          isFr
            ? "Export MP4 non supporté sur ce navigateur — essaie Chrome ou Safari récent."
            : "MP4 export not supported on this browser — try recent Chrome or Safari.",
        );
      } else {
        toast.error(isFr ? "Partage échoué — réessaie" : "Share failed — try again");
      }
    } finally {
      setExporting(false);
    }
  };

  const exportVisual = async () => {
    if (!loop.audioUrl) {
      toast.error(isFr ? "Audio indisponible" : "Audio unavailable");
      return;
    }
    setExporting(true);
    trackClientEvent("share_moment_export_video", {
      loop_id: loop.id,
      preset: sharePreset,
      layout,
      platform: sharePlatform,
      mode: "local",
    });
    try {
      const blob = await exportVisualBlob();
      downloadShareVideoBlob(loop, blob, layout, sharePlatform);
      toast.success(isFr ? "Vidéo téléchargée" : "Video downloaded");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "unsupported" || msg === "missing_audio" || msg === "mp4_unsupported") {
        toast.error(
          isFr
            ? "Export MP4 non supporté sur ce navigateur — essaie Chrome ou Safari récent."
            : "MP4 export not supported on this browser — try recent Chrome or Safari.",
        );
      } else {
        toast.error(isFr ? "Export échoué — réessaie" : "Export failed — try again");
      }
    } finally {
      setExporting(false);
    }
  };

  const selectSharePlatform = (platform: SharePlatform) => {
    setSharePlatform(platform);
    setLayout("story");
    setCaption(buildPlatformCaption(loop, platform, locale));
    trackClientEvent("share_moment_platform_select", { loop_id: loop.id, platform });
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
      toast.success(isFr ? "Photo trouvée" : "Photo found");
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

  const shareMoodVideo = async () => {
    if (!moodImageUrl) {
      toast.error(isFr ? "Trouve d'abord une photo mood" : "Find a mood photo first");
      return;
    }
    if (!loop.audioUrl) {
      toast.error(isFr ? "Audio indisponible" : "Audio unavailable");
      return;
    }
    setExporting(true);
    trackClientEvent("share_moment_share_video", { loop_id: loop.id, layout, platform: sharePlatform, mode: "mood" });
    trackShare(sharePlatform);
    try {
      const blob = await exportMoodBoardVideo(loop, moodImageUrl, layout, {
        durationSec: MOOD_VIDEO_EXPORT_MAX_SEC,
        showWatermark,
        locale,
      });
      const result = await shareVideoViaSheet({
        blob,
        loop,
        layout,
        platform: sharePlatform,
        caption,
        shareUrl,
      });
      if (result === "shared") {
        toast.success(sharePlatformHint(sharePlatform, locale), { duration: 4200 });
        return;
      }
      if (result === "cancelled") return;
      downloadMoodBoardVideoBlob(loop, blob, layout);
      await copySocialKit(`${sharePlatform}_fallback`);
      toast.success(sharePlatformFallbackHint(sharePlatform, locale), { duration: 5200 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "unsupported" || msg === "mp4_unsupported") {
        toast.error(
          isFr
            ? "Export MP4 non supporté sur ce navigateur — essaie Chrome ou Safari récent."
            : "MP4 export not supported on this browser — try recent Chrome or Safari.",
        );
      } else if (msg.includes("image_load_failed")) {
        toast.error(isFr ? "Image inaccessible — relance la recherche" : "Image blocked — search again");
      } else {
        toast.error(isFr ? "Partage échoué — réessaie" : "Share failed — try again");
      }
    } finally {
      setExporting(false);
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
    trackClientEvent("share_moment_export_video", { loop_id: loop.id, layout, platform: sharePlatform, mode: "mood" });
    try {
      const blob = await exportMoodBoardVideo(loop, moodImageUrl, layout, {
        durationSec: MOOD_VIDEO_EXPORT_MAX_SEC,
        showWatermark,
        locale,
      });
      downloadMoodBoardVideoBlob(loop, blob, layout);
      toast.success(isFr ? "Vidéo téléchargée" : "Video downloaded");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "unsupported" || msg === "mp4_unsupported") {
        toast.error(
          isFr
            ? "Export MP4 non supporté sur ce navigateur — essaie Chrome ou Safari récent."
            : "MP4 export not supported on this browser — try recent Chrome or Safari.",
        );
      } else if (msg.includes("image_load_failed")) {
        toast.error(isFr ? "Image inaccessible — relance la recherche" : "Image blocked — search again");
      } else {
        toast.error(isFr ? "Export échoué — réessaie" : "Export failed — try again");
      }
    } finally {
      setExporting(false);
    }
  };

  const nativeShareLink = async () => {
    trackShare("native_link");
    if (navigator.share) {
      try {
        await navigator.share({ title: loop.name, text: `${caption}\n${shareUrl}`, url: shareUrl });
        return;
      } catch {
        void copySocialKit("native_link_fallback");
        return;
      }
    }
    void copySocialKit("native_link_fallback");
  };

  const aspectClass = layout === "square" ? "aspect-square max-h-64" : "aspect-[9/16] max-h-72";

  return (
    <Modal
      open={open}
      title={buildShareMomentTitle(locale)}
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
            {isFr ? "Visuel" : "Visual"}
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
            {isFr ? "Photo mood" : "Mood photo"}
          </button>
        </div>

        {exportMode === "local" ? (
          <div className="flex flex-wrap gap-2">
            {SHARE_PRESETS.map((id) => {
              const meta = getPresetMeta(id);
              const label = locale === "fr" ? meta.labelFr : meta.labelEn;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSharePreset(id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-semibold",
                    sharePreset === id
                      ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                      : "border-white/10 text-white/45 hover:text-white/70",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
          <div className={cn("relative mx-auto w-full overflow-hidden sm:max-w-[220px]", aspectClass)}>
            {exportMode === "local" ? (
              <MusicVisualizerPreview
                loop={loop}
                preset={sharePreset}
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
                <p className="text-[11px] text-white/45">{isFr ? "Cherche une photo" : "Find a photo"}</p>
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
          {SHARE_PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => selectSharePlatform(platform)}
              className={cn(
                "flex-1 rounded-xl border px-2 py-2 text-[11px] font-semibold",
                sharePlatform === platform
                  ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                  : "border-white/10 bg-white/[0.02] text-white/45 hover:text-white/70",
              )}
            >
              {sharePlatformLabel(platform, locale)}
            </button>
          ))}
        </div>
        <p className="text-center text-[10px] text-white/35">
          {isFr
            ? "Mobile : MP4 + caption dans le menu Partager."
            : "Mobile: MP4 + caption in the Share sheet."}
        </p>

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
            9:16
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
            1:1
          </button>
        </div>

        {exportMode === "mood" ? (
          <>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold text-violet-200/80">{isFr ? "Recherche" : "Search"}</label>
                <button
                  type="button"
                  className="text-[10px] text-white/45 hover:text-white/70"
                  onClick={() => {
                    setMoodSearchQuery(buildMoodBoardSearchQuery(loop));
                    setMoodImageUrl(null);
                  }}
                >
                  {isFr ? "Réinit." : "Reset"}
                </button>
              </div>
              <textarea
                value={moodSearchQuery}
                onChange={(e) => {
                  setMoodSearchQuery(e.target.value.slice(0, 100));
                  setMoodImageUrl(null);
                }}
                rows={2}
                placeholder={isFr ? "lo-fi, chambre, nuit…" : "lo-fi, bedroom, night…"}
                className="w-full rounded-xl border border-violet-400/20 bg-violet-500/[0.04] px-3 py-2 text-xs leading-relaxed text-white/85 outline-none placeholder:text-white/25 focus:border-violet-300/35"
              />
              {creditsRemaining !== null ? (
                <p className="mt-1 text-[10px] text-white/35">
                  <GenerationCreditAmount amount={MOOD_VIDEO_CREDIT_COST} iconClassName="h-2.5 w-2.5 text-violet-200/90" />
                  {isFr ? " / photo" : " / photo"}
                  {" · "}
                  <span className="tabular-nums">{creditsRemaining}</span>
                  <GenerationCreditIcon className="ml-0.5 inline h-2.5 w-2.5 text-violet-200/80" />
                  {isFr ? " restants" : " left"}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {exportMode === "local" ? (
          <>
            <Button variant="primary" className="w-full" disabled={exporting} onClick={() => void shareVisual()}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              {exporting
                ? isFr
                  ? "Préparation…"
                  : "Preparing…"
                : isFr
                  ? `Partager · ${sharePlatformLabel(sharePlatform, locale)}`
                  : `Share · ${sharePlatformLabel(sharePlatform, locale)}`}
            </Button>
            <Button variant="secondary" className="w-full" disabled={exporting} onClick={() => void exportVisual()}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              {isFr ? `Télécharger · ${layout === "square" ? "1:1" : "9:16"}` : `Download · ${layout === "square" ? "1:1" : "9:16"}`}
            </Button>
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
              {moodFetching ? (isFr ? "Recherche…" : "Searching…") : isFr ? "Chercher photo" : "Find photo"}
            </Button>
            <Button
              variant="primary"
              className="w-full"
              disabled={exporting || !moodImageUrl}
              onClick={() => void shareMoodVideo()}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              {exporting
                ? isFr
                  ? "Préparation…"
                  : "Preparing…"
                : isFr
                  ? `Partager · ${sharePlatformLabel(sharePlatform, locale)}`
                  : `Share · ${sharePlatformLabel(sharePlatform, locale)}`}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={exporting || !moodImageUrl}
              onClick={() => void exportMoodVideo()}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              {isFr ? `Télécharger · ${layout === "square" ? "1:1" : "9:16"}` : `Download · ${layout === "square" ? "1:1" : "9:16"}`}
            </Button>
          </>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-semibold text-white/55">{isFr ? "Social kit" : "Social kit"}</label>
            <button type="button" className="text-[10px] text-white/45 hover:text-white/70" onClick={() => void copySocialKit()}>
              {isFr ? "Copier tout" : "Copy all"}
            </button>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/85 outline-none focus:border-white/25"
          />
          <p className="mt-1 truncate text-[10px] text-white/30">{shareUrl}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              trackShare("whatsapp");
              window.open(whatsAppShareUrl(buildSocialKitText(caption, shareUrl), shareUrl), "_blank", "noopener,noreferrer");
            }}
          >
            WhatsApp
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void nativeShareLink()}>
            <Share2 className="h-4 w-4" />
            {isFr ? "Lien seul" : "Link only"}
          </Button>
        </div>

        {!loop.isPublic && onMakePublic ? (
          <Button variant="secondary" size="sm" className="w-full" onClick={onMakePublic}>
            <Sparkles className="h-4 w-4" />
            {isFr ? "Rendre public" : "Go public"}
          </Button>
        ) : null}

        {!showWatermark ? (
          <div className="text-center text-[10px] text-emerald-300/70">
            {isFr ? "Sans watermark (Pro)" : "No watermark (Pro)"}
          </div>
        ) : null}

      </div>
    </Modal>
  );
}
