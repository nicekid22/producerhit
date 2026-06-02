import { nextAceKeyPreferIndex } from "@/lib/aceKeyRotation";

/** Clés ACE exposées côté navigateur (VITE_* → visibles dans le bundle). */

function splitKeys(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((k) => k.trim())
    .filter((k) => k.length >= 8);
}

let cachedKeys: string[] | null = null;

export function loadBrowserAceApiKeys(): string[] {
  if (cachedKeys) return cachedKeys;
  const fromList = splitKeys(import.meta.env.VITE_ACE_STEP_API_KEYS as string | undefined);
  const single = (import.meta.env.VITE_ACE_STEP_API_KEY as string | undefined)?.trim() ?? "";
  const merged: string[] = [];
  for (const k of [...fromList, single]) {
    if (k && !merged.includes(k)) merged.push(k);
  }
  cachedKeys = merged;
  return merged;
}

export function browserAceKeyCount(): number {
  return loadBrowserAceApiKeys().length;
}

export function usesDirectAceFromBrowser(): boolean {
  return browserAceKeyCount() > 0;
}

/** Index stable pour le slot 1 → clé 0, slot 2 → clé 1, etc. */
export function aceKeyIndexForGenerationSlot(slotIdx: 1 | 2): number {
  return slotIdx - 1;
}

export function pickBrowserAceApiKey(preferIndex?: number): string {
  const keys = loadBrowserAceApiKeys();
  if (!keys.length) throw new Error("Missing VITE_ACE_STEP_API_KEY");
  const idx =
    typeof preferIndex === "number" && Number.isFinite(preferIndex)
      ? Math.abs(Math.floor(preferIndex)) % keys.length
      : nextAceKeyPreferIndex() % keys.length;
  return keys[idx]!;
}
