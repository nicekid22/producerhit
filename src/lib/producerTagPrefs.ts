const STORAGE_KEY = "producerhit_producer_tag_active_id";

export function readProducerTagActiveId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function writeProducerTagActiveId(tagId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!tagId) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, tagId);
  } catch {
    // ignore
  }
}
