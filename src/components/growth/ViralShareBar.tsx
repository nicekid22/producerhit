import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Share2 } from "lucide-react";
import {
  buildGrowthUrl,
  facebookShareUrl,
  telegramShareUrl,
  linkedInShareUrl,
  redditSubmitUrl,
  twitterShareIntent,
  whatsAppShareUrl,
  type GrowthChannel,
} from "@/lib/growthLinks";
import { appendAttributionToUrl } from "@/lib/utmManager";
import { getOrCreateSessionId } from "@/lib/sessionId";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/config";

type Props = {
  url: string;
  shareText: string;
  locale: AppLocale;
  channel?: GrowthChannel;
  loopId?: string;
  className?: string;
  onShare?: (channel: string) => void;
};

const CHANNELS: { id: GrowthChannel; labelFr: string; labelEn: string }[] = [
  { id: "twitter", labelFr: "X", labelEn: "X" },
  { id: "reddit", labelFr: "Reddit", labelEn: "Reddit" },
  { id: "linkedin", labelFr: "LinkedIn", labelEn: "LinkedIn" },
  { id: "whatsapp", labelFr: "WhatsApp", labelEn: "WhatsApp" },
  { id: "telegram", labelFr: "Telegram", labelEn: "Telegram" },
  { id: "facebook", labelFr: "Facebook", labelEn: "Facebook" },
  { id: "tiktok", labelFr: "TikTok", labelEn: "TikTok" },
];

export function ViralShareBar({ url, shareText, locale, channel = "twitter", loopId, className, onShare }: Props) {
  const isFr = locale === "fr";
  const [copied, setCopied] = useState(false);

  const shareUrl = useMemo(() => {
    const tagged = buildGrowthUrl(new URL(url, window.location.origin).pathname, channel, {
      campaign: loopId ? "public_track" : "viral_share",
      content: loopId?.slice(0, 8),
    });
    return appendAttributionToUrl(tagged);
  }, [channel, loopId, url]);

  const trackShare = async (ch: string) => {
    trackClientEvent("growth_share_click", { channel: ch, loop_id: loopId, source: "viral_share_bar" });
    trackClientEvent("referral_link_shared", { channel: ch, loop_id: loopId });
    onShare?.(ch);
    try {
      await supabase.rpc("track_viral_share", {
        p_channel: ch,
        p_session_id: getOrCreateSessionId(),
        p_target: shareUrl.slice(0, 120),
        p_loop_id: loopId ?? null,
      });
    } catch {
      void 0;
    }
  };

  const openShare = (ch: GrowthChannel) => {
    void trackShare(ch);
    const links: Record<GrowthChannel, string> = {
      twitter: twitterShareIntent(shareText, shareUrl),
      whatsapp: whatsAppShareUrl(shareText, shareUrl),
      telegram: telegramShareUrl(shareText, shareUrl),
      facebook: facebookShareUrl(shareUrl),
      tiktok: shareUrl,
      instagram: shareUrl,
      youtube: shareUrl,
      reddit: redditSubmitUrl({ title: shareText, url: shareUrl }),
      linkedin: linkedInShareUrl(shareUrl),
      discord: shareUrl,
      email: shareUrl,
      referral: shareUrl,
      blog: shareUrl,
      organic: shareUrl,
    };
    if (ch === "tiktok") {
      void navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.success(isFr ? "Lien copié — colle-le dans TikTok" : "Link copied — paste in TikTok");
      return;
    }
    window.open(links[ch], "_blank", "noopener,noreferrer,width=640,height=480");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    void trackShare("copy");
    toast.success(isFr ? "Lien copié" : "Link copied");
    window.setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title: "ProducerHit", text: shareText, url: shareUrl });
      void trackShare("native");
    } catch {
      void 0;
    }
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {CHANNELS.map((ch) => (
        <button
          key={ch.id}
          type="button"
          onClick={() => openShare(ch.id)}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 hover:bg-white/10"
        >
          {isFr ? ch.labelFr : ch.labelEn}
        </button>
      ))}
      <button
        type="button"
        onClick={() => void copyLink()}
        className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85 hover:bg-white/10"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? (isFr ? "Copié" : "Copied") : isFr ? "Copier" : "Copy"}
      </button>
      {typeof navigator.share === "function" ? (
        <button
          type="button"
          onClick={() => void nativeShare()}
          className="inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-100 hover:bg-violet-500/30"
        >
          <Share2 className="h-3.5 w-3.5" />
          {isFr ? "Partager" : "Share"}
        </button>
      ) : null}
    </div>
  );
}
