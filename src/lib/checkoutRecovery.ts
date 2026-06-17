const STORAGE_KEY = "producerhit_checkout_abandoned_v1";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type CheckoutAbandoned = {
  plan: string;
  ts: number;
  location?: string;
};

export function markCheckoutAbandoned(plan: string, location?: string): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CheckoutAbandoned = { plan, ts: Date.now(), location };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    void 0;
  }
}

export function readCheckoutAbandoned(): CheckoutAbandoned | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutAbandoned;
    if (!parsed?.plan || !parsed.ts) return null;
    if (Date.now() - parsed.ts > TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearCheckoutAbandoned(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    void 0;
  }
}
