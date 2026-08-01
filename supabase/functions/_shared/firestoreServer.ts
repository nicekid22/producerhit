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

// ---------------------------------------------------------------------------
// Generation Jobs (Firestore)
// ---------------------------------------------------------------------------

export type FirestoreGenerationJob = {
  id: string;
  user_id: string;
  generation_key: string | null;
  status: "pending" | "running" | "completed" | "failed";
  mode: string | null;
  ace_task_id: string | null;
  ace_base_url: string | null;
  ace_key_index: number | null;
  audio_url: string | null;
  meta: Record<string, unknown> | null;
  error: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function fbGetGenerationJob(jobId: string): Promise<FirestoreGenerationJob | null> {
  const result = await firestoreFetch("GET", "generation_jobs/" + jobId);
  if (!result.ok || result.status === 404) return null;
  if (!result.data || typeof result.data !== "object") return null;
  const d = result.data as { fields?: Record<string, unknown> };
  return unwrapFirestoreDoc(d) as unknown as FirestoreGenerationJob | null;
}

export async function fbInsertGenerationJob(data: {
  id: string;
  user_id: string;
  generation_key: string | null;
  status: string;
  mode: string | null;
  payload: Record<string, unknown>;
}): Promise<boolean> {
  const now = new Date().toISOString();
  const fields = toFirestoreFields({
    id: data.id,
    user_id: data.user_id,
    generation_key: data.generation_key,
    status: data.status,
    mode: data.mode,
    payload: data.payload,
    created_at: now,
    updated_at: now,
  });
  const result = await firestoreFetch("POST", "generation_jobs?documentId=" + data.id, { fields });
  return result.ok;
}

export async function fbUpdateGenerationJob(jobId: string, patch: Record<string, unknown>): Promise<boolean> {
  const patchFields = toFirestoreFields({ ...patch, updated_at: new Date().toISOString() });
  const result = await firestoreFetch("PATCH", "generation_jobs/" + jobId, { fields: patchFields });
  return result.ok;
}

// ---------------------------------------------------------------------------
// Generation Usage Keys (Firestore)
// ---------------------------------------------------------------------------

export async function fbGetUsageKey(key: string): Promise<boolean> {
  const result = await firestoreFetch("GET", "generation_usage_keys/" + key);
  return result.ok && result.status !== 404;
}

export async function fbInsertUsageKey(key: string, userId: string): Promise<boolean> {
  const fields = toFirestoreFields({
    key,
    user_id: userId,
    created_at: new Date().toISOString(),
  });
  const result = await firestoreFetch("POST", "generation_usage_keys/" + key, { fields });
  return result.ok;
}

// ---------------------------------------------------------------------------
// Loops (Firestore — audio_url lookup only)
// ---------------------------------------------------------------------------

export async function fbGetLoop(loopId: string): Promise<Record<string, unknown> | null> {
  const result = await firestoreFetch("GET", "loops/" + loopId);
  if (!result.ok || result.status === 404) return null;
  if (!result.data || typeof result.data !== "object") return null;
  const d = result.data as { fields?: Record<string, unknown> };
  return unwrapFirestoreDoc(d);
}

export async function fbUpdateLoop(loopId: string, data: Record<string, unknown>): Promise<boolean> {
  const fields = toFirestoreFields(data);
  const result = await firestoreFetch("PATCH", "loops/" + loopId, { fields });
  return result.ok;
}

export async function fbFindPublicLoopByAceTaskId(taskId: string): Promise<string | null> {
  // Firestore doesn't have great OR/array-contains support for nested fields via REST.
  // Use a simple query on the loops collection looking for public loops.
  // We query each possible field path — this is a limitation of Firestore REST API.
  const safeTaskId = taskId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeTaskId) return null;

  const projectId = getProjectId();
  const token = await getAccessToken();
  if (!projectId || !token) return null;

  // Build a composite query: is_public=true AND (stems_url.ace.taskId = X OR stems_url.taskId = X)
  // Firestore REST API composite queries are limited. We'll query and filter client-side.
  const base = "https://firestore.googleapis.com/v1/projects/" + projectId + "/databases/(default)/documents:runQuery";
  const queryBody = {
    structuredQuery: {
      from: [{ collectionId: "loops" }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: [
            { fieldFilter: { field: { fieldPath: "is_public" }, op: "EQUAL", value: { booleanValue: true } } },
          ],
        },
      },
      limit: 10,
    },
  };

  try {
    const res = await fetch(base, {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(queryBody),
    });
    if (!res.ok) return null;
    const results = await res.json() as Array<{ document?: { name?: string; fields?: Record<string, unknown> } }>;
    for (const r of results) {
      if (!r.document?.fields) continue;
      const doc = r.document;
      const stemsUrl = doc.fields.stems_url;
      if (!stemsUrl || typeof stemsUrl !== "object") continue;
      const s = stemsUrl as Record<string, unknown>;
      // Check nested paths: stemsUrl.ace.taskId, stemsUrl.taskId, stemsUrl.ace.task_id, stemsUrl.task_id
      for (const key of ["ace", ""]) {
        const prefix = key ? key + "." : "";
        for (const suffix of ["taskId", "task_id"]) {
          const fieldPath = prefix + suffix;
          const ace = key ? (s[key] as Record<string, unknown> | undefined) : s;
          if (!ace) continue;
          const val = ace[suffix];
          if (typeof val === "string" && val === taskId) {
            // Extract doc ID from name: projects/x/databases/(default)/documents/loops/Y
            const match = doc.name?.match(/loops\/([^/]+)$/);
            if (match?.[1]) return match[1];
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// ---------------------------------------------------------------------------
// Voice Profiles (Firestore — read-only)
// ---------------------------------------------------------------------------

export async function fbGetVoiceProfile(profileId: string, userId: string): Promise<{ storage_path?: string; name?: string } | null> {
  const result = await firestoreFetch("GET", "voice_profiles/" + profileId);
  if (!result.ok || result.status === 404) return null;
  if (!result.data || typeof result.data !== "object") return null;
  const d = result.data as { fields?: Record<string, unknown> };
  const unwrapped = unwrapFirestoreDoc(d);
  if (!unwrapped) return null;
  // Verify ownership
  if (String(unwrapped.user_id) !== userId) return null;
  return {
    storage_path: typeof unwrapped.storage_path === "string" ? unwrapped.storage_path : undefined,
    name: typeof unwrapped.name === "string" ? unwrapped.name : undefined,
  };
}

// ---------------------------------------------------------------------------
// Usage / Billing helpers (Firestore)
// ---------------------------------------------------------------------------

export async function fbBumpUsage(userId: string): Promise<boolean> {
  const profile = await fbGetProfile(userId);
  if (!profile) return false;
  const current = typeof profile.loops_used_this_month === "number" ? profile.loops_used_this_month : 0;
  return fbUpdateProfile(userId, { loops_used_this_month: current + 1 } as Partial<FirestoreProfile>);
}

/**
 * Check usage for a given generation_key using Firestore.
 * Uses the generation_usage_keys collection for idempotency.
 * Returns { ok, plan, used, limit } based on profile limits.
 */
export async function fbCheckUsageIdempotent(userId: string, generationKey: string): Promise<{
  ok: boolean;
  plan: string;
  used: number;
  limit: number;
}> {
  const LIMITS_LOCAL = { free: 10, pro: 75, studio: 250, plus: 1000 };
  const profile = await fbGetProfile(userId);

  if (!profile) {
    // Profile not found in Firestore yet — fall back to reading from Supabase
    // using the service role key (bypasses RLS). This handles the case where
    // the Firestore profile hasn't been created/synced yet.
    try {
      const url = Deno.env.get("SUPABASE_URL") ?? "";
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      if (url && serviceKey) {
        const res = await fetch(url + "/rest/v1/profiles?id=eq." + encodeURIComponent(userId) + "&select=plan,loops_used_this_month,referral_bonus,level_bonus,daily_bonus_month,purchased_bonus", {
          headers: {
            Authorization: "Bearer " + serviceKey,
            apikey: serviceKey,
            Accept: "application/json",
          },
        });
        if (res.ok) {
          const rows = (await res.json()) as Array<Record<string, unknown>>;
          const row = rows?.[0];
          if (row) {
            const plan = typeof row.plan === "string" ? row.plan : "free";
            const normalized = plan === "plus" || plan === "studio" || plan === "pro" ? plan : "free";
            const used = typeof row.loops_used_this_month === "number" ? row.loops_used_this_month : 0;
            const baseLimit = LIMITS_LOCAL[normalized] ?? 10;
            const bonus =
              Math.max(0, typeof row.referral_bonus === "number" ? row.referral_bonus : 0) +
              Math.max(0, typeof row.level_bonus === "number" ? row.level_bonus : 0) +
              Math.max(0, typeof row.daily_bonus_month === "number" ? row.daily_bonus_month : 0) +
              Math.max(0, typeof row.purchased_bonus === "number" ? row.purchased_bonus : 0);
            const limit = baseLimit + bonus;
            const alreadyCounted = await fbGetUsageKey(generationKey);
            const ok = alreadyCounted || used < limit;
            // Sync plan back to Firestore so next call is fast
            await fbUpdateProfile(userId, {
              plan,
              loops_used_this_month: used,
              referral_bonus: typeof row.referral_bonus === "number" ? row.referral_bonus : 0,
              level_bonus: typeof row.level_bonus === "number" ? row.level_bonus : 0,
              daily_bonus_month: typeof row.daily_bonus_month === "number" ? row.daily_bonus_month : 0,
              purchased_bonus: typeof row.purchased_bonus === "number" ? row.purchased_bonus : 0,
            } as Partial<FirestoreProfile>).catch(() => {});
            return { ok, plan, used, limit };
          }
        }
      }
    } catch (e) {
      console.error("fbCheckCodeAtempotent Supabase fallback failed:", e);
    }
    // Last resort: allow generation (better to allow one extra than block a valid user)
    console.error("fbCheckCodeAtempotent: profile not found in Firestore or Supabase for user:", userId);
    return { ok: true, plan: "free", used: 0, limit: 10 };
  }

  const plan = typeof profile.plan === "string" ? profile.plan : "free";
  const normalized = plan === "plus" || plan === "studio" || plan === "pro" ? plan : "free";
  const used = typeof profile.loops_used_this_month === "number" ? profile.loops_used_this_month : 0;
  const baseLimit = LIMITS_LOCAL[normalized] ?? 10;
  const bonus =
    Math.max(0, typeof profile.referral_bonus === "number" ? profile.referral_bonus : 0) +
    Math.max(0, typeof profile.level_bonus === "number" ? profile.level_bonus : 0) +
    Math.max(0, typeof profile.daily_bonus_month === "number" ? profile.daily_bonus_month : 0) +
    Math.max(0, typeof profile.purchased_bonus === "number" ? profile.purchased_bonus : 0);
  const limit = baseLimit + bonus;

  // Check if already counted via generation_key
  const alreadyCounted = await fbGetUsageKey(generationKey);
  const ok = alreadyCounted || used < limit;

  return { ok, plan, used, limit };
}

/**
 * Record that a generation_key has been used (idempotent bump).
 */
export async function fbBumpUsageIdempotent(userId: string, generationKey: string): Promise<boolean> {
  // Insert usage key marker
  const keyOk = await fbInsertUsageKey(generationKey, userId);
  // Also increment the counter
  await fbBumpUsage(userId);
  return keyOk;
}

/**
 * Reset monthly usage if needed (called monthly).
 * In Firestore, this is handled by a Cloud Function or client-side.
 * Here we just check if reset is needed based on loops_reset_at.
 */
export async function fbResetUsageIfNeeded(userId: string): Promise<void> {
  const profile = await fbGetProfile(userId);
  if (!profile) return;
  const resetAt = typeof profile.loops_reset_at === "string" ? profile.loops_reset_at : null;
  if (!resetAt) return;
  const resetDate = new Date(resetAt);
  if (isNaN(resetDate.getTime())) return;
  if (new Date() >= resetDate) {
    // Reset usage counter
    await fbUpdateProfile(userId, {
      loops_used_this_month: 0,
      loops_reset_at: null,
    } as Partial<FirestoreProfile>);
  }
}

// ---------------------------------------------------------------------------
// Cloud Storage (Firebase) helpers
// ---------------------------------------------------------------------------

/**
 * Upload bytes to Firebase Cloud Storage.
 * Uses the service account to generate a signed URL or direct upload.
 * Falls back to storing in Firestore for small inline audio (data: URLs).
 */
export async function fbUploadToStorage(
  bucket: string,
  path: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<{ url?: string; error?: string }> {
  const json = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!json) return { error: "FIREBASE_SERVICE_ACCOUNT_JSON not set" };

  try {
    const creds = JSON.parse(json);
    const token = await getAccessToken();
    if (!token) return { error: "Could not get Firebase access token" };

    const projectId = creds.project_id;
    const storageBase = "https://storage.googleapis.com/upload/storage/v1/b/" + encodeURIComponent(bucket) + "/o";
    const uploadPath = encodeURIComponent(path);

    const res = await fetch(storageBase + "?uploadType=media&name=" + uploadPath, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800",
      },
      body: bytes,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { error: "Upload failed: " + res.status + " " + text };
    }

    const data = await res.json() as { bucket?: string; name?: string };
    if (data.bucket && data.name) {
      const publicUrl = "https://firebasestorage.googleapis.com/v0/b/" + data.bucket + "/o/" + encodeURIComponent(data.name) + "?alt=media";
      return { url: publicUrl };
    }
    return { error: "No URL returned from upload" };
  } catch (err) {
    return { error: String(err) };
  }
}

/**
 * Download from Firebase Cloud Storage.
 */
export async function fbDownloadFromStorage(
  bucket: string,
  path: string,
): Promise<{ bytes?: Uint8Array; mime?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { error: "Could not get Firebase access token" };

  const encodedPath = encodeURIComponent(path);
  const url = "https://storage.googleapis.com/storage/v1/b/" + encodeURIComponent(bucket) + "/o/" + encodedPath + "?alt=media";

  try {
    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return { error: "Download failed: " + res.status };
    const bytes = new Uint8Array(await res.arrayBuffer());
    const mime = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "application/octet-stream";
    return { bytes, mime };
  } catch (err) {
    return { error: String(err) };
  }
}

function unwrapFirestoreDoc(doc: { fields?: Record<string, unknown> } | null | undefined): Record<string, unknown> | null {
  if (!doc || !doc.fields) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    out[k] = unwrapFirestoreValue(v);
  }
  return out;
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
