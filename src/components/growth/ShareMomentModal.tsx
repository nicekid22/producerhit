import { useEffect, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import toast from "react-hot-toast";
import { Download, Loader2, Share2, Sparkles, Volume2, VolumeX } from "lucide-react";
import type { Loop } from "@/types/loop";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MusicVisualizerPreview } from "@/components/growth/MusicVisualizerPreview";
import { floatEmojis } from "@/lib/delight/confetti";
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
  const [layout, setLayout] = useState<VisualizerLayout>("story");
  const [sharePlatform, setSharePlatform] = useState<SharePlatform>("tiktok");
  const [previewMuted, setPreviewMuted] = useState(true);
  const [showCaptionEdit, setShowCaptionEdit] = useState(false);
  const showWatermark = !canShareWithoutWatermark(plan);
  const openUpsell = useGrowthUpsellStore((s) => s.openUpsell);

  useEffect(() => {
    if (!open || !loop) return;
    setCaption(buildPlatformCaption(loop, "tiktok", locale));
    setLayout("story");
    setSharePlatform("tiktok");
    setPreviewMuted(true);
    setShowCaptionEdit(false);
    floatEmojis(["✨", "🎵", "📱"], 8);
    trackClientEvent("share_moment_open", { loop_id: loop.id, public: loop.isPublic, preset: SHARE_PRESET });
  }, [locale, loop?.id, loop?.isPublic, open]);

  if (!loop) return null;

  const shareUrl = resolvePlatformShareUrl(loop, sharePlatform);
  const aspectClass = layout === "square" ? "aspect-square max-h-56" : "aspect-[9/16] max-h-64";

  const trackShare = (channel: string) => {
    trackClientEvent("growth_share_click", { channel, loop_id: loop.id, public: loop.isPublic, source: "share_moment" });
  };

  const copySocialKit = async (channel = "social_kit") => {
    trackShare(channel);
    try {
      await navigator.clipboard.writeText(buildSocialKitText(caption, shareUrl));
      toast.success(isFr ? "Caption copiée" : "Caption copied");
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
      preset: SHARE_PRESET,
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
      preset: SHARE_PRESET,
      layout,
      platform: sharePlatform,
      mode: "local",
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
            ? "Export MP4 non supporté — essaie Chrome ou Safari récent."
            : "MP4 export not supported — try recent Chrome or Safari.",
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
      preset: SHARE_PRESET,
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
            ? "Export MP4 non supporté — essaie Chrome ou Safari récent."
            : "MP4 export not supported — try recent Chrome or Safari.",
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
    setCaption(buildPlatformCaption(loop, platform, locale));
    trackClientEvent("share_moment_platform_select", { loop_id: loop.id, platform });
  };

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

        <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {SHARE_PLATFORMS.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => selectSharePlatform(platform)}
              className={cn(
                "flex-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors",
                sharePlatform === platform
                  ? "bg-white/[0.1] text-white shadow-sm"
                  : "text-white/45 hover:text-white/70",
              )}
            >
              {sharePlatformLabel(platform, locale)}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-white/35">
            {isFr ? "Format" : "Format"}
          </span>
          <div className="inline-flex rounded-lg border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setLayout("story")}
              className={cn(
                "rounded-md px-3 py-1 text-[11px] font-semibold",
                layout === "story" ? "bg-white/[0.1] text-white" : "text-white/45",
              )}
            >
              9:16
            </button>
            <button
              type="button"
              onClick={() => setLayout("square")}
              className={cn(
                "rounded-md px-3 py-1 text-[11px] font-semibold",
                layout === "square" ? "bg-white/[0.1] text-white" : "text-white/45",
              )}
            >
              1:1
            </button>
          </div>
        </div>

        <Button variant="primary" className="w-full" disabled={exporting} onClick={() => void shareVisual()}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          {exporting
            ? isFr
              ? "Préparation…"
              : "Preparing…"
            : isFr
              ? `Partager sur ${sharePlatformLabel(sharePlatform, locale)}`
              : `Share on ${sharePlatformLabel(sharePlatform, locale)}`}
        </Button>

        <div className="flex items-center justify-center gap-5 text-[11px] font-medium">
          <button
            type="button"
            disabled={exporting}
            onClick={() => void exportVisual()}
            className="inline-flex items-center gap-1.5 text-white/55 transition-colors hover:text-white disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            {isFr ? "Télécharger MP4" : "Download MP4"}
          </button>
          <span className="text-white/15" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={() => void copySocialKit()}
            className="text-white/55 transition-colors hover:text-white"
          >
            {isFr ? "Copier la caption" : "Copy caption"}
          </button>
        </div>

        {showCaptionEdit ? (
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/85 outline-none focus:border-white/25"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowCaptionEdit(true)}
            className="mx-auto block text-[10px] text-white/35 transition-colors hover:text-white/55"
          >
            {isFr ? "Modifier la caption" : "Edit caption"}
          </button>
        )}

        {!loop.isPublic && onMakePublic ? (
          <button
            type="button"
            onClick={onMakePublic}
            className="mx-auto flex items-center gap-1.5 text-[11px] text-violet-300/80 transition-colors hover:text-violet-200"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isFr ? "Rendre public pour le lien" : "Go public for link"}
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
