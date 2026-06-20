import type { AppLocale } from "@/i18n/config";
import { buildCommonSection } from "@/i18n/systemCatalog";
import toast from "react-hot-toast";
import type { Loop } from "@/types/loop";
import { hasCommercialUseRights } from "@/lib/planEntitlements";
import { useCommercialLicenseStore } from "@/stores/commercialLicenseStore";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";

function resolveAudioExtension(loop: Loop, blobType: string): string {
  const formatHint = (loop.details?.audioFormat || "").toLowerCase();
  const type = blobType.toLowerCase();
  if (formatHint === "wav" || formatHint === "wav32") return "wav";
  if (formatHint === "flac") return "flac";
  if (formatHint === "opus") return "opus";
  if (formatHint === "aac") return "aac";
  if (type.includes("wav")) return "wav";
  if (type.includes("flac")) return "flac";
  if (type.includes("opus")) return "opus";
  if (type.includes("aac")) return "aac";
  return "mp3";
}

function cleanDownloadFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase();
}

async function saveBlobDownload(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function triggerAudioDownload(audioUrl: string, filename: string): Promise<void> {
  if (audioUrl.startsWith("data:") || audioUrl.startsWith("blob:")) {
    const response = await fetch(audioUrl);
    if (!response.ok) throw new Error("fetch_failed");
    const blob = await response.blob();
    await saveBlobDownload(blob, filename);
    return;
  }

  try {
    const response = await fetch(audioUrl);
    if (!response.ok) throw new Error("fetch_failed");
    const blob = await response.blob();
    await saveBlobDownload(blob, filename);
  } catch {
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = filename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export type CommercialBeatDownloadOptions = {
  loop: Loop;
  plan: string | null | undefined;
  locale: AppLocale;
  source: string;
};

export async function downloadCommercialBeat({
  loop,
  plan,
  locale,
  source,
}: CommercialBeatDownloadOptions): Promise<boolean> {
  if (!loop.audioUrl) return false;

  if (!hasCommercialUseRights(plan)) {
    useGrowthUpsellStore.getState().openUpsell("feature_commercial_download", {
      source,
      plan: plan ?? "free",
    });
    return false;
  }

  try {
    let ext = resolveAudioExtension(loop, "");
    const baseName = cleanDownloadFilename(loop.name);

    if (loop.audioUrl.startsWith("data:") || loop.audioUrl.startsWith("blob:")) {
      const response = await fetch(loop.audioUrl);
      if (!response.ok) throw new Error("fetch_failed");
      const blob = await response.blob();
      ext = resolveAudioExtension(loop, blob.type || "");
      await saveBlobDownload(blob, `${baseName}-producerhit.${ext}`);
    } else {
      try {
        const response = await fetch(loop.audioUrl);
        if (!response.ok) throw new Error("fetch_failed");
        const blob = await response.blob();
        ext = resolveAudioExtension(loop, blob.type || "");
        await saveBlobDownload(blob, `${baseName}-producerhit.${ext}`);
      } catch {
        await triggerAudioDownload(loop.audioUrl, `${baseName}-producerhit.${ext}`);
      }
    }

    toast.success(buildCommonSection(locale).beatDownloaded);
    return true;
  } catch {
    toast.error(buildCommonSection(locale).downloadFailed);
    return false;
  }
}

export function openTrackLicenseModal(loop: Loop, source: string, exportKind: "beat" | "stems" = "beat"): void {
  useCommercialLicenseStore.getState().openLicense({
    loopId: loop.id,
    trackTitle: loop.name,
    createdAt: loop.createdAt,
    exportKind,
    source,
  });
}

/** @deprecated Use openTrackLicenseModal */
export function triggerStemsLicenseModal(loop: Loop, source: string): void {
  openTrackLicenseModal(loop, source, "stems");
}
