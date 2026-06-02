import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Film, Loader2, Share2, Sparkles, Video, Volume2, VolumeX, Wand2, X } from "lucide-react";
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
import {
  defaultSocialVideoPrompt,
  downloadSocialVideoBlob,
  exportSocialVideoWithAudio,
  fetchSocialVideoCredits,
  generateSocialAiVideo,
  newSocialVideoIdempotencyKey,
  SOCIAL_VIDEO_CREDIT_COST,
  SOCIAL_VIDEO_EXPORT_MAX_SEC,
  SOCIAL_VIDEO_POLLINATIONS_SEC,
  type SocialVideoCredits,
} from "@/lib/socialVideo";
import type { VisualizerLayout } from "@/lib/visualizer/types";
import { trackClientEvent } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  loop: Loop | null;
  locale: "en" | "fr";
  plan?: string;
  onMakePublic?: () => void;
};

type ShareExportMode = "local" | "ai";

const SHARE_PRESET = "void" as const;

export function ShareMomentModal({ open, onClose, loop, locale, plan = "free", onMakePublic }: Props) {
  const isFr = locale === "fr";
  const user = useAuthStore((s) => s.user);
  const [caption, setCaption] = useState("");
  const [exportMode, setExportMode] = useState<ShareExportMode>("local");
  const [exporting, setExporting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [layout, setLayout] = useState<VisualizerLayout>("story");
  const [previewMuted, setPreviewMuted] = useState(true);
  const [aiVideoUrl, setAiVideoUrl] = useState<string | null>(null);
  const [aiVideoPrompt, setAiVideoPrompt] = useState("");
  const [aiCredits, setAiCredits] = useState<SocialVideoCredits | null>(null);
  const aiIdempotencyRef = useRef<string>("");
  const showWatermark = !canShareWithoutWatermark(plan);

  const refreshCredits = useCallback(async () => {
    if (!user?.id) {
      setAiCredits(null);
      return;
    }
    const credits = await fetchSocialVideoCredits(user.id);
    setAiCredits(credits);
  }, [user?.id]);

  useEffect(() => {
    if (!open || !loop) return;
    setCaption(buildTikTokCaption(loop, locale));
    setExportMode("local");
    setLayout("story");
    setPreviewMuted(true);
    setAiVideoUrl(null);
    setAiVideoPrompt(defaultSocialVideoPrompt(loop));
    setAiGenerating(false);
    aiIdempotencyRef.current = newSocialVideoIdempotencyKey(loop.id);
    floatEmojis(["✨", "🎵", "📱"], 8);
    trackClientEvent("share_moment_open", { loop_id: loop.id, public: loop.isPublic, preset: SHARE_PRESET });
    void refreshCredits();
  }, [locale, loop?.id, loop?.isPublic, open, refreshCredits]);

  useEffect(() => {
    if (!open) return;
    setAiVideoUrl(null);
    aiIdempotencyRef.current = loop ? newSocialVideoIdempotencyKey(loop.id) : "";
  }, [layout, loop?.id, open]);

  if (!loop) return null;

  const shareUrl = loop.isPublic ? buildLoopShareUrl(loop.id, "tiktok") : buildSignupUrl("tiktok");
  const text = buildShareMessage(loop.name, locale, loop.isPublic);
  const creditsRemaining = aiCredits?.remaining ?? null;
  const canAffordAi = creditsRemaining === null || creditsRemaining >= SOCIAL_VIDEO_CREDIT_COST;

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

  const generateAiVideo = async () => {
    if (!user?.id) {
      toast.error(isFr ? "Connecte-toi pour générer une vidéo IA" : "Sign in to generate an AI video");
      return;
    }
    const trimmedPrompt = aiVideoPrompt.trim();
    if (trimmedPrompt.length < 3) {
      toast.error(isFr ? "Décris ta vidéo (3 caractères min.)" : "Describe your video (3 chars min.)");
      return;
    }
    if (!canAffordAi) {
      toast.error(isFr ? "Plus de crédits ce mois-ci" : "No credits left this month");
      return;
    }
    setAiGenerating(true);
    trackClientEvent("share_moment_ai_generate", { loop_id: loop.id, layout });
    try {
      const result = await generateSocialAiVideo(loop, layout, {
        idempotencyKey: aiIdempotencyRef.current,
        videoPrompt: trimmedPrompt,
      });
      setAiVideoUrl(result.videoUrl);
      if (typeof result.used === "number" && typeof result.limit === "number") {
        setAiCredits((prev) =>
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
      aiIdempotencyRef.current = newSocialVideoIdempotencyKey(loop.id);
      toast.success(
        isFr
          ? `Vidéo IA prête (${SOCIAL_VIDEO_POLLINATIONS_SEC}s, boucle seamless)`
          : `AI video ready (${SOCIAL_VIDEO_POLLINATIONS_SEC}s seamless loop)`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("no_credits")) {
        toast.error(isFr ? "Plus de crédits ce mois-ci" : "No credits left this month");
        void refreshCredits();
      } else if (msg.includes("prompt_too_short")) {
        toast.error(isFr ? "Prompt trop court" : "Prompt too short");
      } else if (msg.includes("upload_failed")) {
        toast.error(
          isFr
            ? "Stockage vidéo indisponible — contacte le support (aucun crédit débité)"
            : "Video storage unavailable — contact support (no credit charged)",
        );
      } else if (msg.includes("pollinations_timeout") || msg.includes("timeout")) {
        toast.error(
          isFr
            ? "Pollinations trop lent — réessaie dans 1 min (aucun crédit débité)"
            : "Pollinations timed out — retry in 1 min (no credit charged)",
        );
      } else if (msg.includes("video_generation_failed")) {
        toast.error(
          isFr
            ? "Génération vidéo échouée — modifie le prompt et réessaie (aucun crédit débité)"
            : "Video generation failed — tweak prompt and retry (no credit charged)",
        );
      } else if (msg.includes("server_misconfigured")) {
        toast.error(isFr ? "Service vidéo non configuré côté serveur" : "Video service not configured on server");
      } else {
        toast.error(isFr ? `Génération échouée — ${msg}` : `Generation failed — ${msg}`);
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const exportAiVideo = async () => {
    if (!aiVideoUrl) {
      toast.error(isFr ? "Génère d'abord une vidéo IA" : "Generate an AI video first");
      return;
    }
    if (!loop.audioUrl) {
      toast.error(isFr ? "Audio indisponible" : "Audio unavailable");
      return;
    }
    setExporting(true);
    trackClientEvent("share_moment_export_video", { loop_id: loop.id, layout, mode: "ai" });
    try {
      const blob = await exportSocialVideoWithAudio(loop, aiVideoUrl, layout, {
        durationSec: SOCIAL_VIDEO_EXPORT_MAX_SEC,
        showWatermark,
        watermarkText: "made with ProducerHit",
      });
      downloadSocialVideoBlob(loop, blob, layout);
      toast.success(
        isFr
          ? "Vidéo sociale prête — audio + grain VHS"
          : "Social video ready — audio + VHS grain",
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
            onClick={() => setExportMode("ai")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold",
              exportMode === "ai"
                ? "border-violet-400/35 bg-violet-500/10 text-violet-100"
                : "border-white/10 bg-white/[0.02] text-white/45",
            )}
          >
            <Wand2 className="h-3.5 w-3.5" />
            {isFr ? "Vidéo IA" : "AI video"}
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
            ) : aiVideoUrl ? (
              <video
                key={aiVideoUrl}
                src={aiVideoUrl}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                loop
                muted={previewMuted}
                playsInline
                preload="auto"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#050508] px-4 text-center">
                <Sparkles className="h-6 w-6 text-violet-300/70" />
                <p className="text-[11px] leading-relaxed text-white/45">
                  {isFr
                    ? "Écris ton prompt ci-dessous puis génère la boucle VHS"
                    : "Write your prompt below, then generate the VHS loop"}
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

        {exportMode === "ai" ? (
          <>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold text-violet-200/80">
                  {isFr ? "Prompt vidéo IA" : "AI video prompt"}
                </label>
                <button
                  type="button"
                  className="text-[10px] text-white/45 hover:text-white/70"
                  onClick={() => setAiVideoPrompt(defaultSocialVideoPrompt(loop))}
                >
                  {isFr ? "Réinitialiser" : "Reset"}
                </button>
              </div>
              <textarea
                value={aiVideoPrompt}
                onChange={(e) => {
                  setAiVideoPrompt(e.target.value.slice(0, 160));
                  setAiVideoUrl(null);
                }}
                rows={3}
                placeholder={
                  isFr
                    ? "Ex. glass prism floating in neon fog, cyberpunk violet…"
                    : "E.g. glass prism floating in neon fog, cyberpunk violet…"
                }
                className="w-full rounded-xl border border-violet-400/20 bg-violet-500/[0.04] px-3 py-2 text-xs leading-relaxed text-white/85 outline-none placeholder:text-white/25 focus:border-violet-300/35"
              />
              <p className="mt-1 text-[10px] text-white/35">
                {isFr
                  ? "Décris l'ambiance visuelle — grain VHS et boucle seamless ajoutés automatiquement."
                  : "Describe the visual mood — VHS grain and seamless loop added automatically."}
              </p>
            </div>

            <div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.06] px-3 py-2 text-[10px] leading-relaxed text-violet-100/75">
            {isFr ? (
              <>
                <strong className="font-semibold text-violet-100">{SOCIAL_VIDEO_CREDIT_COST} crédit</strong> par
                génération · {SOCIAL_VIDEO_POLLINATIONS_SEC}s boucle seamless · export jusqu&apos;à{" "}
                {SOCIAL_VIDEO_EXPORT_MAX_SEC}s avec audio + grain VHS
                {creditsRemaining !== null ? (
                  <>
                    {" "}
                    · <span className="text-white/55">{creditsRemaining} crédit(s) restant(s)</span>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <strong className="font-semibold text-violet-100">{SOCIAL_VIDEO_CREDIT_COST} credit</strong> per
                generation · {SOCIAL_VIDEO_POLLINATIONS_SEC}s seamless loop · export up to {SOCIAL_VIDEO_EXPORT_MAX_SEC}s
                with audio + VHS grain
                {creditsRemaining !== null ? (
                  <>
                    {" "}
                    · <span className="text-white/55">{creditsRemaining} credit(s) left</span>
                  </>
                ) : null}
              </>
            )}
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
              disabled={aiGenerating || !canAffordAi}
              onClick={() => void generateAiVideo()}
            >
              {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {aiGenerating
                ? isFr
                  ? "Génération IA (30s–2 min)…"
                  : "AI generation (30s–2 min)…"
                : isFr
                  ? `Générer vidéo IA (${SOCIAL_VIDEO_CREDIT_COST} crédit)`
                  : `Generate AI video (${SOCIAL_VIDEO_CREDIT_COST} credit)`}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={exporting || !aiVideoUrl}
              onClick={() => void exportAiVideo()}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              {exporting
                ? isFr
                  ? "Export audio + VHS…"
                  : "Exporting audio + VHS…"
                : isFr
                  ? `Télécharger avec audio (${SOCIAL_VIDEO_EXPORT_MAX_SEC}s max)`
                  : `Download with audio (${SOCIAL_VIDEO_EXPORT_MAX_SEC}s max)`}
            </Button>
            <p className="text-center text-[10px] leading-relaxed text-white/35">
              {isFr
                ? "Vidéo Pollinations bouclée + ton beat + grain VHS rétro. Crédit débité uniquement si la génération réussit."
                : "Seamless Pollinations loop + your beat + retro VHS grain. Credit charged only when generation succeeds."}
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
