import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Loader2, Share2, Sparkles, Video, Volume2, VolumeX, X } from "lucide-react";
import type { Loop } from "@/types/loop";
import { Modal } from "@/components/ui/Modal";
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
import type { VisualizerLayout } from "@/lib/visualizer/types";
import { trackClientEvent } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  loop: Loop | null;
  locale: "en" | "fr";
  plan?: string;
  onMakePublic?: () => void;
};

const SHARE_PRESET = "void" as const;

export function ShareMomentModal({ open, onClose, loop, locale, plan = "free", onMakePublic }: Props) {
  const isFr = locale === "fr";
  const [caption, setCaption] = useState("");
  const [exporting, setExporting] = useState(false);
  const [layout, setLayout] = useState<VisualizerLayout>("story");
  const [previewMuted, setPreviewMuted] = useState(true);
  const showWatermark = !canShareWithoutWatermark(plan);

  useEffect(() => {
    if (!open || !loop) return;
    setCaption(buildTikTokCaption(loop, locale));
    setLayout("story");
    setPreviewMuted(true);
    floatEmojis(["✨", "🎵", "📱"], 8);
    trackClientEvent("share_moment_open", { loop_id: loop.id, public: loop.isPublic, preset: SHARE_PRESET });
  }, [locale, loop?.id, loop?.isPublic, open]);

  if (!loop) return null;

  const shareUrl = loop.isPublic ? buildLoopShareUrl(loop.id, "tiktok") : buildSignupUrl("tiktok");
  const text = buildShareMessage(loop.name, locale, loop.isPublic);

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
    trackClientEvent("share_moment_export_video", { loop_id: loop.id, preset: SHARE_PRESET, layout });
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
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
          <div className={cn("relative mx-auto w-full overflow-hidden sm:max-w-[220px]", aspectClass)}>
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
            ? "Cover Pollinations + audio — noir, grain et scratches subtils. Rien n'est stocké chez nous."
            : "Pollinations cover + audio — black void, grain and subtle scratches. Nothing stored on our servers."}
        </p>

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
