import { supabase } from "@/lib/supabaseClient";

/** Upload cover images to Firebase Storage (loop-covers bucket). */
export const LOOP_COVERS_BUCKET = "loop-covers";

/** Détecte une URL Firebase Storage pour les covers loop. */
export function isFirebaseStorageCoverUrl(url: unknown): boolean {
  const s = typeof url === "string" ? url.trim() : "";
  if (!s) return false;
  if (s.includes("firebasestorage.googleapis.com") && s.includes("/loop-covers%2F")) return true;
  if (s.includes(".appspot.com") && s.includes("/loop-covers%2F")) return true;
  // Supabase Storage legacy
  if (s.includes("/storage/v1/object/public/loop-covers/")) return true;
  if (s.includes("/storage/v1/object/sign/loop-covers/")) return true;
  return false;
}

/** Chemin objet `{userId}/covers/{loopId}.jpg` depuis une URL publique loop-covers. */
export function parseLoopCoverStoragePath(coverUrl: unknown): string | null {
  const s = typeof coverUrl === "string" ? coverUrl.trim() : "";
  if (!s) return null;

  // Firebase Storage URL — path is URL-encoded as /loop-covers%2F{userId}%2Fcovers%2F{loopId}.ext
  if (s.includes("firebasestorage.googleapis.com") || s.includes(".appspot.com")) {
    const decoded = decodeURIComponent(s);
    const marker = "/loop-covers/";
    const idx = decoded.indexOf(marker);
    if (idx < 0) return null;
    const path = decoded.slice(idx + marker.length).split("?")[0]?.trim();
    if (!path || !path.includes("/")) return null;
    return path;
  }

  // Supabase Storage URL
  if (!isFirebaseStorageCoverUrl(s)) return null;
  const marker = "/loop-covers/";
  const idx = s.indexOf(marker);
  if (idx < 0) return null;
  const path = s.slice(idx + marker.length).split("?")[0]?.trim();
  if (!path || !path.includes("/")) return null;
  return path;
}

/** Supprime les fichiers cover du bucket (best-effort). */
export async function removeLoopCoverStorage(userId: string, loopId: string): Promise<void> {
  if (!userId || !loopId) return;
  try {
    // Try both common patterns
    const paths = [
      `${userId}/covers/${loopId}.jpg`,
      `${userId}/covers/${loopId}.png`,
      `${userId}/${loopId}.jpg`,
      `${userId}/${loopId}.png`,
    ];
    await supabase.storage.from(LOOP_COVERS_BUCKET).remove(paths);
  } catch {
    // ignore
  }
}

/**
 * Upload une image (URL HTTP, data:, ou blob:) vers le bucket loop-covers.
 * Retourne l'URL publique Firebase Storage ou null en cas d'erreur.
 */
export async function uploadLoopCoverImage(
  userId: string,
  loopId: string,
  sourceUrl: string,
  variant?: string,
): Promise<string | null> {
  const trimmed = sourceUrl.trim();
  if (!trimmed || (!trimmed.startsWith("data:") && !trimmed.startsWith("blob:") && !trimmed.startsWith("http"))) {
    return null;
  }
  try {
    const res = await fetch(trimmed);
    const blob = await res.blob();
    if (!blob.size) return null;
    if (blob.size > 5 * 1024 * 1024) return null; // 5 MB max

    const ext = blob.type.includes("png") ? "png" : "jpg";
    const variantSuffix = variant ? `-${variant.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48)}` : "";
    const path = `${userId}/covers/${loopId}${variantSuffix}.${ext}`;

    const { error } = await supabase.storage.from(LOOP_COVERS_BUCKET).upload(path, blob, {
      upsert: true,
      contentType: blob.type || "image/jpeg",
      cacheControl: "public, max-age=604800",
    });
    if (error) return null;

    const { data } = supabase.storage.from(LOOP_COVERS_BUCKET).getPublicUrl(path);
    return data.publicUrl?.trim() || null;
  } catch {
    return null;
  }
}
