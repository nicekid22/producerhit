import type { AceMeta } from "@/lib/audioApi";
import type { AppLocale } from "@/i18n/config";

export type VoiceCloneAceMeta = {
  voiceClone?: boolean;
  voiceCloneFallback?: boolean;
  voiceCloneRequested?: boolean;
  voiceProfileId?: string;
  voiceProfileName?: string;
  voiceCloneStrength?: number;
  engine?: string;
};

export type LoopVoiceCloneInfo = {
  applied: boolean;
  fallback: boolean;
  profileId?: string;
  profileName?: string;
  strength?: number;
};

function readAceBlob(stemsUrl: unknown): Record<string, unknown> | null {
  if (!stemsUrl || typeof stemsUrl !== "object") return null;
  const ace = (stemsUrl as { ace?: unknown }).ace;
  if (!ace || typeof ace !== "object") return null;
  return ace as Record<string, unknown>;
}

export function voiceCloneFromAceMeta(meta: AceMeta | null | undefined): LoopVoiceCloneInfo | null {
  if (!meta) return null;
  const m = meta as AceMeta & VoiceCloneAceMeta;
  const requested =
    m.voiceClone === true ||
    m.voiceCloneRequested === true ||
    typeof m.voiceProfileId === "string" ||
    m.engine === "music-generate-voice-clone";
  if (!requested) return null;
  return {
    applied: m.voiceClone === true || m.engine === "music-generate-voice-clone",
    fallback: m.voiceCloneFallback === true,
    profileId: typeof m.voiceProfileId === "string" ? m.voiceProfileId : undefined,
    profileName: typeof m.voiceProfileName === "string" ? m.voiceProfileName : undefined,
    strength: typeof m.voiceCloneStrength === "number" ? m.voiceCloneStrength : undefined,
  };
}

export function voiceCloneFromStemsUrl(stemsUrl: unknown): LoopVoiceCloneInfo | null {
  const ace = readAceBlob(stemsUrl);
  if (!ace) return null;
  const requested =
    ace.voiceClone === true ||
    ace.voiceCloneRequested === true ||
    typeof ace.voiceProfileId === "string";
  if (!requested) return null;
  return {
    applied: ace.voiceClone === true,
    fallback: ace.voiceCloneFallback === true,
    profileId: typeof ace.voiceProfileId === "string" ? ace.voiceProfileId : undefined,
    profileName: typeof ace.voiceProfileName === "string" ? ace.voiceProfileName : undefined,
    strength: typeof ace.voiceCloneStrength === "number" ? ace.voiceCloneStrength : undefined,
  };
}

export function resolveLoopVoiceCloneInfo(loop: { stemsUrl?: unknown }): LoopVoiceCloneInfo | null {
  return voiceCloneFromStemsUrl(loop.stemsUrl);
}

export function voiceCloneStatusLabel(info: LoopVoiceCloneInfo | null, isFr: boolean): string | null {
  if (!info) return null;
  if (info.applied && !info.fallback) {
    const name = info.profileName?.trim();
    return isFr
      ? name
        ? `Voix clonée · ${name}`
        : "Voix clonée appliquée"
      : name
        ? `Voice clone · ${name}`
        : "Voice clone applied";
  }
  if (info.fallback) {
    return isFr ? "Voix demandée — génération ACE standard" : "Voice requested — standard ACE used";
  }
  return null;
}

export function voiceCloneToastMessage(
  meta: AceMeta | null | undefined,
  locale: AppLocale,
  requestedProfileName?: string | null,
): { type: "success" | "warning" | "info"; message: string } | null {
  const isFr = locale === "fr";
  const info = voiceCloneFromAceMeta(meta);
  if (!info && !requestedProfileName) return null;
  if (info?.applied && !info.fallback) {
    const name = info.profileName || requestedProfileName;
    return {
      type: "success",
      message: isFr
        ? name
          ? `Chanson générée avec ta voix « ${name} »`
          : "Chanson générée avec ton profil vocal"
        : name
          ? `Song generated with your voice « ${name} »`
          : "Song generated with your voice profile",
    };
  }
  if (info?.fallback || (requestedProfileName && !info?.applied)) {
    return {
      type: "warning",
      message: isFr
        ? "Profil vocal sélectionné, mais ACE a utilisé la voix par défaut (clone indisponible). Réessaie ou vérifie ton échantillon."
        : "Voice profile was selected, but ACE used the default singer (clone unavailable). Retry or check your sample.",
    };
  }
  return null;
}

export function buildAceVoiceCloneStemsFields(
  meta: AceMeta | null | undefined,
  opts?: { requestedProfileId?: string | null; requestedStrength?: number },
): Record<string, unknown> | null {
  const info = voiceCloneFromAceMeta(meta);
  const requestedId = info?.profileId || opts?.requestedProfileId?.trim() || "";
  if (!info && !requestedId) return null;
  return {
    voiceClone: info?.applied === true,
    voiceCloneFallback: info?.fallback === true,
    voiceCloneRequested: Boolean(requestedId || info),
    ...(requestedId ? { voiceProfileId: requestedId } : {}),
    ...(info?.profileName ? { voiceProfileName: info.profileName } : {}),
    ...(typeof info?.strength === "number"
      ? { voiceCloneStrength: info.strength }
      : typeof opts?.requestedStrength === "number"
        ? { voiceCloneStrength: opts.requestedStrength }
        : {}),
  };
}
