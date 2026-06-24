import AsyncStorage from "@react-native-async-storage/async-storage";

const FIRST_BEAT_PAYWALL_KEY = "paywall_first_beat_shown";
const SOFT_QUOTA_KEY_PREFIX = "paywall_soft_quota_";

export function softQuotaStorageKey(date = new Date()): string {
  return `${SOFT_QUOTA_KEY_PREFIX}${date.getFullYear()}-${date.getMonth() + 1}`;
}

/** Once per user — show celebration upsell after first successful generation. */
export async function consumeFirstBeatPaywallPrompt(): Promise<boolean> {
  const seen = await AsyncStorage.getItem(FIRST_BEAT_PAYWALL_KEY);
  if (seen === "1") return false;
  await AsyncStorage.setItem(FIRST_BEAT_PAYWALL_KEY, "1");
  return true;
}

/** Once per calendar month when quota is low. */
export async function shouldShowSoftQuotaPaywall(): Promise<boolean> {
  const seen = await AsyncStorage.getItem(softQuotaStorageKey());
  return seen !== "1";
}

export async function dismissSoftQuotaPaywall(): Promise<void> {
  await AsyncStorage.setItem(softQuotaStorageKey(), "1");
}
