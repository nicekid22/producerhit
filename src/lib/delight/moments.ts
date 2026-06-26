import { toastSuccess, TOAST_DURATIONS } from "@/lib/appToast";
import { pickBeatReadyToast } from "@/lib/delight/copy";
import type { DelightKind } from "@/lib/delight/copy";

import type { AppLocale } from "@/i18n/config";
type TriggerOptions = {
  silentToast?: boolean;
  level?: number;
  streak?: number;
  emoji?: string;
  seed?: string;
};

/** Delight banners/confetti disabled — bonuses use LootRevealModal instead. */
export function triggerDelight(_kind: DelightKind, _locale: AppLocale, _options: TriggerOptions = {}) {
  void _kind;
  void _locale;
  void _options;
}

export function triggerBeatReady(locale: AppLocale, seed?: string, _options?: { isFirst?: boolean; versionCount?: number }) {
  toastSuccess(pickBeatReadyToast(locale, seed), {
    duration: TOAST_DURATIONS.default,
    className: "pk-toast pk-toast--success pk-toast--delight",
    icon: "🔥",
  });
}

export function triggerLevelUp(_locale: AppLocale, _level: number) {
  void _locale;
  void _level;
}

export function triggerAchievement(_locale: AppLocale, _emoji: string) {
  void _locale;
  void _emoji;
}
