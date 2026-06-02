import { parseStemsUrl } from "@/lib/publicLoops";

const STREAM_ACTION = "stream_public";

/** Rollback communauté : VITE_PUBLIC_ACE_STREAM=0 → pas d’inline DB ni URL stream_public. */
export function isPublicAceStreamEnabled(): boolean {
  return import.meta.env.VITE_PUBLIC_ACE_STREAM !== "0";
}

export function isDataAudioUrl(url: unknown): url is string {
  const s = typeof url === "string" ? url.trim() : "";
  return s.startsWith("data:audio/");
}

export function pickInlineProviderAudioUrl(audioUrlInput: unknown, stemsUrl?: unknown): string | null {
  const direct = typeof audioUrlInput === "string" ? audioUrlInput.trim() : "";
  if (isDataAudioUrl(direct)) return direct;

  const obj = parseStemsUrl(stemsUrl);
  const ace = obj?.ace && typeof obj.ace === "object" ? (obj.ace as Record<string, unknown>) : null;
  const fromAce = typeof ace?.providerDataUrl === "string" ? ace.providerDataUrl.trim() : "";
  if (isDataAudioUrl(fromAce)) return fromAce;

  return null;
}

/** Ajoute apikey pour les appels fetch (le tag <audio> ne peut pas envoyer de headers). */
export function withSupabaseFunctionAuth(url: string): string {
  const trimmed = url.trim();
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();
  if (!trimmed || !anon || !trimmed.includes("/functions/v1/")) return trimmed;
  try {
    const u = new URL(trimmed);
    if (!u.searchParams.has("apikey")) u.searchParams.set("apikey", anon);
    return u.toString();
  } catch {
    return trimmed;
  }
}

export function buildPublicAceStreamUrl(loopId: string): string {
  const id = loopId.trim();
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  if (!base || !id) return "";
  return withSupabaseFunctionAuth(
    `${base}/functions/v1/generate-loop-ace?action=${STREAM_ACTION}&loopId=${encodeURIComponent(id)}`,
  );
}

export function isPublicAceStreamUrl(url: unknown): boolean {
  const s = typeof url === "string" ? url.trim() : "";
  if (!s.startsWith("http://") && !s.startsWith("https://")) return false;
  try {
    const u = new URL(s);
    if (!u.pathname.includes("/functions/v1/generate-loop-ace")) return false;
    return u.searchParams.get("action") === STREAM_ACTION;
  } catch {
    return s.includes("generate-loop-ace") && s.includes(`action=${STREAM_ACTION}`);
  }
}

/** Jouable en communauté : URL HTTP ACE/CDN ou flux Edge public (pas bucket loop-audio). */
export function isPlayablePublicAudioUrl(url: unknown): boolean {
  const s = typeof url === "string" ? url.trim() : "";
  if (!s) return false;
  if (isPublicAceStreamUrl(s)) return true;
  if (s.startsWith("http://") || s.startsWith("https://")) {
    if (s.includes("/storage/v1/object/public/loop-audio/") || s.includes("/storage/v1/object/sign/loop-audio/")) {
      return true;
    }
    return true;
  }
  return false;
}
