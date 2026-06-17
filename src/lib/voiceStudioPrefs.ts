const STORAGE_KEY = "producerhit_voice_studio_prefs_v1";

type VoiceStudioPrefs = {
  profileId: string | null;
  strength: number;
};

const DEFAULT: VoiceStudioPrefs = { profileId: null, strength: 0.72 };

function readAll(): Record<string, VoiceStudioPrefs> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, VoiceStudioPrefs>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, VoiceStudioPrefs>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

export function readVoiceStudioPrefs(userId: string): VoiceStudioPrefs {
  const row = readAll()[userId];
  if (!row) return { ...DEFAULT };
  return {
    profileId: typeof row.profileId === "string" ? row.profileId : null,
    strength: typeof row.strength === "number" && Number.isFinite(row.strength) ? row.strength : DEFAULT.strength,
  };
}

export function writeVoiceStudioPrefs(userId: string, patch: Partial<VoiceStudioPrefs>) {
  const all = readAll();
  const prev = all[userId] ?? { ...DEFAULT };
  all[userId] = {
    profileId: patch.profileId !== undefined ? patch.profileId : prev.profileId,
    strength: patch.strength !== undefined ? patch.strength : prev.strength,
  };
  writeAll(all);
}
