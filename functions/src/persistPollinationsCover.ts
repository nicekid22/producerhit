// persistPollinationsCover.ts — Firebase Cloud Function (Node.js)
// Replaces supabase/functions/persist-pollinations-cover (Edge Function).
// Faithful replication of the original server-side gating+accounting flow:
//   - Auth via request.auth.uid
//   - Read Firestore `loops/{loopId}` doc, verify ownership
//   - purpose="card" + existing persisted cover: short-circuit, return existing URL
//   - purpose="distribution": checkAndBumpUsageIdempotent with `cover-ai:{uid}:{idempKey}`
//     reject with HttpsError("failed-precondition", "no_credits", {…}) if over quota
//   - preview mode: no DB read, no row update, only Storage upload (public URL)
//   - Download Pollinations JPEG (preview 768 / card 768 / distribution 1400)
//   - Upload to default bucket at `loop-covers/{uid}/covers/{loopId}[-{variant}].jpg`
//   - Merge cover into `stems_url.ace` (coverUrl, coverKind, coverSource, coverPrompt, coverRevision++)
//   - Update Firestore `loops/{loopId}` with new `stems_url` + `cover_url`
//   - purpose="distribution": bumpUsageIdempotent with same key (idempotent)
//   - Return {coverUrl, coverKind, source, skipped?, preview?}

import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDb() {
  if (!admin.getApps().length) admin.initializeApp();
  return getFirestore();
}

const MAX_IMAGE_BYTES = 2_200_000;

const FACE_QUALITY_NEGATIVE_PROMPT =
  "unfinished face, missing eye, asymmetrical eyes, blank eyes, cropped face, deformed face, extra eyes, mutated face, bad anatomy, lowres, blurry, watermark, text, signature, jpeg artifacts";

function safePrompt(input: unknown): string {
  const p = typeof input === "string" ? input.trim() : "";
  return p.replace(/\s+/g, " ").slice(0, 240);
}

function normalizeSeed(seed: unknown): number {
  const n = typeof seed === "number" ? seed : Number(seed);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

/** Stable storage variant suffix from (prompt, seed) — mirrors the original Supabase promptStorageVariant. */
function promptStorageVariant(prompt: string, seed: number): string {
  let h = 2166136261;
  for (let i = 0; i < prompt.length; i++) {
    h ^= prompt.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const digest = (h >>> 0).toString(36);
  return `${seed}-${digest}`.slice(0, 40);
}

function buildPollinationsUrl(prompt: string, seed: number, width: number, height: number): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=${width}&height=${height}&seed=${encodeURIComponent(String(seed))}&nologo=true&model=flux&enhance=true&negative_prompt=${encodeURIComponent(
    FACE_QUALITY_NEGATIVE_PROMPT,
  )}`;
}

async function downloadPollinationsJpeg(
  prompt: string,
  seed: number,
  width: number,
  height: number,
): Promise<Uint8Array | null> {
  const url = buildPollinationsUrl(prompt, seed, width, height);
  try {
    const fetch = (await import("node-fetch")).default as typeof import("node-fetch").default;
    const res = await fetch(url, {
      headers: { Accept: "image/*" },
      timeout: 25_000,
    });
    if (!res.ok) {
      console.warn("persistPollinationsCover: pollinations fetch failed", {
        status: res.status,
        promptHead: prompt.slice(0, 80),
      });
      return null;
    }
    const buf = await res.buffer();
    const bytes = new Uint8Array(buf);
    if (!bytes.byteLength || bytes.byteLength > MAX_IMAGE_BYTES) return null;
    return bytes;
  } catch (err) {
    console.warn("persistPollinationsCover: pollinations fetch error", {
      error: err instanceof Error ? err.message : String(err),
      promptHead: prompt.slice(0, 80),
    });
    return null;
  }
}

/** Detect cover.contentType from bytes — Pollinations returns JPEG by default. */
function detectContentType(bytes: Uint8Array): string {
  // JPEG SOI/EOI magic bytes: FF D8
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  return "image/jpeg";
}

function fileExtension(contentType: string): string {
  if (contentType.includes("png")) return "png";
  return "jpg";
}

async function uploadCoverToStorage(
  uid: string,
  loopId: string,
  bytes: Uint8Array,
  contentType: string,
  variant?: string,
): Promise<{ url: string } | { error: string }> {
  // Lazy import to avoid circular import at module load time
  const { fbUploadToDefaultBucket } = await import("./firestore");
  const ext = fileExtension(contentType);
  const sanitizedVariant =
    typeof variant === "string" && variant.trim()
      ? variant.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48)
      : "";
  const variantSuffix = sanitizedVariant ? `-${sanitizedVariant}` : "";
  const objectPath = `loop-covers/${uid}/covers/${loopId}${variantSuffix}.${ext}`;
  const result = await fbUploadToDefaultBucket(objectPath, bytes, contentType, { upsert: true });
  if (result.error) return { error: result.error };
  return { url: result.url as string };
}

/** Build the next stems_url map with the merged ace sub-object (mirrors Supabase mergeCoverIntoStems). */
function buildNextStems(
  stemsUrl: unknown,
  coverUrl: string,
  coverPrompt: string,
): Record<string, unknown> {
  const baseMap = (stemsUrl && typeof stemsUrl === "object") ? { ...(stemsUrl as Record<string, unknown>) } : {};
  const prevAceRaw = baseMap.ace;
  const prevAce = (prevAceRaw && typeof prevAceRaw === "object") ? { ...(prevAceRaw as Record<string, unknown>) } : {};
  const prevRevision = typeof prevAce.coverRevision === "number" && Number.isFinite(prevAce.coverRevision) ? prevAce.coverRevision : 0;
  const nextAce: Record<string, unknown> = {
    ...prevAce,
    coverUrl: coverUrl.trim(),
    coverKind: "image",
    coverSource: "pollinations",
    coverPrompt: coverPrompt.trim().slice(0, 240),
    coverRevision: prevRevision + 1,
  };
  baseMap.ace = nextAce;
  return baseMap;
}

/** Return true if `coverUrl` is already a persisted (Storage) URL — short-circuits card cover backfill. */
function isPersistedStorageCoverUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return (
    url.includes("/loop-covers/") ||
    url.includes("/loop-covers%2F") ||
    url.includes("firebasestorage.googleapis.com") && url.includes("loop-covers")
  );
}

// ---------------------------------------------------------------------------
// Usage / idempotency helpers (mirror generateLoopAce.ts but call firestore.ts)
// ---------------------------------------------------------------------------

const USAGE_KEY_PREFIX = "cover-ai:";

async function checkAndPrecheckUsage(uid: string, idempotencyKey: string): Promise<{
  ok: boolean;
  used: number;
  limit: number;
  plan: string;
}> {
  const { fbCheckUsageIdempotent } = await import("./firestore");
  const key = `${USAGE_KEY_PREFIX}${uid}:${idempotencyKey}`;
  return fbCheckUsageIdempotent(uid, key);
}

async function bumpUsageIdempotent(uid: string, idempotencyKey: string): Promise<boolean> {
  const { fbBumpUsageIdempotent } = await import("./firestore");
  const key = `${USAGE_KEY_PREFIX}${uid}:${idempotencyKey}`;
  return fbBumpUsageIdempotent(uid, key);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function persistPollinationsCoverHandler(request: {
  auth?: { uid: string };
  data: Record<string, unknown>;
}): Promise<{
  coverUrl: string | null;
  coverKind?: string;
  source?: string;
  skipped?: boolean;
  preview?: boolean;
  error?: string;
}> {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Not authenticated");
  }

  const body = request.data as Record<string, unknown>;
  const loopId = typeof body.loopId === "string" ? body.loopId.trim() : "";
  const prompt = safePrompt(body.prompt);
  const seed = normalizeSeed(body.seed);
  const idempotencyRaw = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
  const purpose = body.purpose === "card" ? "card" : "distribution";
  const previewMode = body.previewMode === true;

  if (!loopId || !prompt) {
    throw new HttpsError("invalid-argument", "loopId and prompt required");
  }

  const db = getDb();
  const { fbUpdateLoop } = await import("./firestore");

  // ── Preview mode: download + upload only, no DB row update ──────────
  if (previewMode) {
    const bytes = await downloadPollinationsJpeg(prompt, seed, 768, 768);
    if (!bytes) {
      throw new HttpsError("internal", "pollinations_failed");
    }
    const contentType = detectContentType(bytes);
    const variant = promptStorageVariant(prompt, seed);
    const saved = await uploadCoverToStorage(uid, loopId, bytes, contentType, variant);
    if ("error" in saved) {
      throw new HttpsError("internal", saved.error);
    }
    return { coverUrl: saved.url, coverKind: "image", source: "pollinations", preview: true };
  }

  // ── Read loop doc ──────────────────────────────────────────────────
  const loopDoc = await db.collection("loops").doc(loopId).get();
  if (!loopDoc.exists) {
    throw new HttpsError("not-found", "loop_not_found");
  }
  const loopRow = loopDoc.data() as { user_id?: unknown; stems_url?: unknown; cover_url?: unknown };
  const ownerId = loopRow.user_id;
  if (typeof ownerId !== "string" || String(ownerId) !== String(uid)) {
    throw new HttpsError("permission-denied", "loop_not_owned");
  }
  const existingCover = typeof loopRow.cover_url === "string" ? loopRow.cover_url.trim() : "";

  // ── Card cover + existing persisted cover: short-circuit ────────────
  if (purpose === "card" && isPersistedStorageCoverUrl(existingCover)) {
    return {
      coverUrl: existingCover,
      coverKind: "image",
      source: "pollinations",
      skipped: true,
    };
  }

  // ── Distribution: idempotent credit check ─────────────────────────
  if (purpose === "distribution") {
    if (idempotencyRaw.length < 8 || idempotencyRaw.length > 120) {
      throw new HttpsError("invalid-argument", "idempotency_key_required");
    }
    const usage = await checkAndPrecheckUsage(uid, idempotencyRaw);
    if (!usage.ok) {
      // 402 → no_credits. Client detects via error.message "no_credits" or via httpStatus/data.code.
      throw new HttpsError(
        "failed-precondition",
        "no_credits",
        { code: "no_credits", used: usage.used, limit: usage.limit, plan: usage.plan, httpStatus: 402 },
      );
    }
  }

  // ── Download Pollinations JPEG ────────────────────────────────────
  const cardSize = purpose === "card" ? 768 : 1400;
  const bytes = await downloadPollinationsJpeg(prompt, seed, cardSize, cardSize);
  if (!bytes) {
    throw new HttpsError("internal", "pollinations_failed");
  }
  const contentType = detectContentType(bytes);
  const variant = promptStorageVariant(prompt, seed);
  const saved = await uploadCoverToStorage(uid, loopId, bytes, contentType, variant);
  if ("error" in saved) {
    throw new HttpsError("internal", saved.error);
  }
  const coverUrl = saved.url;

  // ── Update Firestore loop doc (stems_url + cover_url) ──────────────
  const nextStems = buildNextStems(loopRow.stems_url, coverUrl, prompt);
  await fbUpdateLoop(loopId, {
    stems_url: nextStems,
    cover_url: coverUrl,
    updated_at: new Date().toISOString(),
  });

  // ── Distribution: bump idempotent usage after success ──────────────
  if (purpose === "distribution") {
    try {
      await bumpUsageIdempotent(uid, idempotencyRaw);
    } catch (err) {
      console.warn("persistPollinationsCover: bump usage failed", {
        userId: uid,
        loopId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { coverUrl, coverKind: "image", source: "pollinations" };
}
