import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProfile } from "@producerhit/shared";

const KEY_PREFIX = "producerhit_profile_v1:";

function cacheKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export async function loadProfileCache(userId: string): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    return parsed?.id === userId ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveProfileCache(userId: string, profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(profile));
  } catch {
    // ignore cache write failures
  }
}

export async function clearProfileCache(userId?: string): Promise<void> {
  try {
    if (userId) {
      await AsyncStorage.removeItem(cacheKey(userId));
      return;
    }
    const keys = await AsyncStorage.getAllKeys();
    const profileKeys = keys.filter((k) => k.startsWith(KEY_PREFIX));
    if (profileKeys.length) await AsyncStorage.multiRemove(profileKeys);
  } catch {
    // ignore
  }
}
