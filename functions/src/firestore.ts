// firestore.ts — Firebase Admin SDK helpers for Cloud Functions
// Replaces supabase/functions/_shared/firestoreServer.ts (REST API)

import * as admin from "firebase-admin";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

// ---------------------------------------------------------------------------
// Init (lazy — initialized on first call; eager init causes Cloud Functions
// v2 "User code failed to load" timeouts).
// ---------------------------------------------------------------------------

let _db: Firestore | null = null;
let _storage: Storage | null = null;

function getDb(): Firestore {
  if (!_db) {
    if (!admin.getApps().length) admin.initializeApp();
    _db = getFirestore();
  }
  return _db;
}

function getStorageInstance(): Storage {
  if (!_storage) {
    if (!admin.getApps().length) admin.initializeApp();
    _storage = getStorage();
  }
  return _storage;
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

// ---------------------------------------------------------------------------
// Profile helpers
// ---------------------------------------------------------------------------

export async function fbGetProfile(userId: string): Promise<FirestoreProfile | null> {
  const doc = await getDb().collection("profiles").doc(userId).get();
  if (!doc.exists) return null;
  return doc.data() as FirestoreProfile;
}

export async function fbUpdateProfile(userId: string, data: Partial<FirestoreProfile>): Promise<boolean> {
  const patch = { ...data, updated_at: new Date().toISOString() };
  await getDb().collection("profiles").doc(userId).set(patch, { merge: true });
  return true;
}

export async function fbGrantCredits(userId: string, opts: { idempotencyKey: string; bonusType: "launch" | "purchased" | "custom"; credits: number }): Promise<void> {
  const { bonusType, credits } = opts;
  if (credits <= 0) return;
  const cap = Math.min(credits, 1000);
  const bonusField = bonusType === "purchased" ? "purchased_bonus" : "referral_bonus";

  const profile = await fbGetProfile(userId);
  const currentBonus = (profile?.[bonusField as keyof FirestoreProfile] as number) ?? 0;

  await fbUpdateProfile(userId, { [bonusField]: currentBonus + cap } as Partial<FirestoreProfile>);

  await fbLogBillingEvent({
    stripeEventId: opts.idempotencyKey,
    userId,
    eventType: bonusType === "purchased" ? "credit_pack_purchased" : "bonus_granted",
    metadata: { credits: cap, bonus_type: bonusType },
  });
}

export async function fbBumpUsage(userId: string): Promise<boolean> {
  const profile = await fbGetProfile(userId);
  if (!profile) return false;
  const current = typeof profile.loops_used_this_month === "number" ? profile.loops_used_this_month : 0;
  return fbUpdateProfile(userId, { loops_used_this_month: current + 1 } as Partial<FirestoreProfile>);
}

// ---------------------------------------------------------------------------
// Billing helpers
// ---------------------------------------------------------------------------

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
  await getDb().collection("billing_revenue_events").doc(docId).set({
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
}

export async function fbResolveUidByStripeCustomerId(customerId: string): Promise<string | null> {
  if (!customerId) return null;
  const doc = await getDb().collection("stripe_customers").doc(customerId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  return data?.uid ? String(data.uid) : null;
}

export async function fbRegisterStripeCustomer(userId: string, customerId: string): Promise<void> {
  if (!customerId || !userId) return;
  await getDb().collection("stripe_customers").doc(customerId).set({
    uid: userId,
    customer_id: customerId,
    created_at: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Generation Jobs
// ---------------------------------------------------------------------------

export async function fbGetGenerationJob(jobId: string): Promise<FirestoreGenerationJob | null> {
  const doc = await getDb().collection("generation_jobs").doc(jobId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as FirestoreGenerationJob;
}

export async function fbInsertGenerationJob(data: {
  id: string;
  user_id: string;
  generation_key: string | null;
  status: string;
  mode: string | null;
  payload: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const sanitizedPayload = JSON.parse(JSON.stringify(data.payload ?? {}));
  await getDb().collection("generation_jobs").doc(data.id).set({
    id: data.id,
    user_id: data.user_id,
    generation_key: data.generation_key,
    status: data.status,
    mode: data.mode,
    payload: sanitizedPayload,
    created_at: now,
    updated_at: now,
  });
  return { ok: true };
}

export async function fbUpdateGenerationJob(jobId: string, patch: Record<string, unknown>): Promise<boolean> {
  await getDb().collection("generation_jobs").doc(jobId).set(
    { ...patch, updated_at: new Date().toISOString() },
    { merge: true },
  );
  return true;
}

// ---------------------------------------------------------------------------
// Usage / Idempotency
// ---------------------------------------------------------------------------

export async function fbGetUsageKey(key: string): Promise<boolean> {
  const doc = await getDb().collection("generation_usage_keys").doc(key).get();
  return doc.exists;
}

export async function fbInsertUsageKey(key: string, userId: string): Promise<boolean> {
  try {
    await getDb().collection("generation_usage_keys").doc(key).set({
      key,
      user_id: userId,
      created_at: new Date().toISOString(),
    });
    return true;
  } catch {
    return false;
  }
}

const LIMITS_LOCAL: Record<string, number> = { free: 10, pro: 75, studio: 250, plus: 1000 };

export async function fbCheckUsageIdempotent(userId: string, generationKey: string): Promise<{
  ok: boolean;
  plan: string;
  used: number;
  limit: number;
}> {
  const profile = await fbGetProfile(userId);

  if (!profile) {
    console.error("fbCheckUsageIdempotent: profile not found for user:", userId);
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

  const alreadyCounted = await fbGetUsageKey(generationKey);
  const ok = alreadyCounted || used < limit;

  return { ok, plan, used, limit };
}

export async function fbBumpUsageIdempotent(userId: string, generationKey: string): Promise<boolean> {
  const keyOk = await fbInsertUsageKey(generationKey, userId);
  if (keyOk) {
    await fbBumpUsage(userId);
  }
  return keyOk;
}

export async function fbResetUsageIfNeeded(userId: string): Promise<void> {
  const profile = await fbGetProfile(userId);
  if (!profile) return;
  const resetAt = typeof profile.loops_reset_at === "string" ? profile.loops_reset_at : null;
  if (!resetAt) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await fbUpdateProfile(userId, { loops_reset_at: nextMonth.toISOString() } as Partial<FirestoreProfile>);
    return;
  }
  const resetDate = new Date(resetAt);
  if (isNaN(resetDate.getTime())) return;
  if (new Date() >= resetDate) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await fbUpdateProfile(userId, {
      loops_used_this_month: 0,
      daily_bonus_month: 0,
      loops_reset_at: nextMonth.toISOString(),
    } as Partial<FirestoreProfile>);
  }
}

// ---------------------------------------------------------------------------
// Loops
// ---------------------------------------------------------------------------

export async function fbGetLoop(loopId: string): Promise<Record<string, unknown> | null> {
  const doc = await getDb().collection("loops").doc(loopId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function fbUpdateLoop(loopId: string, data: Record<string, unknown>): Promise<boolean> {
  await getDb().collection("loops").doc(loopId).set(data, { merge: true });
  return true;
}

// ---------------------------------------------------------------------------
// Voice Profiles
// ---------------------------------------------------------------------------

export async function fbGetVoiceProfile(profileId: string, userId: string): Promise<{ storage_path?: string; name?: string } | null> {
  const doc = await getDb().collection("voice_profiles").doc(profileId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;
  if (String(data.user_id) !== userId) return null;
  return {
    storage_path: typeof data.storage_path === "string" ? data.storage_path : undefined,
    name: typeof data.name === "string" ? data.name : undefined,
  };
}

// ---------------------------------------------------------------------------
// Cloud Storage
// ---------------------------------------------------------------------------

export async function fbUploadToStorage(
  bucket: string,
  path: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<{ url?: string; error?: string }> {
  try {
    const file = getStorageInstance().bucket(bucket).file(path);
    await file.save(Buffer.from(bytes), { contentType, public: true });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
    return { url };
  } catch (err) {
    return { error: String(err) };
  }
}

/**
 * Upload bytes to the default project bucket (Admin SDK `bucket()` with no name).
 * Firebase Storage uses a single bucket per project with path prefixes like "loop-covers/...".
 * Returns the public alt=media URL for the uploaded object (gated by storage rules `allow read: if true`).
 */
export async function fbUploadToDefaultBucket(
  path: string,
  bytes: Uint8Array,
  contentType: string,
  opts: { upsert?: boolean } = {},
): Promise<{ url?: string; error?: string }> {
  // Metadata edition races ("The metadata for object ... was edited during the operation")
  // happen when 2 concurrent uploads touch the same object path — typically preview + card
  // cover for the same loop. Retry once after a short pause to recover transparently.
  const attempts = opts.upsert ? 3 : 1;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const bucket = getStorageInstance().bucket();
      const file = bucket.file(path);
      // Firebase Storage file.save() fails on conflict — for upsert, attempt to delete first
      if (opts.upsert) {
        try {
          await file.delete({ ignoreNotFound: true });
        } catch {
          // ignore — may not exist
        }
      }
      await file.save(Buffer.from(bytes), {
        contentType,
        metadata: { cacheControl: "public, max-age=604800" },
      });
      await file.makePublic();
      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media`;
      return { url };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isMetadataRace = /metadata .* was edited|precondition/i.test(msg);
      if (attempt === attempts || !isMetadataRace) {
        return { error: msg };
      }
      // backoff before the next retry attempt
      await new Promise((r) => setTimeout(r, 350 * attempt));
    }
  }
  return { error: "upload_failed" };
}

export async function fbDownloadFromStorage(
  bucket: string,
  path: string,
): Promise<{ bytes?: Uint8Array; mime?: string; error?: string }> {
  try {
    const file = getStorageInstance().bucket(bucket).file(path);
    const [bytes] = await file.download();
    const [metadata] = await file.getMetadata();
    return { bytes: new Uint8Array(bytes), mime: metadata.contentType ?? "application/octet-stream" };
  } catch (err) {
    return { error: String(err) };
  }
}
