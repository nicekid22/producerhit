import { useAudioRetentionModalStore } from "@/stores/audioRetentionModalStore";

const STORAGE_PREFIX = "pk.audioRetentionDaily.";

function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function shouldShowAudioRetentionDailyNotice(userId: string, dateKey = localDateKey()): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey(userId)) !== dateKey;
  } catch {
    return false;
  }
}

export function markAudioRetentionDailyNoticeShown(userId: string, dateKey = localDateKey()): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), dateKey);
  } catch {
    void 0;
  }
}

type ShowOpts = {
  expiredCount: number;
  plan: string;
  source: string;
};

/** Ouvre le modal cloud Plus (1×/jour max — voir hook). */
export function showAudioRetentionDailyNotice({ expiredCount, plan, source }: ShowOpts): void {
  useAudioRetentionModalStore.getState().openModal({
    expiredCount,
    plan,
    source,
  });
}
