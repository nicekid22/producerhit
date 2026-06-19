const STORAGE_KEY = "producerhit_checkout_abandoned_v1";
const LEGACY_SESSION_KEY = STORAGE_KEY;
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type CheckoutAbandoned = {
  plan: string;
  ts: number;
  location?: string;
};

function readStorage(storage: Storage): CheckoutAbandoned | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutAbandoned;
    if (!parsed?.plan || !parsed.ts) return null;
    if (Date.now() - parsed.ts > TTL_MS) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(storage: Storage, payload: CheckoutAbandoned): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    void 0;
  }
}

function removeStorage(storage: Storage): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    void 0;
  }
}

export function markCheckoutAbandoned(plan: string, location?: string): void {
  if (typeof window === "undefined") return;
  const payload: CheckoutAbandoned = { plan, ts: Date.now(), location };
  writeStorage(window.localStorage, payload);
  writeStorage(window.sessionStorage, payload);
}

/** Sync abandon to marketing_leads for logged-in users (nurture J+1). */
export function syncCheckoutAbandonNurture(plan: string, locale: string, location?: string): void {
  void import("@/lib/emailCapture").then(({ recordCheckoutAbandonLead }) =>
    recordCheckoutAbandonLead({ plan, locale, location }),
  );
}

export function readCheckoutAbandoned(): CheckoutAbandoned | null {
  if (typeof window === "undefined") return null;

  const fromLocal = readStorage(window.localStorage);
  if (fromLocal) {
    writeStorage(window.sessionStorage, fromLocal);
    return fromLocal;
  }

  const fromSession = readStorage(window.sessionStorage);
  if (fromSession) {
    writeStorage(window.localStorage, fromSession);
    return fromSession;
  }

  try {
    const legacyRaw = window.sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as CheckoutAbandoned;
      if (parsed?.plan && parsed.ts && Date.now() - parsed.ts <= TTL_MS) {
        markCheckoutAbandoned(parsed.plan, parsed.location);
        return parsed;
      }
    }
  } catch {
    void 0;
  }

  return null;
}

export function clearCheckoutAbandoned(): void {
  if (typeof window === "undefined") return;
  removeStorage(window.localStorage);
  removeStorage(window.sessionStorage);
}
