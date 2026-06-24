import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Loop } from "@producerhit/shared";
import type { CommunityLoop } from "@/lib/publicLoopsApi";

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type CacheEnvelope<T> = {
  savedAt: number;
  data: T;
};

/** In-memory snapshot so Library tab shows instantly on revisit (no AsyncStorage flash). */
let libraryMemory: { userId: string; loops: Loop[] } | null = null;

export function peekLibraryMemory(userId: string): Loop[] | null {
  return libraryMemory?.userId === userId ? libraryMemory.loops : null;
}

function setLibraryMemory(userId: string, loops: Loop[]) {
  libraryMemory = { userId, loops };
}

function libraryKey(userId: string) {  return `ph_cache_library_${userId}`;
}

const COMMUNITY_KEY = "ph_cache_community_v1";

function parseEnvelope<T>(raw: string | null): CacheEnvelope<T> | null {
  if (!raw) return null;
  try {
    const env = JSON.parse(raw) as CacheEnvelope<T>;
    if (!env || typeof env.savedAt !== "number" || !Array.isArray(env.data)) return null;
    if (Date.now() - env.savedAt > CACHE_MAX_AGE_MS) return null;
    return env;
  } catch {
    return null;
  }
}

export async function readLibraryCache(userId: string): Promise<Loop[] | null> {
  const env = parseEnvelope<Loop[]>(await AsyncStorage.getItem(libraryKey(userId)));
  const data = env?.data ?? null;
  if (data?.length) setLibraryMemory(userId, data);
  return data;
}

export async function writeLibraryCache(userId: string, loops: Loop[]): Promise<void> {
  setLibraryMemory(userId, loops);
  const env: CacheEnvelope<Loop[]> = { savedAt: Date.now(), data: loops };
  await AsyncStorage.setItem(libraryKey(userId), JSON.stringify(env));
}

export async function readCommunityCache(): Promise<CommunityLoop[] | null> {
  const env = parseEnvelope<CommunityLoop[]>(await AsyncStorage.getItem(COMMUNITY_KEY));
  return env?.data ?? null;
}

export async function writeCommunityCache(loops: CommunityLoop[]): Promise<void> {
  const env: CacheEnvelope<CommunityLoop[]> = { savedAt: Date.now(), data: loops };
  await AsyncStorage.setItem(COMMUNITY_KEY, JSON.stringify(env));
}
