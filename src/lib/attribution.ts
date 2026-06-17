const STORAGE_KEY = "producerhit_attribution_v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ref?: string;
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  msclkid?: string;
  landing_path?: string;
  first_ts: number;
  last_ts: number;
};

function readRaw(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    if (!parsed?.first_ts || Date.now() - parsed.first_ts > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function write(next: Attribution) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    void 0;
  }
}

function pickParam(params: URLSearchParams, key: string): string | undefined {
  const v = params.get(key)?.trim();
  return v && v.length > 0 ? v.slice(0, 120) : undefined;
}

/** Capture UTM, ref, and ad click ids from the current URL (first + last touch). */
export function captureAttributionFromUrl(search: string, pathname: string) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const incoming: Partial<Attribution> = {
    utm_source: pickParam(params, "utm_source"),
    utm_medium: pickParam(params, "utm_medium"),
    utm_campaign: pickParam(params, "utm_campaign"),
    utm_content: pickParam(params, "utm_content"),
    utm_term: pickParam(params, "utm_term"),
    ref: pickParam(params, "ref") ?? pickParam(params, "referral"),
    gclid: pickParam(params, "gclid"),
    fbclid: pickParam(params, "fbclid"),
    ttclid: pickParam(params, "ttclid"),
    msclkid: pickParam(params, "msclkid"),
  };

  const hasSignal = Object.values(incoming).some(Boolean);
  if (!hasSignal) return;

  const prev = readRaw();
  const now = Date.now();
  const merged: Attribution = {
    ...(prev ?? {}),
    ...Object.fromEntries(Object.entries(incoming).filter(([, v]) => v != null && v !== "")),
    landing_path: prev?.landing_path ?? pathname,
    first_ts: prev?.first_ts ?? now,
    last_ts: now,
  };
  write(merged);
}

export function getAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  return readRaw();
}

export function getAttributionProps(): Record<string, string> {
  const a = getAttribution();
  if (!a) return {};
  const out: Record<string, string> = {};
  if (a.utm_source) out.utm_source = a.utm_source;
  if (a.utm_medium) out.utm_medium = a.utm_medium;
  if (a.utm_campaign) out.utm_campaign = a.utm_campaign;
  if (a.utm_content) out.utm_content = a.utm_content;
  if (a.utm_term) out.utm_term = a.utm_term;
  if (a.ref) out.ref = a.ref;
  if (a.gclid) out.gclid = a.gclid;
  if (a.fbclid) out.fbclid = a.fbclid;
  if (a.ttclid) out.ttclid = a.ttclid;
  if (a.msclkid) out.msclkid = a.msclkid;
  if (a.landing_path) out.landing_path = a.landing_path;
  return out;
}

export function clearAttributionAfterSignup() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    void 0;
  }
}
