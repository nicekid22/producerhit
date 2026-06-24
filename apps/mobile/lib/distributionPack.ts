import { zipSync, strToU8 } from "fflate";
import type { Loop } from "@producerhit/shared";
import {
  buildDistributionReadme,
  buildTrackLicenseDocument,
  DISTRIBUTION_COVER_SIZE,
  formatTrackLicenseAsText,
  type DistributionPackMetadata,
  type LicenseLocale,
} from "@producerhit/shared";
import * as FileSystem from "expo-file-system/legacy";
import { resolveLoopCoverUrl } from "@/lib/loopDisplay";

function cleanFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase() || "producerhit-track";
}

async function fetchUrlBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("download_failed");
  return new Uint8Array(await res.arrayBuffer());
}

async function prepareCoverJpeg(coverUrl: string): Promise<Uint8Array> {
  return fetchUrlBytes(coverUrl);
}

export type BuildMobileDistributionPackInput = {
  loop: Loop;
  title: string;
  artistName: string;
  featuring?: string[];
  genreName: string;
  languageCode: string;
  explicit: boolean;
  releaseDate?: string;
  locale: LicenseLocale;
  plan: string | null | undefined;
  username?: string | null;
  userId?: string | null;
  email?: string | null;
};

export async function buildAndShareDistributionPack(input: BuildMobileDistributionPackInput): Promise<void> {
  const { loop } = input;
  const audioUrl = loop.audioUrl?.trim();
  if (!audioUrl?.startsWith("http")) throw new Error("missing_audio");

  const coverUrl = resolveLoopCoverUrl(loop);
  if (!coverUrl) throw new Error("missing_cover");

  const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDir) throw new Error("storage_unavailable");

  const audioBytes = await fetchUrlBytes(audioUrl);

  const coverBytes = await prepareCoverJpeg(coverUrl);

  const metadata: DistributionPackMetadata = {
    title: input.title.trim(),
    artist: input.artistName.trim(),
    featuring: input.featuring ?? [],
    genre: input.genreName.trim(),
    language: input.languageCode,
    explicit: input.explicit,
    releaseDate: input.releaseDate ?? null,
    bpm: loop.bpm ?? null,
    durationSec: null,
    keyScale: loop.key && loop.scale ? `${loop.key} ${loop.scale}` : null,
    lyrics: null,
    loopId: loop.id,
    producerHitUrl: `https://www.producerhit.com/loop/${loop.id}`,
    exportedAt: new Date().toISOString(),
    coverSize: DISTRIBUTION_COVER_SIZE,
    notes: "Upload manuel via DistroKid, TuneCore, CD Baby ou équivalent. Voir README.txt.",
  };

  const licenseDoc = buildTrackLicenseDocument({
    loopId: loop.id,
    trackTitle: input.title.trim(),
    createdAt: loop.createdAt,
    plan: input.plan,
    profile: { username: input.username ?? input.artistName },
    locale: input.locale,
    userId: input.userId,
    email: input.email,
    exportKind: "beat",
  });
  if (!licenseDoc) throw new Error("license_unavailable");

  const readme = buildDistributionReadme(input.locale);
  const licenseText = formatTrackLicenseAsText(licenseDoc);
  const base = cleanFilename(input.title || loop.name);

  const zipped = zipSync({
    "README.txt": strToU8(readme),
    "metadata.json": strToU8(JSON.stringify(metadata, null, 2)),
    "license.txt": strToU8(licenseText),
    "cover.jpg": coverBytes,
    "audio/track.mp3": audioBytes,
  });

  const zipPath = `${baseDir}${base}-distribution-pack.zip`;
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < zipped.length; i += chunk) {
    binary += String.fromCharCode(...zipped.subarray(i, i + chunk));
  }
  await FileSystem.writeAsStringAsync(zipPath, btoa(binary), {
    encoding: FileSystem.EncodingType.Base64,
  });

  const Sharing = await import("expo-sharing");
  if (!(await Sharing.isAvailableAsync())) throw new Error("sharing_unavailable");
  await Sharing.shareAsync(zipPath, {
    mimeType: "application/zip",
    dialogTitle: `${base}-distribution-pack.zip`,
    UTI: "public.zip-archive",
  });
}
