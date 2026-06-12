const STORAGE_PREFIX = "producerhit_wav_coach_v1";

export type WavFormatCoachProgress = {
  proTipDone: boolean;
  freeTeaseDone: boolean;
  freeTeaseDismissedAt?: string;
};

const DEFAULT: WavFormatCoachProgress = {
  proTipDone: false,
  freeTeaseDone: false,
};

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}_${userId}`;
}

export function loadWavFormatCoachProgress(userId: string): WavFormatCoachProgress {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<WavFormatCoachProgress>;
    return {
      proTipDone: Boolean(parsed.proTipDone),
      freeTeaseDone: Boolean(parsed.freeTeaseDone),
      freeTeaseDismissedAt: parsed.freeTeaseDismissedAt,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveWavFormatCoachProgress(userId: string, patch: Partial<WavFormatCoachProgress>): WavFormatCoachProgress {
  const next = { ...loadWavFormatCoachProgress(userId), ...patch };
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    void 0;
  }
  return next;
}
