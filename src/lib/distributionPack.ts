import { zipSync, strToU8 } from "fflate";
import {
  buildDistributionReadme,
  DISTRIBUTION_COVER_SIZE,
  type DistributionPackMetadata,
} from "@producerhit/shared";
import type { AppLocale } from "@/i18n/config";
import {
  buildTrackLicenseDocument,
  type TrackLicenseInput,
} from "@/lib/commercialLicenseDocument";
import { formatTrackLicenseAsText } from "@/lib/formatTrackLicenseText";
import { resolveLoopDownloadBlob } from "@/lib/commercialBeatDownload";
import { resolveLoopDisplayCoverUrl } from "@/lib/coverArt";
import type { Loop } from "@/types/loop";

function cleanFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase() || "producerhit-track";
}

function audioExtension(blob: Blob, loop: Loop): string {
  const type = blob.type.toLowerCase();
  const hint = (loop.details?.audioFormat ?? "").toLowerCase();
  if (hint.includes("wav") || type.includes("wav")) return "wav";
  if (hint.includes("flac") || type.includes("flac")) return "flac";
  return "mp3";
}

export async function fetchCoverBlob(coverUrl: string): Promise<Blob> {
  const res = await fetch(coverUrl, { mode: "cors", credentials: "omit" });
  if (!res.ok) throw new Error("cover_fetch_failed");
  const blob = await res.blob();
  if (!blob.size) throw new Error("cover_empty");
  return blob;
}

/** Redimensionne en carré JPEG (1400×1400 par défaut). */
export async function resizeCoverToJpeg(source: Blob, size = DISTRIBUTION_COVER_SIZE): Promise<Blob> {
  if (typeof document === "undefined") return source;
  const bitmap = await createImageBitmap(source);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");

  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, x, y, w, h);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("cover_encode_failed"))),
      "image/jpeg",
      0.92,
    );
  });
}

export type BuildDistributionPackInput = {
  loop: Loop;
  title: string;
  artistName: string;
  featuring?: string[];
  genreName: string;
  languageCode: string;
  explicit: boolean;
  releaseDate?: string;
  locale: AppLocale;
  licenseInput: Omit<TrackLicenseInput, "trackTitle" | "loopId"> & { loopId: string; trackTitle: string };
};

export async function buildDistributionPackZip(input: BuildDistributionPackInput): Promise<{
  zipBlob: Blob;
  filename: string;
  metadata: DistributionPackMetadata;
}> {
  const { loop } = input;
  const audioBlob = await resolveLoopDownloadBlob(loop);
  const ext = audioExtension(audioBlob, loop);

  const coverUrl = resolveLoopDisplayCoverUrl(loop, DISTRIBUTION_COVER_SIZE * 2);
  if (!coverUrl?.startsWith("http")) throw new Error("missing_cover");

  const coverSource = await fetchCoverBlob(coverUrl);
  const coverJpeg = await resizeCoverToJpeg(coverSource);

  const metadata: DistributionPackMetadata = {
    title: input.title.trim(),
    artist: input.artistName.trim(),
    featuring: input.featuring ?? [],
    genre: input.genreName.trim(),
    language: input.languageCode,
    explicit: input.explicit,
    releaseDate: input.releaseDate ?? null,
    bpm: typeof loop.details?.bpm === "number" ? loop.details.bpm : null,
    durationSec: typeof loop.details?.duration === "number" ? loop.details.duration : null,
    keyScale: loop.details?.keyScale ?? null,
    lyrics: loop.details?.lyrics?.trim() ?? null,
    loopId: loop.id,
    producerHitUrl: `https://www.producerhit.com/loop/${loop.id}`,
    exportedAt: new Date().toISOString(),
    coverSize: DISTRIBUTION_COVER_SIZE,
    notes: "Upload manuel via DistroKid, TuneCore, CD Baby ou équivalent. Voir README.txt.",
  };

  const licenseDoc = buildTrackLicenseDocument({
    ...input.licenseInput,
    trackTitle: input.title.trim(),
    loopId: loop.id,
    createdAt: loop.createdAt,
  });
  if (!licenseDoc) throw new Error("license_unavailable");

  const localeKey = input.locale === "fr" ? "fr" : "en";
  const readme = buildDistributionReadme(localeKey);
  const licenseText = formatTrackLicenseAsText(licenseDoc);
  const base = cleanFilename(input.title || loop.name);

  const audioBytes = new Uint8Array(await audioBlob.arrayBuffer());
  const coverBytes = new Uint8Array(await coverJpeg.arrayBuffer());

  const zipped = zipSync({
    "README.txt": strToU8(readme),
    "metadata.json": strToU8(JSON.stringify(metadata, null, 2)),
    "license.txt": strToU8(licenseText),
    "cover.jpg": coverBytes,
    [`audio/track.${ext}`]: audioBytes,
  });

  return {
    zipBlob: new Blob([zipped], { type: "application/zip" }),
    filename: `${base}-distribution-pack.zip`,
    metadata,
  };
}

export async function downloadDistributionPackZip(input: BuildDistributionPackInput): Promise<void> {
  const { zipBlob, filename } = await buildDistributionPackZip(input);
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
