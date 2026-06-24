import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export const DISTRIBUTION_ASSETS_BUCKET = "distribution-assets";

export type LoopRowForDistribution = {
  id: string;
  user_id: string;
  name: string | null;
  genre: string | null;
  audio_url: string | null;
  cover_url: string | null;
  stems_url: unknown;
};

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !key) throw new Error("Missing Supabase service credentials");
  return createClient(url, key);
}

export function resolveLoopAudioUrl(loop: LoopRowForDistribution): string | null {
  const direct = loop.audio_url?.trim();
  if (direct && (direct.startsWith("http://") || direct.startsWith("https://"))) {
    return direct;
  }
  const stems = loop.stems_url;
  if (stems && typeof stems === "object") {
    const ace = (stems as Record<string, unknown>).ace;
    if (ace && typeof ace === "object") {
      const http = (ace as Record<string, unknown>).httpAudioUrl;
      if (typeof http === "string" && http.startsWith("http")) return http.trim();
    }
  }
  return direct || null;
}

export function resolveLoopCoverUrl(loop: LoopRowForDistribution): string | null {
  const cover = loop.cover_url?.trim();
  if (cover && cover.startsWith("http")) return cover;
  const stems = loop.stems_url;
  if (stems && typeof stems === "object") {
    const ace = (stems as Record<string, unknown>).ace;
    if (ace && typeof ace === "object") {
      const url = (ace as Record<string, unknown>).coverUrl;
      if (typeof url === "string" && url.startsWith("http")) return url.trim();
    }
  }
  return cover || null;
}

export async function downloadBytes(url: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download asset: ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() || guessContentType(url);
  return { bytes: buf, contentType };
}

function guessContentType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes(".wav")) return "audio/wav";
  if (lower.includes(".mp3")) return "audio/mpeg";
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export function audioFileType(contentType: string, url: string): { fileType: string; mime: string } {
  if (contentType.includes("wav") || url.toLowerCase().includes(".wav")) {
    return { fileType: "audio", mime: "audio/wav" };
  }
  return { fileType: "audio", mime: "audio/mpeg" };
}

export async function storeDistributionAsset(
  admin: SupabaseClient,
  userId: string,
  releaseId: string,
  kind: "audio" | "cover",
  bytes: Uint8Array,
  contentType: string,
): Promise<string> {
  const ext = kind === "audio"
    ? (contentType.includes("wav") ? "wav" : "mp3")
    : (contentType.includes("png") ? "png" : "jpg");
  const path = `${userId}/${releaseId}/${kind}.${ext}`;
  const { error } = await admin.storage.from(DISTRIBUTION_ASSETS_BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  return path;
}

export async function prepareLoopAssets(
  admin: SupabaseClient,
  loop: LoopRowForDistribution,
  releaseId: string,
  userId: string,
): Promise<{ audioPath: string; coverPath: string; audioMime: string; coverMime: string }> {
  const audioUrl = resolveLoopAudioUrl(loop);
  if (!audioUrl) throw new Error("no_playable_audio");

  const coverUrl = resolveLoopCoverUrl(loop);
  if (!coverUrl) throw new Error("missing_cover_art");

  const audioDl = await downloadBytes(audioUrl);
  const coverDl = await downloadBytes(coverUrl);

  const audioPath = await storeDistributionAsset(
    admin,
    userId,
    releaseId,
    "audio",
    audioDl.bytes,
    audioDl.contentType,
  );
  const coverPath = await storeDistributionAsset(
    admin,
    userId,
    releaseId,
    "cover",
    coverDl.bytes,
    coverDl.contentType,
  );

  return {
    audioPath,
    coverPath,
    audioMime: audioDl.contentType,
    coverMime: coverDl.contentType,
  };
}

export async function readStorageAsset(
  admin: SupabaseClient,
  path: string,
): Promise<Uint8Array> {
  const { data, error } = await admin.storage.from(DISTRIBUTION_ASSETS_BUCKET).download(path);
  if (error || !data) throw error ?? new Error("asset_not_found");
  return new Uint8Array(await data.arrayBuffer());
}


export const DEFAULT_OUTLETS = [
  { slug: "spotify", name: "Spotify" },
  { slug: "apple-music", name: "Apple Music" },
  { slug: "deezer", name: "Deezer" },
  { slug: "youtube-music", name: "YouTube Music" },
  { slug: "tiktok-music", name: "TikTok Music" },
];

export async function seedOutletRows(
  admin: SupabaseClient,
  releaseId: string,
): Promise<void> {
  const rows = DEFAULT_OUTLETS.map((o) => ({
    release_id: releaseId,
    outlet_slug: o.slug,
    outlet_name: o.name,
    status: "pending",
  }));
  const { error } = await admin.from("distribution_outlet_status").upsert(rows, {
    onConflict: "release_id,outlet_slug",
  });
  if (error) throw error;
}

export async function logDistributionEvent(
  admin: SupabaseClient,
  releaseId: string | null,
  userId: string | null,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await admin.from("distribution_events").insert({
    release_id: releaseId,
    user_id: userId,
    event_type: eventType,
    payload,
  });
}
