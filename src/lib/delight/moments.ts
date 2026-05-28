import toast from "react-hot-toast";
import { pickBeatReadyToast } from "@/lib/delight/copy";
import type { DelightKind } from "@/lib/delight/copy";

type TriggerOptions = {
  silentToast?: boolean;
  level?: number;
  streak?: number;
  emoji?: string;
  seed?: string;
};

/** Delight banners/confetti disabled — bonuses use LootRevealModal instead. */
export function triggerDelight(_kind: DelightKind, _locale: "en" | "fr", _options: TriggerOptions = {}) {
  void _kind;
  void _locale;
  void _options;
}

export function triggerBeatReady(locale: "en" | "fr", seed?: string, _options?: { isFirst?: boolean; versionCount?: number }) {
  toast.success(pickBeatReadyToast(locale, seed), { duration: 2800, icon: "🔥" });
}

export function triggerLevelUp(_locale: "en" | "fr", _level: number) {
  void _locale;
  void _level;
}

export function triggerAchievement(_locale: "en" | "fr", _emoji: string) {
  void _locale;
  void _emoji;
}
