import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Loop } from "@producerhit/shared";
import { resolveLoopCoverUrl } from "@/lib/loopDisplay";

const LAST_PLAYED_KEY = "ph_last_played_v1";

export type LastPlayedSnapshot = {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  coverUrl: string | null;
  savedAt: number;
};

export async function saveLastPlayed(loop: Loop): Promise<void> {
  const snapshot: LastPlayedSnapshot = {
    id: loop.id,
    name: loop.name,
    genre: loop.genre,
    bpm: loop.bpm,
    coverUrl: resolveLoopCoverUrl(loop),
    savedAt: Date.now(),
  };
  await AsyncStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(snapshot));
}

export async function readLastPlayed(): Promise<LastPlayedSnapshot | null> {
  const raw = await AsyncStorage.getItem(LAST_PLAYED_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LastPlayedSnapshot;
    if (!parsed?.id || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}
