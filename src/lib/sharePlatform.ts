import type { Loop } from "@/types/loop";
import {
  buildLoopShareUrl,
  buildSignupUrl,
  facebookShareUrl,
  linkedInShareUrl,
  redditSubmitUrl,
  telegramShareUrl,
  twitterShareIntent,
  whatsAppShareUrl,
  type GrowthChannel,
} from "@/lib/growthLinks";
import { buildSocialKitText, buildTikTokCaption, buildTikTokHashtags } from "@/lib/tiktokPack";
import type { VisualizerLayout } from "@/lib/visualizer/types";

import type { AppLocale } from "@/i18n/config";
export type SharePlatform = "tiktok" | "instagram" | "youtube";

export const SHARE_PLATFORMS: SharePlatform[] = ["tiktok", "instagram", "youtube"];

/** Réseaux où l’on poste la vidéo exportée (Shorts / Reels / TikTok). */
export const VIDEO_SHARE_PLATFORMS: SharePlatform[] = ["tiktok", "instagram", "youtube"];

/** Réseaux où l’on partage le lien d’écoute + caption (intent / clipboard). */
export const LINK_SHARE_CHANNELS = [
  "twitter",
  "whatsapp",
  "facebook",
  "telegram",
  "reddit",
  "linkedin",
] as const satisfies readonly GrowthChannel[];

export type LinkShareChannel = (typeof LINK_SHARE_CHANNELS)[number];

export function linkShareChannelLabel(channel: LinkShareChannel, locale: AppLocale): string {
  const labels: Record<LinkShareChannel, { fr: string; en: string }> = {
    twitter: { fr: "X", en: "X" },
    whatsapp: { fr: "WhatsApp", en: "WhatsApp" },
    facebook: { fr: "Facebook", en: "Facebook" },
    telegram: { fr: "Telegram", en: "Telegram" },
    reddit: { fr: "Reddit", en: "Reddit" },
    linkedin: { fr: "LinkedIn", en: "LinkedIn" },
  };
  return locale === "fr" ? labels[channel].fr : labels[channel].en;
}

export function sharePlatformLabel(platform: SharePlatform, _locale: AppLocale): string {
  if (platform === "tiktok") return "TikTok";
  if (platform === "instagram") return "Instagram";
  return "YouTube";
}

export function sharePlatformChannel(platform: SharePlatform): GrowthChannel {
  return platform;
}

export function buildInstagramCaption(loop: Loop): string {
  const name = (loop.name || "Untitled").trim();
  const meta = [loop.genre, loop.mood].filter(Boolean).join(" · ");
  const tags = buildTikTokHashtags(loop).slice(0, 4).join(" ");
  return [name, meta, "🎧 ProducerHit", tags].filter(Boolean).join("\n");
}

export function buildYouTubeShortsCaption(loop: Loop): string {
  const name = (loop.name || "Untitled").trim();
  const bpm = loop.bpm && loop.bpm > 0 ? `${loop.bpm} BPM` : null;
  const line = bpm ? `${name} · ${bpm}` : name;
  const tags = buildTikTokHashtags(loop).join(" ");
  return `${line}\nAI music · ProducerHit\n${tags}`;
}

export function buildPlatformCaption(loop: Loop, platform: SharePlatform, locale: AppLocale): string {
  if (platform === "instagram") return buildInstagramCaption(loop);
  if (platform === "youtube") return buildYouTubeShortsCaption(loop);
  return buildTikTokCaption(loop, locale);
}

export function resolvePlatformShareUrl(loop: Loop, platform: SharePlatform): string {
  const channel = sharePlatformChannel(platform);
  return loop.isPublic ? buildLoopShareUrl(loop.id, channel) : buildSignupUrl(channel);
}

export function resolveLinkShareUrl(loop: Loop, channel: LinkShareChannel): string {
  return loop.isPublic ? buildLoopShareUrl(loop.id, channel) : buildSignupUrl(channel);
}

export function cleanLoopFilename(loop: Loop): string {
  return (
    (loop.name || "producerhit")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 64) || "producerhit"
  );
}

export function buildShareVideoFilename(loop: Loop, layout: VisualizerLayout, platform: SharePlatform): string {
  const aspect = layout === "square" ? "square" : "9x16";
  return `${cleanLoopFilename(loop)}-${platform}-${aspect}.mp4`;
}

export function canShareVideoFile(file: File): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return true;
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export type ShareVideoSheetResult = "shared" | "download_fallback" | "cancelled";

export async function shareVideoViaSheet(input: {
  blob: Blob;
  loop: Loop;
  layout: VisualizerLayout;
  platform: SharePlatform;
  caption: string;
  shareUrl: string;
}): Promise<ShareVideoSheetResult> {
  const filename = buildShareVideoFilename(input.loop, input.layout, input.platform);
  const file = new File([input.blob], filename, { type: input.blob.type || "video/mp4" });
  const text = buildSocialKitText(input.caption, input.shareUrl);

  if (canShareVideoFile(file)) {
    try {
      await navigator.share({
        title: input.loop.name || "ProducerHit",
        text,
        files: [file],
      });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
    }
  }

  return "download_fallback";
}

export function sharePlatformHint(platform: SharePlatform, locale: AppLocale): string {
  const label = sharePlatformLabel(platform, locale);
  return locale === "fr"
    ? `Choisis ${label} dans la liste — caption incluse.`
    : `Pick ${label} from the list — caption included.`;
}

export function sharePlatformFallbackHint(platform: SharePlatform, locale: AppLocale): string {
  const label = sharePlatformLabel(platform, locale);
  return locale === "fr"
    ? `Vidéo téléchargée · caption copiée — importe dans ${label}.`
    : `Video saved · caption copied — import in ${label}.`;
}

export function canNativeShareLink(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function openPlatformUploadPage(platform: SharePlatform): void {
  const urls: Record<SharePlatform, string> = {
    tiktok: "https://www.tiktok.com/upload",
    instagram: "https://www.instagram.com/",
    youtube: "https://www.youtube.com/upload",
  };
  window.open(urls[platform], "_blank", "noopener,noreferrer");
}

export function buildLinkShareIntentUrl(channel: LinkShareChannel, caption: string, shareUrl: string): string {
  const title = caption.split("\n")[0]?.trim() || "ProducerHit";
  switch (channel) {
    case "twitter":
      return twitterShareIntent(caption, shareUrl);
    case "whatsapp":
      return whatsAppShareUrl(caption, shareUrl);
    case "facebook":
      return facebookShareUrl(shareUrl);
    case "telegram":
      return telegramShareUrl(caption, shareUrl);
    case "reddit":
      return redditSubmitUrl({ title, url: shareUrl });
    case "linkedin":
      return linkedInShareUrl(shareUrl);
    default:
      return shareUrl;
  }
}

export type LinkShareResult = "opened" | "copied";

/** Partage lien + caption via intent URL (X, WhatsApp, etc.). */
export function shareLinkToChannel(channel: LinkShareChannel, caption: string, shareUrl: string): LinkShareResult {
  const url = buildLinkShareIntentUrl(channel, caption, shareUrl);
  window.open(url, "_blank", "noopener,noreferrer,width=640,height=520");
  return "opened";
}

export async function copyLinkShareKit(caption: string, shareUrl: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(buildSocialKitText(caption, shareUrl));
    return true;
  } catch {
    return false;
  }
}

export async function shareLinkViaNativeSheet(caption: string, shareUrl: string, title: string): Promise<"shared" | "cancelled" | "unavailable"> {
  if (!canNativeShareLink()) return "unavailable";
  try {
    await navigator.share({ title, text: caption, url: shareUrl });
    return "shared";
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return "cancelled";
    return "unavailable";
  }
}

export function shareSectionHint(locale: AppLocale, canShareVideo: boolean): string {
  if (canShareVideo) {
    return locale === "fr"
      ? "Choisis l’app dans la liste — vidéo + caption incluses."
      : "Pick an app from the list — video + caption included.";
  }
  return locale === "fr"
    ? "Sur ordinateur : la vidéo se télécharge et la caption se copie — importe dans l’app."
    : "On desktop: video downloads and caption copies — import in the app.";
}

export function linkShareHint(locale: AppLocale, isPublic: boolean): string {
  if (isPublic) {
    return locale === "fr"
      ? "Partage le lien d’écoute avec caption."
      : "Share the listen link with caption.";
  }
  return locale === "fr"
    ? "Lien vers ProducerHit — rends public pour le lien direct du morceau."
    : "Link to ProducerHit — go public for a direct track link.";
}
