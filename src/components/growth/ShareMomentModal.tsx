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

import { buildShareMomentTitle, buildTikTokCaption } from "@/lib/tiktokPack";

import { canShareWithoutWatermark } from "@/lib/planEntitlements";

import { downloadShareVideoBlob, exportShareVideo } from "@/lib/shareVideo";

import { VISUALIZER_PRESETS } from "@/lib/visualizer/presets";

import type { VisualizerLayout, VisualizerPresetId } from "@/lib/visualizer/types";

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



export function ShareMomentModal({ open, onClose, loop, locale, plan = "free", onMakePublic }: Props) {

  const isFr = locale === "fr";

  const [caption, setCaption] = useState("");

  const [exporting, setExporting] = useState(false);

  const [preset, setPreset] = useState<VisualizerPresetId>("prism");

  const [layout, setLayout] = useState<VisualizerLayout>("story");

  const [previewMuted, setPreviewMuted] = useState(true);

  const showWatermark = !canShareWithoutWatermark(plan);



  useEffect(() => {

    if (!open || !loop) return;

    setCaption(buildTikTokCaption(loop, locale));

    setPreset("prism");

    setLayout("story");

    setPreviewMuted(true);

    floatEmojis(["✨", "🎵", "📱", "🔥"], 10);

    trackClientEvent("share_moment_open", { loop_id: loop.id, public: loop.isPublic });

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

      toast.success(isFr ? "Caption TikTok copiée 📋" : "TikTok caption copied 📋");

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

    trackClientEvent("share_moment_export_video", { loop_id: loop.id, preset, layout });

    try {

      const blob = await exportShareVideo(loop, {

        durationSec: 15,

        preset,

        layout,

        showWatermark,

        watermarkText: "made with ProducerHit",

      });

      downloadShareVideoBlob(loop, blob, layout);

      toast.success(

        isFr

          ? "Visuel animé prêt — 100% généré dans ton navigateur 🎬"

          : "Animated visual ready — 100% rendered in your browser 🎬",

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

      description={

        isFr

          ? "Visuel animé live depuis l’image + l’audio externes — zéro upload vidéo chez nous."

          : "Live animated visual from external image + audio — zero video upload on our servers."

      }

      onClose={onClose}

      confirmText={isFr ? "Plus tard" : "Later"}

      onConfirm={onClose}

      hideFooter

    >

      <div className="space-y-4">

        <div className="overflow-hidden rounded-2xl border border-pink-400/15 bg-black/40">

          <div className={cn("relative mx-auto w-full overflow-hidden sm:max-w-[220px]", aspectClass)}>

            <MusicVisualizerPreview

              loop={loop}

              preset={preset}

              layout={layout}

              active={open}

              muted={previewMuted}

              showWatermark={showWatermark}

              className="absolute inset-0"

            />

            <button

              type="button"

              onClick={() => setPreviewMuted((v) => !v)}

              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/80 backdrop-blur-sm hover:text-white"

              aria-label={previewMuted ? (isFr ? "Activer le son" : "Unmute preview") : isFr ? "Couper le son" : "Mute preview"}

            >

              {previewMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}

            </button>

          </div>

        </div>



        <div>

          <div className="mb-2 text-xs font-semibold text-white/55">{isFr ? "Style visuel" : "Visual style"}</div>

          <div className="grid gap-2 sm:grid-cols-3">

            {VISUALIZER_PRESETS.map((p) => {

              const active = preset === p.id;

              return (

                <button

                  key={p.id}

                  type="button"

                  onClick={() => setPreset(p.id)}

                  className={cn(

                    "rounded-xl border px-3 py-2 text-left transition",

                    active

                      ? "border-pink-400/40 bg-pink-500/10 text-white"

                      : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20",

                  )}

                >

                  <div className="text-xs font-bold">{isFr ? p.labelFr : p.labelEn}</div>

                  <div className="mt-0.5 text-[10px] text-white/45">{isFr ? p.hintFr : p.hintEn}</div>

                </button>

              );

            })}

          </div>

        </div>



        <div className="flex gap-2">

          <button

            type="button"

            onClick={() => setLayout("story")}

            className={cn(

              "flex-1 rounded-xl border px-3 py-2 text-xs font-semibold",

              layout === "story"

                ? "border-cyan-400/35 bg-cyan-500/10 text-cyan-100"

                : "border-white/10 bg-white/[0.03] text-white/55",

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

                ? "border-violet-400/35 bg-violet-500/10 text-violet-100"

                : "border-white/10 bg-white/[0.03] text-white/55",

            )}

          >

            1:1 IG

          </button>

        </div>



        <div>

          <div className="mb-1 flex items-center justify-between">

            <label className="text-xs font-semibold text-white/55">{isFr ? "Caption TikTok" : "TikTok caption"}</label>

            <button type="button" className="text-[10px] text-cyan-300/80 hover:text-cyan-200" onClick={() => void copyCaption()}>

              {isFr ? "Copier" : "Copy"}

            </button>

          </div>

          <textarea

            value={caption}

            onChange={(e) => setCaption(e.target.value)}

            rows={4}

            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/85 outline-none focus:border-pink-400/35"

          />

        </div>



        <Button variant="primary" className="w-full" disabled={exporting} onClick={() => void exportVisual()}>

          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}

          {exporting

            ? isFr

              ? "Rendu local en cours…"

              : "Local render in progress…"

            : isFr

              ? `Exporter visuel animé (${layout === "square" ? "1:1" : "9:16"})`

              : `Export animated visual (${layout === "square" ? "1:1" : "9:16"})`}

        </Button>



        <p className="text-center text-[10px] leading-relaxed text-white/40">

          {isFr

            ? "Audio + cover restent sur leurs URLs externes. La vidéo WebM est créée temporairement dans ton navigateur — rien n’est stocké sur nos serveurs."

            : "Audio + cover stay on external URLs. WebM is built temporarily in your browser — nothing stored on our servers."}

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

            {isFr ? "Plan Pro — export sans watermark ✨" : "Pro plan — export without watermark ✨"}

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


