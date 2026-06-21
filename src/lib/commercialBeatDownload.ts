import type { AppLocale } from "@/i18n/config";
import { buildCommonSection } from "@/i18n/systemCatalog";
import toast from "react-hot-toast";
import type { Loop } from "@/types/loop";
import { hasCommercialUseRights } from "@/lib/planEntitlements";
import { withSupabaseFunctionAuth, isPublicAceStreamUrl } from "@/lib/publicAcePlayback";
import { fetchAudioAsBlobUrl } from "@/lib/playableAudio";
import {
  LOOP_AUDIO_BUCKET,
  loopAudioStorageObjectPaths,
  parseLoopAudioStoragePath,
} from "@/lib/storageAudio";
import { supabase } from "@/lib/supabaseClient";
import { useCommercialLicenseStore } from "@/stores/commercialLicenseStore";
import { useGrowthUpsellStore } from "@/stores/growthUpsellStore";
import { fetchCachedLoopAudioBlob } from "@/stores/loopsStore";

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
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

async function fetchHttpAudioBlob(sourceUrl: string): Promise<Blob | null> {
  const trimmed = sourceUrl.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return null;
  const fetchUrl = isPublicAceStreamUrl(trimmed) ? withSupabaseFunctionAuth(trimmed) : trimmed;
  try {
    const response = await fetch(fetchUrl, { mode: "cors", credentials: "omit", referrerPolicy: "no-referrer" });
    if (!response.ok) return null;
    const blob = await response.blob();
    return blob.size > 0 ? blob : null;
  } catch {
    return null;
  }
}

async function downloadFromLoopAudioStorage(audioUrl: string): Promise<Blob | null> {
  const storagePath = parseLoopAudioStoragePath(audioUrl);
  if (!storagePath) return null;

  const tryDownload = async (path: string): Promise<Blob | null> => {
    const { data, error } = await supabase.storage.from(LOOP_AUDIO_BUCKET).download(path);
    if (error || !data?.size) return null;
    return data;
  };

  const direct = await tryDownload(storagePath);
  if (direct) return direct;

  const parts = storagePath.split("/");
  if (parts.length >= 2) {
    const userId = parts[0] ?? "";
    const filePart = parts.slice(1).join("/");
    const loopId = filePart.replace(/\.[^/.]+$/, "");
    if (userId && loopId) {
      for (const candidate of loopAudioStorageObjectPaths(userId, loopId)) {
        const blob = await tryDownload(candidate);
        if (blob) return blob;
      }
    }
  }

  return null;
}

/** Résout le blob audio pour téléchargement — cache local, Storage auth, CORS, flux Edge. */
export async function resolveLoopDownloadBlob(loop: Loop): Promise<Blob> {
  const raw = typeof loop.audioUrl === "string" ? loop.audioUrl.trim() : "";
  if (!raw) throw new Error("missing_audio");

  if (loop.id && !loop.id.startsWith("local-")) {
    const cached = await fetchCachedLoopAudioBlob(loop.id).catch(() => null);
    if (cached?.size) return cached;
  }

  if (raw.startsWith("blob:") || raw.startsWith("data:")) {
    const response = await fetch(raw);
    if (!response.ok) throw new Error("fetch_failed");
    const blob = await response.blob();
    if (!blob.size) throw new Error("empty_blob");
    return blob;
  }

  const storageBlob = await downloadFromLoopAudioStorage(raw);
  if (storageBlob) return storageBlob;

  const httpBlob = await fetchHttpAudioBlob(raw);
  if (httpBlob) return httpBlob;

  if (loop.id) {
    try {
      const blobUrl = await fetchAudioAsBlobUrl(
        isPublicAceStreamUrl(raw) ? withSupabaseFunctionAuth(raw) : raw,
        loop.id,
      );
      const response = await fetch(blobUrl);
      if (response.ok) {
        const blob = await response.blob();
        if (blob.size) return blob;
      }
    } catch {
      // continue
    }
  }

  throw new Error("fetch_failed");
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
    const blob = await resolveLoopDownloadBlob(loop);
    const ext = resolveAudioExtension(loop, blob.type || "");
    const baseName = cleanDownloadFilename(loop.name);
    await saveBlobDownload(blob, `${baseName}-producerhit.${ext}`);
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
