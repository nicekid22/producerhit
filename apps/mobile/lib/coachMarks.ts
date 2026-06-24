import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "producerhit_coach_marks_v1";

export type CoachMarkId = "create_prompt" | "create_genre" | "create_generate";

export async function loadCoachMarks(): Promise<Set<CoachMarkId>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is CoachMarkId => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export async function dismissCoachMark(id: CoachMarkId): Promise<Set<CoachMarkId>> {
  const marks = await loadCoachMarks();
  marks.add(id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...marks]));
  return marks;
}

export async function resetCoachMarks(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
