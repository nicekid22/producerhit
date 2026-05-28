import { supabase } from "@/lib/supabaseClient";

/** Upload vers Supabase Storage désactivé par défaut — on ne stocke que des URLs ACE en DB. */
export const SUPABASE_LOOP_AUDIO_UPLOAD = import.meta.env.VITE_SUPABASE_LOOP_AUDIO_UPLOAD === "1";

export function isSupabaseLoopAudioUrl(url: unknown): boolean {
  const s = typeof url === "string" ? url.trim() : "";
  if (!s) return false;
  return s.includes("/storage/v1/object/public/loop-audio/") || s.includes("/storage/v1/object/sign/loop-audio/");
}

const LOOP_AUDIO_EXTENSIONS = ["mp3", "wav", "m4a", "ogg", "webm"] as const;

/** Supprime les fichiers legacy du bucket (best-effort). */
export async function removeLoopAudioStorage(userId: string, loopId: string): Promise<void> {
  if (!userId || !loopId) return;
  const paths = LOOP_AUDIO_EXTENSIONS.map((ext) => `${userId}/${loopId}.${ext}`);
  try {
    await supabase.storage.from("loop-audio").remove(paths);
  } catch {
    // ignore — le fichier n'existe peut‑être pas
  }
}
