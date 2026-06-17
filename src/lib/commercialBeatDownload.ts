import type { AppLocale } from "@/i18n/config";
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
    const response = await fetch(loop.audioUrl);
    if (!response.ok) throw new Error("fetch_failed");
    const blob = await response.blob();
    const ext = resolveAudioExtension(loop, blob.type || "");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cleanDownloadFilename(loop.name)}-producerhit.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(locale === "fr" ? "Beat téléchargé !" : "Beat downloaded!");

    useCommercialLicenseStore.getState().openLicense({
      loopId: loop.id,
      trackTitle: loop.name,
      createdAt: loop.createdAt,
      exportKind: "beat",
      source,
    });

    return true;
  } catch {
    toast.error(locale === "fr" ? "Échec du téléchargement — réessaie" : "Download failed — try again");
    return false;
  }
}

export function triggerStemsLicenseModal(loop: Loop, source: string): void {
  useCommercialLicenseStore.getState().openLicense({
    loopId: loop.id,
    trackTitle: loop.name,
    createdAt: loop.createdAt,
    exportKind: "stems",
    source,
  });
}
