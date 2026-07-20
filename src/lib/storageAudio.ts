import { supabase } from "@/lib/supabaseClient";

/** Upload Supabase Storage activé par défaut. Rollback : VITE_SUPABASE_LOOP_AUDIO_UPLOAD=0 */
export const SUPABASE_LOOP_AUDIO_UPLOAD = import.meta.env.VITE_SUPABASE_LOOP_AUDIO_UPLOAD !== "0";

export const LOOP_AUDIO_BUCKET = "loop-audio";

export function isSupabaseLoopAudioUrl(url: unknown): boolean {
  const s = typeof url === "string" ? url.trim() : "";
  if (!s) return false;
  // Supabase Storage URLs
  if (s.includes("/storage/v1/object/public/loop-audio/")) return true;
  if (s.includes("/storage/v1/object/sign/loop-audio/")) return true;
  // Firebase Storage URLs (firebasestorage.googleapis.com or *.appspot.com)
  if (s.includes("firebasestorage.googleapis.com") && s.includes("/loop-audio%2F")) return true;
  if (s.includes(".appspot.com") && s.includes("/loop-audio%2F")) return true;
  return false;
}

/** Chemin objet `{userId}/{loopId}.ext` depuis une URL publique loop-audio. */
export function parseLoopAudioStoragePath(audioUrl: unknown): string | null {
  const s = typeof audioUrl === "string" ? audioUrl.trim() : "";
  if (!s) return null;

  // Firebase Storage URL — path is URL-encoded as /loop-audio%2F{userId}%2F{loopId}.ext
  if (s.includes("firebasestorage.googleapis.com") || s.includes(".appspot.com")) {
    const decoded = decodeURIComponent(s);
    const marker = "/loop-audio/";
    const idx = decoded.indexOf(marker);
    if (idx < 0) return null;
    const path = decoded.slice(idx + marker.length).split("?")[0]?.trim();
    if (!path || !path.includes("/")) return null;
    return path;
  }

  // Supabase Storage URL
  if (!isSupabaseLoopAudioUrl(s)) return null;
  const marker = "/loop-audio/";
  const idx = s.indexOf(marker);
  if (idx < 0) return null;
  const path = s.slice(idx + marker.length).split("?")[0]?.trim();
  if (!path || !path.includes("/")) return null;
  return path;
}

const LOOP_AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "ogg", "webm"] as const;

export function loopAudioStorageObjectPaths(userId: string, loopId: string): string[] {
  return LOOP_AUDIO_EXTENSIONS.map((ext) => `${userId}/${loopId}.${ext}`);
}

/** Supprime les fichiers du bucket (best-effort). */
export async function removeLoopAudioStorage(userId: string, loopId: string): Promise<void> {
  if (!userId || !loopId) return;
  try {
    await supabase.storage.from(LOOP_AUDIO_BUCKET).remove(loopAudioStorageObjectPaths(userId, loopId));
  } catch {
    // ignore
  }
}

function guessAudioExtension(sourceUrl: string, mimeType: string): string {
  const mime = mimeType.toLowerCase();
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("aac") || mime.includes("mp4")) return "m4a";
  if (sourceUrl.startsWith("data:audio/wav")) return "wav";
  if (sourceUrl.startsWith("data:audio/ogg")) return "ogg";
  return "mp3";
}

/** Upload data:/blob: vers loop-audio — évite provider_audio_inline en Postgres. */
export async function uploadPublicLoopAudio(userId: string, loopId: string, sourceUrl: string): Promise<string | null> {
  if (!SUPABASE_LOOP_AUDIO_UPLOAD) return null;
  const trimmed = sourceUrl.trim();
  if (!trimmed || (!trimmed.startsWith("data:") && !trimmed.startsWith("blob:") && !trimmed.startsWith("http"))) {
    return null;
  }
  try {
    const res = await fetch(trimmed);
    const blob = await res.blob();
    if (!blob.size) return null;
    const ext = guessAudioExtension(trimmed, blob.type || "audio/mpeg");
    const path = `${userId}/${loopId}.${ext}`;
    const { error } = await supabase.storage.from(LOOP_AUDIO_BUCKET).upload(path, blob, {
      upsert: true,
      contentType: blob.type || "audio/mpeg",
      cacheControl: "public, max-age=604800",
    });
    if (error) return null;
    const { data } = supabase.storage.from(LOOP_AUDIO_BUCKET).getPublicUrl(path);
    return data.publicUrl?.trim() || null;
  } catch {
    return null;
  }
}
