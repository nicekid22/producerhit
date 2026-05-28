import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Share2, Sparkles, X } from "lucide-react";
import type { Loop } from "@/types/loop";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { floatEmojis } from "@/lib/delight/confetti";
import {
  buildLoopShareUrl,
  buildSignupUrl,
  facebookShareUrl,
  telegramShareUrl,
  twitterShareIntent,
  whatsAppShareUrl,
} from "@/lib/growthLinks";
import { buildShareMessage, pickSharePromptCopy } from "@/lib/sharePrompt";
import { trackClientEvent } from "@/lib/supabaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
  loop: Loop | null;
  locale: "en" | "fr";
  onMakePublic?: () => void;
};

export function ShareGrowthModal({ open, onClose, loop, locale, onMakePublic }: Props) {
  const isFr = locale === "fr";
  const [copy, setCopy] = useState(() => pickSharePromptCopy(locale));

  useEffect(() => {
    if (!open || !loop) return;
    setCopy(pickSharePromptCopy(locale, `${loop.id}-${Date.now()}`));
    floatEmojis(["📣", "🔥", "🎵", "💬"], 8);
  }, [locale, loop?.id, open]);

  if (!loop) return null;

  const shareUrl = loop.isPublic ? buildLoopShareUrl(loop.id, "twitter") : buildSignupUrl("twitter");
  const text = buildShareMessage(loop.name, locale, loop.isPublic);

  const trackShare = (channel: string) => {
    trackClientEvent("growth_share_click", { channel, loop_id: loop.id, public: loop.isPublic });
  };

  const copyLink = async () => {
    trackShare("copy");
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(isFr ? "Lien copié — envoie-le à ta commu 📣" : "Link copied — send it to your people 📣");
    } catch {
      toast.error(isFr ? "Copie impossible" : "Copy failed");
    }
  };

  const nativeShare = async () => {
    trackShare("native");
    if (navigator.share) {
      try {
        await navigator.share({ title: loop.name, text, url: shareUrl });
        return;
      } catch {
        void copyLink();
        return;
      }
    }
    void copyLink();
  };

  return (
    <Modal open={open} title={copy.title} description={copy.description} onClose={onClose} confirmText={copy.laterLabel} onConfirm={onClose} hideFooter>
      <div className="space-y-4">
        <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">{loop.name}</div>
              <div className="mt-1 text-xs text-white/55">
                {loop.genre} · {loop.mood}
              </div>
            </div>
          </div>
          {!loop.isPublic ? <div className="mt-3 text-xs leading-relaxed text-white/60">{copy.privateHint}</div> : null}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              trackShare("twitter");
              window.open(twitterShareIntent(text, shareUrl), "_blank", "noopener,noreferrer");
            }}
          >
            X / Twitter
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              trackShare("whatsapp");
              window.open(whatsAppShareUrl(text, shareUrl), "_blank", "noopener,noreferrer");
            }}
          >
            WhatsApp
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              trackShare("telegram");
              window.open(telegramShareUrl(text, shareUrl), "_blank", "noopener,noreferrer");
            }}
          >
            Telegram
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              trackShare("facebook");
              window.open(facebookShareUrl(shareUrl), "_blank", "noopener,noreferrer");
            }}
          >
            Facebook
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void copyLink()}>
            <Copy className="h-4 w-4" />
            {isFr ? "Copier le lien" : "Copy link"}
          </Button>
          <Button variant="primary" size="sm" onClick={() => void nativeShare()}>
            <Share2 className="h-4 w-4" />
            {copy.shareButtonLabel}
          </Button>
        </div>

        {!loop.isPublic && onMakePublic ? (
          <Button variant="secondary" size="sm" className="w-full" onClick={onMakePublic}>
            {copy.makePublicLabel}
          </Button>
        ) : null}

        <button type="button" className="flex w-full items-center justify-center gap-1 text-xs text-white/45 hover:text-white/70" onClick={onClose}>
          <X className="h-3 w-3" />
          {copy.laterLabel}
        </button>
      </div>
    </Modal>
  );
}
