// firestoreServer.ts — Firestore helpers for Supabase Edge Functions (Deno)
// All template literals avoid ${...} — Deno edge function bundler chokes on them.

import type { Timestamp } from "https://esm.sh/firebase@10/firestore@4.2.0";

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

let _projectId: string | null = null;
let _accessToken: string | null = null;
let _tokenExpiry = 0;

async function getAccessToken(): Promise<string | null> {
  if (_accessToken && Date.now() < _tokenExpiry - 60_000) return _accessToken;
  const json = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!json) return null;
  let creds: { client_email?: string; private_key?: string };
  try { creds = JSON.parse(json); } catch { return null; }
  const { client_email, private_key } = creds;
  if (!client_email || !private_key) return null;

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3_600;
  const jwtHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const jwtClaim = btoa(JSON.stringify({ iss: client_email, sub: client_email, aud: "https://oauth2.googleapis.com/token", iat: now, exp: expiry, scope: "https://www.googleapis.com/auth/datastore" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const signingInput = jwtHeader + "." + jwtClaim;
  const keyData = private_key.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\n/g, "");

  let binaryKey: ArrayBuffer;
  try {
    const raw = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
    binaryKey = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
  } catch { return null; }

  try {
    const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    const encoder = new TextEncoder();
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(signingInput));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const signedJwt = signingInput + "." + sigB64;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth2:grant-type:jwt-bearer", assertion: signedJwt }),
    });
    const data = await res.json() as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    _accessToken = data.access_token;
    _tokenExpiry = Date.now() + (data.expires_in ?? 3600) * 1000;
    return _accessToken;
  } catch { return null; }
}

function getProjectId(): string | null {
  if (_projectId) return _projectId;
  const json = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    _projectId = parsed.project_id ?? null;
    return _projectId;
  } catch { return null; }
}

async function firestoreFetch(method: "GET" | "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<{ ok: boolean; status: number; data?: unknown; text?: string }> {
  const projectId = getProjectId();
  const token = await getAccessToken();
  if (!projectId || !token) return { ok: false, status: 401 };

  const base = "https://firestore.googleapis.com/v1/projects/" + projectId + "/databases/(default)/documents";
  const url = path.startsWith("http") ? path : base + "/" + path;
  const opts: RequestInit = { method, headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" } };
  if (body !== undefined) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(url, opts);
    let data: unknown;
    let text = "";
    try { data = await res.json(); } catch { text = await res.text().catch(() => ""); }
    return { ok: res.ok, status: res.status, data, text };
  } catch (err) {
    return { ok: false, status: 0, text: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FirestoreProfile = {
  plan?: string;
  email?: string;
  username?: string;
  referral_code?: string;
  referral_bonus?: number;
  level_bonus?: number;
  daily_bonus_month?: number;
  purchased_bonus?: number;
  loops_used_this_month?: number;
  loops_reset_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  stripe_current_period_end?: string;
  hosted_audio_expires_at?: string;
  billing_source?: string;
  apple_original_transaction_id?: string;
  legal_first_name?: string;
  legal_last_name?: string;
  avatar_id?: number;
  created_at?: string;
  updated_at?: string;
};

// ---------------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------------

export async function fbGetProfile(userId: string): Promise<FirestoreProfile | null> {
  const result = await firestoreFetch("GET", "profiles/" + userId);
  if (!result.ok || result.status === 404) return null;
  if (!result.data || typeof result.data !== "object") return null;
  const d = result.data as { fields?: Record<string, unknown> };
  return unwrapFirestoreDoc(d);
}

export async function fbUpdateProfile(userId: string, data: Partial<FirestoreProfile>): Promise<boolean> {
  const patch = { ...data, updated_at: new Date().toISOString() };
  const result = await firestoreFetch("GET", "profiles/" + userId);
  if (!result.ok && result.status !== 404) return false;

  if (result.status === 404) {
    const fields = toFirestoreFields({ id: userId, ...patch });
    const r = await firestoreFetch("POST", "profiles?documentId=" + userId, { fields });
    return r.ok;
  } else {
    const fields = toFirestoreFields(patch);
    const r = await firestoreFetch("PATCH", "profiles/" + userId, { fields });
    return r.ok;
  }
}

export async function fbGrantCredits(userId: string, opts: { idempotencyKey: string; bonusType: "launch" | "purchased" | "custom"; credits: number }): Promise<void> {
  const { bonusType, credits } = opts;
  if (credits <= 0) return;
  const cap = Math.min(credits, 1000);
  const bonusField = bonusType === "purchased" ? "purchased_bonus" : "referral_bonus";

  const profile = await fbGetProfile(userId);
  const currentBonus = profile?.[bonusField as keyof FirestoreProfile] as number ?? 0;

  await fbUpdateProfile(userId, { [bonusField]: currentBonus + cap } as Partial<FirestoreProfile>);

  await fbLogBillingEvent({
    stripeEventId: opts.idempotencyKey,
    userId,
    eventType: bonusType === "purchased" ? "credit_pack_purchased" : "bonus_granted",
    metadata: { credits: cap, bonus_type: bonusType },
  });
}

export async function fbLogBillingEvent(opts: {
  stripeEventId: string;
  userId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeInvoiceId?: string | null;
  eventType: string;
  plan?: string | null;
  amountCents?: number | null;
  currency?: string;
  status?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const docId = opts.stripeEventId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const docFields = toFirestoreFields({
    stripe_event_id: opts.stripeEventId,
    user_id: opts.userId ?? null,
    stripe_subscription_id: opts.stripeSubscriptionId ?? null,
    stripe_invoice_id: opts.stripeInvoiceId ?? null,
    event_type: opts.eventType,
    plan: opts.plan ?? null,
    amount_cents: opts.amountCents ?? null,
    currency: opts.currency ?? "usd",
    status: opts.status ?? null,
    metadata: opts.metadata ?? {},
    created_at: new Date().toISOString(),
  });
  await firestoreFetch("POST", "billing_revenue_events/" + docId, { fields: docFields });
}

// ---------------------------------------------------------------------------
// Stripe customer <-> Firebase UID mapping
// ---------------------------------------------------------------------------

export async function fbResolveUidByStripeCustomerId(customerId: string): Promise<string | null> {
  if (!customerId) return null;
  const result = await firestoreFetch("GET", "stripe_customers/" + customerId);
  if (result.ok && result.data) {
    const d = unwrapFirestoreDoc(result.data as { fields?: Record<string, unknown> });
    if (d?.uid) return String(d.uid);
  }
  return null;
}

export async function fbRegisterStripeCustomer(userId: string, customerId: string): Promise<void> {
  if (!customerId || !userId) return;
  const fields = toFirestoreFields({ uid: userId, customer_id: customerId, created_at: new Date().toISOString() });
  await firestoreFetch("POST", "stripe_customers/" + customerId, { fields });
}

// ---------------------------------------------------------------------------
// Firestore field format helpers
// ---------------------------------------------------------------------------

function toFirestoreFields(obj: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!obj || typeof obj !== "object") return out;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = toFirestoreValue(v);
  }
  return out;
}

function toFirestoreValue(v: unknown): unknown {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: v } : { doubleValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: (v as unknown[]).map(toFirestoreValue) } };
  if (typeof v === "object") return { mapValue: { fields: toFirestoreFields(v) } };
  return { stringValue: String(v) };
}

function unwrapFirestoreDoc(doc: { fields?: Record<string, unknown> } | null | undefined): FirestoreProfile | null {
  if (!doc || !doc.fields) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    out[k] = unwrapFirestoreValue(v);
  }
  return out as FirestoreProfile;
}

function unwrapFirestoreValue(v: unknown): unknown {
  if (!v || typeof v !== "object") return v;
  const o = v as Record<string, unknown>;
  if ("stringValue" in o) return String(o.stringValue);
  if ("integerValue" in o) return Number.parseInt(String(o.integerValue), 10);
  if ("doubleValue" in o) return Number.parseFloat(String(o.doubleValue));
  if ("booleanValue" in o) return Boolean(o.booleanValue);
  if ("nullValue" in o) return null;
  if ("arrayValue" in o) {
    const av = o.arrayValue as Record<string, unknown>;
    if (Array.isArray(av.values)) return av.values.map(unwrapFirestoreValue);
    return [];
  }
  if ("mapValue" in o) {
    const mv = o.mapValue as Record<string, unknown>;
    if (mv.fields) return unwrapFirestoreDoc(mv as { fields: Record<string, unknown> });
  }
  return v;
}
