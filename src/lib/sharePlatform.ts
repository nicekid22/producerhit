import type { Loop } from "@/types/loop";
import { buildLoopShareUrl, buildSignupUrl, type GrowthChannel } from "@/lib/growthLinks";
import { buildSocialKitText, buildTikTokCaption, buildTikTokHashtags } from "@/lib/tiktokPack";
import type { VisualizerLayout } from "@/lib/visualizer/types";

import type { AppLocale } from "@/i18n/config";
export type SharePlatform = "tiktok" | "instagram" | "youtube";

export const SHARE_PLATFORMS: SharePlatform[] = ["tiktok", "instagram", "youtube"];

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
