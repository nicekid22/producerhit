import { useCallback, useEffect, useRef, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import toast from "react-hot-toast";
import { Copy, Download, Link2, Loader2, Share2, Sparkles, Volume2, VolumeX } from "lucide-react";
import type { Loop } from "@/types/loop";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MusicVisualizerPreview } from "@/components/growth/MusicVisualizerPreview";
import { floatEmojis } from "@/lib/delight/confetti";
import { buildShareMomentTitle, buildSocialKitText, buildViralChallengeCaption } from "@/lib/tiktokPack";
import {
  buildPlatformCaption,
  canNativeShareLink,
  canShareVideoFile,
  copyLinkShareKit,
  LINK_SHARE_CHANNELS,
  linkShareChannelLabel,
  linkShareHint,
  openPlatformUploadPage,
  resolveLinkShareUrl,
  resolvePlatformShareUrl,
  shareLinkToChannel,
  shareLinkViaNativeSheet,
  sharePlatformFallbackHint,
  sharePlatformHint,
  sharePlatformLabel,
  shareSectionHint,
  shareVideoViaSheet,
  VIDEO_SHARE_PLATFORMS,
  type LinkShareChannel,
  type SharePlatform,
} from "@/lib/sharePlatform";
import { canShareWithoutWatermark } from "@/lib/planEntitlements";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";
import { downloadShareVideoBlob, exportShareVideo } from "@/lib/shareVideo";
import type { VisualizerLayout } from "@/lib/visualizer/types";
import { trackClientEvent } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  loop: Loop | null;
  locale: AppLocale;
  plan?: string;
  onMakePublic?: () => void;
};

/** Unique template partage — pochette centrée */
const SHARE_PRESET = "sleeve" as const;

export function ShareMomentModal({ open, onClose, loop, locale, plan = "free", onMakePublic }: Props) {
  const isFr = locale === "fr";
  const [caption, setCaption] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportTarget, setExportTarget] = useState<string | null>(null);
  const [layout, setLayout] = useState<VisualizerLayout>("story");
  const [videoPlatform, setVideoPlatform] = useState<SharePlatform>("tiktok");
  const [previewMuted, setPreviewMuted] = useState(true);
  const [showCaptionEdit, setShowCaptionEdit] = useState(false);
  const [canShareVideo, setCanShareVideo] = useState(false);
  const blobCacheRef = useRef<{ key: string; blob: Blob } | null>(null);
  const showWatermark = !canShareWithoutWatermark(plan);
  const openUpsell = useGrowthUpsellStore((s) => s.openUpsell);

  useEffect(() => {
    if (!open || !loop) return;
    setCaption(buildPlatformCaption(loop, "tiktok", locale));
    setLayout("story");
    setVideoPlatform("tiktok");
    setPreviewMuted(true);
    setShowCaptionEdit(false);
    setExportTarget(null);
    blobCacheRef.current = null;
    floatEmojis(["✨", "🎵", "📱"], 8);
    trackClientEvent("share_moment_open", { loop_id: loop.id, public: loop.isPublic, preset: SHARE_PRESET });

    const probe = new File([], "probe.mp4", { type: "video/mp4" });
    setCanShareVideo(canShareVideoFile(probe));
  }, [locale, loop?.id, loop?.isPublic, open]);

  const trackShare = useCallback(
    (channel: string) => {
      if (!loop) return;
      trackClientEvent("growth_share_click", {
        channel,
        loop_id: loop.id,
        public: loop.isPublic,
        source: "share_moment",
      });
    },
    [loop],
  );

  const blobCacheKey = loop
    ? `${loop.id}:${layout}:${showWatermark ? "wm" : "clean"}:${SHARE_PRESET}`
    : "";

  const exportVisualBlob = useCallback(async (): Promise<Blob> => {
    if (!loop?.audioUrl) throw new Error("missing_audio");
    if (blobCacheRef.current?.key === blobCacheKey) {
      return blobCacheRef.current.blob;
    }
    const blob = await exportShareVideo(loop, {
      durationSec: 15,
      preset: SHARE_PRESET,
      layout,
      showWatermark,
      watermarkText: "made with ProducerHit",
    });
    blobCacheRef.current = { key: blobCacheKey, blob };
    return blob;
  }, [blobCacheKey, layout, loop, showWatermark]);

  const copySocialKit = useCallback(
    async (channel = "social_kit", platform: SharePlatform = videoPlatform) => {
      if (!loop) return false;
      const shareUrl = resolvePlatformShareUrl(loop, platform);
      trackShare(channel);
      try {
        await navigator.clipboard.writeText(buildSocialKitText(caption, shareUrl));
        toast.success(isFr ? "Caption copiée" : "Caption copied");
        return true;
      } catch {
        toast.error(isFr ? "Copie impossible" : "Copy failed");
        return false;
      }
    },
    [caption, isFr, loop, trackShare, videoPlatform],
  );

  const handleExportError = useCallback(
    (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "unsupported" || msg === "missing_audio" || msg === "mp4_unsupported") {
        toast.error(
          isFr
            ? "Export vidéo non supporté — essaie Chrome ou Safari récent."
            : "Video export not supported — try recent Chrome or Safari.",
        );
      } else {
        toast.error(isFr ? "Export échoué — réessaie" : "Export failed — try again");
      }
    },
    [isFr],
  );

  const shareVideoToPlatform = async (platform: SharePlatform) => {
    if (!loop?.audioUrl) {
      toast.error(isFr ? "Audio indisponible" : "Audio unavailable");
      return;
    }
    setVideoPlatform(platform);
    setCaption(buildPlatformCaption(loop, platform, locale));
    setExporting(true);
    setExportTarget(platform);
    trackClientEvent("share_moment_share_video", {
      loop_id: loop.id,
      preset: SHARE_PRESET,
      layout,
      platform,
      mode: "local",
    });
    trackShare(platform);
    const platformCaption = buildPlatformCaption(loop, platform, locale);
    const shareUrl = resolvePlatformShareUrl(loop, platform);
    try {
      const blob = await exportVisualBlob();
      const result = await shareVideoViaSheet({
        blob,
        loop,
        layout,
        platform,
        caption: platformCaption,
        shareUrl,
      });

      if (result === "shared") {
        toast.success(sharePlatformHint(platform, locale), { duration: 4200 });
        return;
      }
      if (result === "cancelled") return;

      downloadShareVideoBlob(loop, blob, layout, platform);
      await copyLinkShareKit(platformCaption, shareUrl);
      openPlatformUploadPage(platform);
      toast.success(sharePlatformFallbackHint(platform, locale), { duration: 5200 });
    } catch (err) {
      handleExportError(err);
    } finally {
      setExporting(false);
      setExportTarget(null);
    }
  };

  const shareNativeVideo = async () => {
    await shareVideoToPlatform(videoPlatform);
  };

  const shareLinkChannel = async (channel: LinkShareChannel) => {
    if (!loop) return;
    const linkCaption = buildPlatformCaption(loop, "tiktok", locale);
    const shareUrl = resolveLinkShareUrl(loop, channel);
    trackShare(channel);
    shareLinkToChannel(channel, linkCaption, shareUrl);
    toast.success(
      isFr ? `Ouverture ${linkShareChannelLabel(channel, locale)}…` : `Opening ${linkShareChannelLabel(channel, locale)}…`,
      { duration: 2800 },
    );
  };

  const shareNativeLink = async () => {
    if (!loop) return;
    const linkCaption = buildPlatformCaption(loop, "tiktok", locale);
    const shareUrl = resolveLinkShareUrl(loop, "twitter");
    trackShare("native_link");
    const result = await shareLinkViaNativeSheet(linkCaption, shareUrl, loop.name || "ProducerHit");
    if (result === "shared") {
      toast.success(isFr ? "Partagé" : "Shared");
    } else if (result === "unavailable") {
      const ok = await copyLinkShareKit(linkCaption, shareUrl);
      toast.success(ok ? (isFr ? "Lien copié" : "Link copied") : isFr ? "Partage impossible" : "Share unavailable");
    }
  };

  const copyTrackLink = async () => {
    if (!loop) return;
    const shareUrl = resolveLinkShareUrl(loop, "twitter");
    trackShare("copy_link");
    const ok = await copyLinkShareKit(caption, shareUrl);
    toast.success(ok ? (isFr ? "Lien + caption copiés" : "Link + caption copied") : isFr ? "Copie impossible" : "Copy failed");
  };

  const downloadVideo = async () => {
    if (!loop?.audioUrl) {
      toast.error(isFr ? "Audio indisponible" : "Audio unavailable");
      return;
    }
    setExporting(true);
    setExportTarget("download");
    trackClientEvent("share_moment_export_video", {
      loop_id: loop.id,
      preset: SHARE_PRESET,
      layout,
      platform: videoPlatform,
      mode: "local",
    });
    try {
      const blob = await exportVisualBlob();
      downloadShareVideoBlob(loop, blob, layout, videoPlatform);
      toast.success(isFr ? "Vidéo prête à poster — téléchargée" : "Ready-to-post video downloaded");
    } catch (err) {
      handleExportError(err);
    } finally {
      setExporting(false);
      setExportTarget(null);
    }
  };

  if (!loop) return null;

  const aspectClass = layout === "square" ? "aspect-square max-h-56" : "aspect-[9/16] max-h-64";

  return (
    <Modal
      open={open}
      title={buildShareMomentTitle(locale)}
      onClose={onClose}
      confirmText={isFr ? "Fermer" : "Close"}
      onConfirm={onClose}
      hideFooter
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-amber-100/95">
            {isFr ? "Défi viral" : "Viral challenge"}
          </p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-white/55">
            {isFr
              ? "« J'ai fait ce beat en ~60 s — fais mieux » — caption prête pour TikTok / Reels."
              : "“I made this beat in ~60 sec — try to beat it” — ready caption for TikTok / Reels."}
          </p>
          <button
            type="button"
            onClick={() => {
              if (!loop) return;
              setCaption(buildViralChallengeCaption(loop, locale));
              setShowCaptionEdit(true);
              trackClientEvent("viral_challenge_caption_apply", { loop_id: loop.id });
              toast.success(isFr ? "Caption défi appliquée" : "Challenge caption applied");
            }}
            className="mt-2 text-[11px] font-semibold text-amber-200 hover:text-white"
          >
            {isFr ? "Utiliser cette caption →" : "Use this caption →"}
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <div className={cn("relative mx-auto w-full overflow-hidden sm:max-w-[200px]", aspectClass)}>
            <MusicVisualizerPreview
              loop={loop}
              preset={SHARE_PRESET}
              layout={layout}
              active={open}
              muted={previewMuted}
              showWatermark={showWatermark}
              className="absolute inset-0"
            />
            <button
              type="button"
              onClick={() => setPreviewMuted((v) => !v)}
              className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/70 backdrop-blur-sm hover:text-white"
              aria-label={previewMuted ? (isFr ? "Activer le son" : "Unmute preview") : isFr ? "Couper le son" : "Mute preview"}
            >
              {previewMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="border-t border-white/8 px-3 py-2 text-center">
            <div className="truncate text-xs font-medium text-white/80">{loop.name}</div>
            <div className="mt-0.5 truncate text-[10px] text-white/40">
              {loop.genre}
              {loop.mood ? ` · ${loop.mood}` : ""}
              {loop.bpm ? ` · ${loop.bpm} BPM` : ""}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-white/35">
            {isFr ? "Format vidéo" : "Video format"}
          </span>
          <div className="inline-flex rounded-lg border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => {
                setLayout("story");
                blobCacheRef.current = null;
              }}
              className={cn(
                "rounded-md px-3 py-1 text-[11px] font-semibold",
                layout === "story" ? "bg-white/[0.1] text-white" : "text-white/45",
              )}
            >
              9:16
            </button>
            <button
              type="button"
              onClick={() => {
                setLayout("square");
                blobCacheRef.current = null;
              }}
              className={cn(
                "rounded-md px-3 py-1 text-[11px] font-semibold",
                layout === "square" ? "bg-white/[0.1] text-white" : "text-white/45",
              )}
            >
              1:1
            </button>
          </div>
        </div>

        {/* ——— Partager sur les réseaux (priorité) ——— */}
        <div className="space-y-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
              {isFr ? "Partager sur les réseaux" : "Share to social"}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-white/35">{shareSectionHint(locale, canShareVideo)}</p>
          </div>

          {canShareVideo ? (
            <Button variant="primary" className="w-full" disabled={exporting} onClick={() => void shareNativeVideo()}>
              {exporting && exportTarget === videoPlatform ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {exporting && exportTarget === videoPlatform
                ? isFr
                  ? "Préparation…"
                  : "Preparing…"
                : isFr
                  ? "Partager la vidéo…"
                  : "Share video…"}
            </Button>
          ) : null}

          <div className="grid grid-cols-3 gap-2">
            {VIDEO_SHARE_PLATFORMS.map((platform) => (
              <button
                key={platform}
                type="button"
                disabled={exporting}
                onClick={() => void shareVideoToPlatform(platform)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition-colors",
                  videoPlatform === platform
                    ? "border-violet-400/35 bg-violet-500/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white",
                  exporting && "opacity-60",
                )}
              >
                {exporting && exportTarget === platform ? (
                  <Loader2 className="h-4 w-4 animate-spin text-violet-200" />
                ) : (
                  <Share2 className="h-4 w-4 text-violet-200/90" />
                )}
                <span className="text-[10px] font-semibold leading-tight">{sharePlatformLabel(platform, locale)}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-white/8 pt-2.5">
            <p className="mb-2 text-[10px] text-white/40">{linkShareHint(locale, !!loop.isPublic)}</p>
            <div className="flex flex-wrap gap-1.5">
              {LINK_SHARE_CHANNELS.map((channel) => (
                <button
                  key={channel}
                  type="button"
                  disabled={exporting}
                  onClick={() => void shareLinkChannel(channel)}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
                >
                  {linkShareChannelLabel(channel, locale)}
                </button>
              ))}
              <button
                type="button"
                disabled={exporting}
                onClick={() => void copyTrackLink()}
                className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              >
                <Link2 className="h-3 w-3" />
                {isFr ? "Copier lien" : "Copy link"}
              </button>
              {canNativeShareLink() && !canShareVideo ? (
                <button
                  type="button"
                  disabled={exporting}
                  onClick={() => void shareNativeLink()}
                  className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-[10px] font-medium text-violet-100 transition-colors hover:bg-violet-500/25 disabled:opacity-50"
                >
                  <Share2 className="h-3 w-3" />
                  {isFr ? "Partager" : "Share"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* ——— Télécharger (secondaire) ——— */}
        <div className="space-y-2 rounded-xl border border-white/8 bg-black/20 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
            {isFr ? "Télécharger la vidéo" : "Download video"}
          </p>
          <p className="text-[10px] leading-relaxed text-white/32">
            {isFr
              ? "MP4 prêt à poster (15 s, pochette + audio) — import manuel dans TikTok, Reels ou Shorts."
              : "Ready-to-post MP4 (15 s, cover + audio) — manual import to TikTok, Reels or Shorts."}
          </p>
          <Button
            variant="secondary"
            className="w-full"
            disabled={exporting}
            onClick={() => void downloadVideo()}
          >
            {exporting && exportTarget === "download" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting && exportTarget === "download"
              ? isFr
                ? "Export…"
                : "Exporting…"
              : isFr
                ? "Télécharger MP4"
                : "Download MP4"}
          </Button>
        </div>

        {showCaptionEdit ? (
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/85 outline-none focus:border-white/25"
          />
        ) : (
          <div className="flex items-center justify-center gap-4 text-[10px]">
            <button
              type="button"
              onClick={() => setShowCaptionEdit(true)}
              className="text-white/35 transition-colors hover:text-white/55"
            >
              {isFr ? "Modifier la caption" : "Edit caption"}
            </button>
            <button
              type="button"
              onClick={() => void copySocialKit()}
              className="inline-flex items-center gap-1 text-white/35 transition-colors hover:text-white/55"
            >
              <Copy className="h-3 w-3" />
              {isFr ? "Copier caption" : "Copy caption"}
            </button>
          </div>
        )}

        {!loop.isPublic && onMakePublic ? (
          <button
            type="button"
            onClick={onMakePublic}
            className="mx-auto flex items-center gap-1.5 text-[11px] text-violet-300/80 transition-colors hover:text-violet-200"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isFr ? "Rendre public pour le lien d'écoute" : "Go public for listen link"}
          </button>
        ) : null}

        {showWatermark ? (
          <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2.5 text-center">
            <p className="text-[11px] text-white/70">
              {isFr ? "Watermark ProducerHit sur la vidéo" : "ProducerHit watermark on video"}
            </p>
            <button
              type="button"
              onClick={() => openUpsell("feature_no_watermark", { source: "share_moment", plan })}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-200 hover:text-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isFr ? "Retirer le watermark (Pro)" : "Remove watermark (Pro)"}
            </button>
          </div>
        ) : (
          <p className="text-center text-[10px] text-emerald-300/65">
            {isFr ? "Sans watermark (Pro)" : "No watermark (Pro)"}
          </p>
        )}
      </div>
    </Modal>
  );
}
