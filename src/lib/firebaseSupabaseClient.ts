import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query as fbQuery,
  where,
  orderBy,
  limit as fbLimit,
  onSnapshot,
  type Firestore,
  type DocumentData,
  type WhereFilterOp,
  type OrderByDirection,
  type Unsubscribe,
  increment,
  serverTimestamp,
  startAt,
  startAfter,
  endAt,
  endBefore,
  Timestamp,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  type StorageReference,
  type FirebaseStorage,
} from "firebase/storage";
import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  fbSignInWithPassword,
  fbSignUp,
  fbSignOut,
  fbOnAuthStateChange,
  fbGetSession,
  fbGetCurrentUser,
  fbResetPassword,
  fbUpdatePassword,
  fbSignInWithGoogle,
  fbSendVerificationEmail,
  supabaseUserFromFirebase,
} from "@/lib/firebaseAuth";
import { mirrorEventToAdPixels, shouldMirrorToServer } from "@/lib/adPixels";
import { sendServerConversion } from "@/lib/conversionApi";
import { getAttributionProps } from "@/lib/attribution";
import { getOrCreateSessionId } from "@/lib/sessionId";
import { REFERRAL_REFEREE_BONUS, REFERRAL_REFERRER_SIGNUP_BONUS } from "@/lib/referralConfig";

// ---------------------------------------------------------------------------
// Firebase Init
// ---------------------------------------------------------------------------

function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  };
}

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;
let _initialized = false;

function ensureFirebase() {
  if (_initialized) return;
  _initialized = true;
  const cfg = getFirebaseConfig();
  if (!cfg.apiKey || !cfg.projectId) return;
  try {
    _app = initializeApp(cfg);
    _db = getFirestore(_app);
    _auth = getAuth(_app);
    _storage = getStorage(_app);
  } catch {
    // already initialized or invalid config
  }
}

function fbDb(): Firestore | null {
  ensureFirebase();
  return _db;
}

export { fbDb };

function fbAuth(): Auth | null {
  ensureFirebase();
  return _auth;
}

function fbStorageInstance(): FirebaseStorage | null {
  ensureFirebase();
  return _storage;
}

export function isFirebaseReady(): boolean {
  ensureFirebase();
  return _db !== null && _auth !== null;
}

/** Expose the Firebase app instance so other modules don't call initializeApp again. */
export function getFirebaseApp(): FirebaseApp | null {
  ensureFirebase();
  return _app;
}

// ---------------------------------------------------------------------------
// Query Builder — Firebase-backed PostgREST-compatible chainable API
// ---------------------------------------------------------------------------

type FilterClause = { col: string; op: WhereFilterOp | "in" | "is"; val: unknown };
type OrderClause = { col: string; dir: OrderByDirection };

class FirebaseQueryBuilder {
  private tableName: string;
  private filters: FilterClause[] = [];
  private orders: OrderClause[] = [];
  private limitCount: number | null = null;
  private mode: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Record<string, unknown> | null = null;
  private upsertConflict: string | string[] | null = null;
  private expectSingle = false;
  private expectMaybeSingle = false;
  private headOnly = false;
  private countExact = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns?: string, opts?: { count?: "exact"; head?: boolean }) {
    if (opts?.count === "exact") this.countExact = true;
    if (opts?.head) this.headOnly = true;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ col, op: "==", val });
    return this;
  }

  neq(col: string, val: unknown) {
    this.filters.push({ col, op: "!=", val });
    return this;
  }

  gt(col: string, val: unknown) {
    this.filters.push({ col, op: ">", val });
    return this;
  }

  gte(col: string, val: unknown) {
    this.filters.push({ col, op: ">=", val });
    return this;
  }

  lt(col: string, val: unknown) {
    this.filters.push({ col, op: "<", val });
    return this;
  }

  lte(col: string, val: unknown) {
    this.filters.push({ col, op: "<=", val });
    return this;
  }

  in(col: string, vals: unknown[]) {
    this.filters.push({ col, op: "in", val: vals });
    return this;
  }

  is(col: string, val: unknown) {
    if (val === null) {
      this.filters.push({ col, op: "==", val: null });
    } else {
      this.filters.push({ col, op: "==", val });
    }
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, dir: opts?.ascending === false ? "desc" : "asc" });
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.expectSingle = true;
    return this;
  }

  maybeSingle() {
    this.expectMaybeSingle = true;
    return this;
  }

  insert(payload: Record<string, unknown>) {
    this.mode = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.mode = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: Record<string, unknown>, opts?: { onConflict?: string | string[] }) {
    this.mode = "upsert";
    this.payload = payload;
    this.upsertConflict = opts?.onConflict ?? null;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  // Thenable — makes this work with await
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  then(onfulfilled?: ((value: any) => any) | null, onrejected?: ((reason: any) => any) | null): Promise<any> {
    const result = this.execute();
    return result.then(onfulfilled ?? null, onrejected ?? null);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch(onrejected?: ((reason: any) => any) | null): Promise<any> {
    return this.execute().catch(onrejected ?? null);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  finally(onfinally?: (() => void) | null): Promise<any> {
    return this.execute().finally(onfinally ?? undefined);
  }

  // ── Execution ──────────────────────────────────────────────

  private async execute(): Promise<{ data: unknown; error: unknown; count?: number | null }> {
    const db = fbDb();
    if (!db) return { data: null, error: new Error("Firebase not configured") };

    try {
      switch (this.mode) {
        case "insert":
          return this.executeInsert(db);
        case "update":
          return this.executeUpdate(db);
        case "upsert":
          return this.executeUpsert(db);
        case "delete":
          return this.executeDelete(db);
        default:
          return this.executeSelect(db);
      }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  private async executeSelect(db: Firestore): Promise<{ data: unknown; error: unknown; count?: number | null }> {
    if (this.expectSingle || this.expectMaybeSingle) {
      return this.executeSelectSingle(db);
    }
    return this.executeSelectMany(db);
  }

  private async executeSelectSingle(db: Firestore): Promise<{ data: unknown; error: unknown; count?: number | null }> {
    const idFilter = this.filters.find((f) => f.col === "id" && f.op === "==");
    if (idFilter && typeof idFilter.val === "string") {
      const docRef = doc(db, this.tableName, idFilter.val);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        if (this.expectSingle) return { data: null, error: new Error("Row not found") };
        return { data: null, error: null };
      }
      const data = { id: snap.id, ...snap.data() };
      // Apply remaining filters client-side
      if (!this.matchesRemainingFilters(data, idFilter)) {
        if (this.expectSingle) return { data: null, error: new Error("Row not found") };
        return { data: null, error: null };
      }
      return { data, error: null };
    }

    const ref = collection(db, this.tableName);
    let q = this.buildQuery(ref);
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const filtered = this.applyClientFilters(results);

    if (filtered.length === 0) {
      if (this.expectSingle) return { data: null, error: new Error("Row not found") };
      return { data: null, error: null };
    }
    if (this.expectSingle && filtered.length > 1) {
      return { data: null, error: new Error("Multiple rows returned") };
    }
    const data = filtered[0] ?? null;
    if (this.expectSingle && !data) return { data: null, error: new Error("Row not found") };
    return { data, error: null };
  }

  private async executeSelectMany(db: Firestore): Promise<{ data: unknown; error: unknown; count?: number | null }> {
    const ref = collection(db, this.tableName);
    let q = this.buildQuery(ref);
    const snap = await getDocs(q);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let results: any[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    results = this.applyClientFilters(results);

    if (this.headOnly) {
      return { data: null, error: null, count: results.length };
    }

    return {
      data: results,
      error: null,
      count: this.countExact ? results.length : null,
    };
  }

  private async executeInsert(db: Firestore): Promise<{ data: unknown; error: unknown }> {
    const payload = this.payload ?? {};
    const ref = collection(db, this.tableName);

    if (payload.id && typeof payload.id === "string") {
      const docRef = doc(db, this.tableName, payload.id as string);
      await setDoc(docRef, { ...payload, created_at: payload.created_at ?? new Date().toISOString() });
      return { data: { id: payload.id, ...payload }, error: null };
    }

    const docRef = await addDoc(ref, { ...payload, created_at: payload.created_at ?? new Date().toISOString() });
    return { data: { id: docRef.id, ...payload }, error: null };
  }

  private async executeUpdate(db: Firestore): Promise<{ data: unknown; error: unknown }> {
    const payload = this.payload ?? {};

    const idFilter = this.filters.find((f) => f.col === "id" && f.op === "==");
    if (idFilter && typeof idFilter.val === "string") {
      const docRef = doc(db, this.tableName, idFilter.val as string);
      await updateDoc(docRef, { ...payload, updated_at: payload.updated_at ?? new Date().toISOString() });
      const snap = await getDoc(docRef);
      return { data: snap.exists() ? { id: snap.id, ...snap.data() } : null, error: null };
    }

    // Multi-document update: fetch matching docs and update each
    const ref = collection(db, this.tableName);
    let q = this.buildQuery(ref);
    const snap = await getDocs(q);
    const results = this.applyClientFilters(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

    for (const row of results) {
      const docRef = doc(db, this.tableName, (row as Record<string, unknown>).id as string);
      await updateDoc(docRef, { ...payload, updated_at: payload.updated_at ?? new Date().toISOString() });
    }

    return { data: results[results.length - 1] ?? null, error: null };
  }

  private async executeUpsert(db: Firestore): Promise<{ data: unknown; error: unknown }> {
    const payload = this.payload ?? {};

    if (payload.id && typeof payload.id === "string") {
      const docRef = doc(db, this.tableName, payload.id as string);
      await setDoc(docRef, payload, { merge: true });
      return { data: { id: payload.id, ...payload }, error: null };
    }

    // For upsert without id, try to find by conflict key
    if (this.upsertConflict && typeof this.upsertConflict === "string") {
      const conflictCol = this.upsertConflict as string;
      const conflictVal = payload[conflictCol];
      if (conflictVal) {
        const ref = collection(db, this.tableName);
        const q = fbQuery(ref, where(conflictCol, "==", conflictVal));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const existingDoc = snap.docs[0];
          await updateDoc(doc(db, this.tableName, existingDoc.id), payload);
          return { data: { id: existingDoc.id, ...payload }, error: null };
        }
      }
    }

    const docRef = await addDoc(collection(db, this.tableName), payload);
    return { data: { id: docRef.id, ...payload }, error: null };
  }

  private async executeDelete(db: Firestore): Promise<{ data: unknown; error: unknown }> {
    const idFilter = this.filters.find((f) => f.col === "id" && f.op === "==");
    if (idFilter && typeof idFilter.val === "string") {
      const docRef = doc(db, this.tableName, idFilter.val as string);
      await deleteDoc(docRef);
      return { data: null, error: null };
    }

    // Multi-document delete
    const ref = collection(db, this.tableName);
    let q = this.buildQuery(ref);
    const snap = await getDocs(q);
    const results = this.applyClientFilters(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

    for (const row of results) {
      const docRef = doc(db, this.tableName, (row as Record<string, unknown>).id as string);
      await deleteDoc(docRef);
    }
    return { data: null, error: null };
  }

  // ── Query Construction ─────────────────────────────────────

  private buildQuery(ref: ReturnType<typeof collection>) {
    // Only use filters that Firestore can handle natively (equality on first indexed field)
    // Complex filters will be applied client-side
    let constraints: unknown[] = [];

    // Add native-compatible filters
    for (const f of this.filters) {
      if (f.op === "==" && f.val !== null && f.col !== "id") {
        constraints.push(where(f.col, "==", f.val));
      } else if (f.op === "in" && f.col !== "id") {
        constraints.push(where(f.col, "in", f.val as unknown[]));
      }
    }

    // Add order
    for (const o of this.orders) {
      constraints.push(orderBy(o.col, o.dir));
    }

    // Add limit (increase for client-side filtering)
    if (this.limitCount != null) {
      constraints.push(fbLimit(this.limitCount * 2));
    }

    return constraints.length > 0
      ? fbQuery(ref, ...(constraints as Parameters<typeof fbQuery>[1][]))
      : ref;
  }

  private applyClientFilters(results: Record<string, unknown>[]): Record<string, unknown>[] {
    let filtered = results;

    for (const f of this.filters) {
      if (f.op === "==") {
        filtered = filtered.filter((r) => r[f.col] === f.val);
      } else if (f.op === "!=") {
        filtered = filtered.filter((r) => r[f.col] !== f.val);
      } else if (f.op === ">") {
        filtered = filtered.filter((r) => (r[f.col] as number) > (f.val as number));
      } else if (f.op === ">=") {
        filtered = filtered.filter((r) => (r[f.col] as number) >= (f.val as number));
      } else if (f.op === "<") {
        filtered = filtered.filter((r) => (r[f.col] as number) < (f.val as number));
      } else if (f.op === "<=") {
        filtered = filtered.filter((r) => (r[f.col] as number) <= (f.val as number));
      } else if (f.op === "in") {
        const vals = f.val as unknown[];
        filtered = filtered.filter((r) => vals.includes(r[f.col]));
      }
    }

    // Apply limit after client-side filtering
    if (this.limitCount != null && filtered.length > this.limitCount) {
      filtered = filtered.slice(0, this.limitCount);
    }

    return filtered;
  }

  private matchesRemainingFilters(row: Record<string, unknown>, excludeFilter: FilterClause): boolean {
    const otherFilters = this.filters.filter((f) => f !== excludeFilter);
    for (const f of otherFilters) {
      if (f.op === "==" && row[f.col] !== f.val) return false;
      if (f.op === "!=" && row[f.col] === f.val) return false;
      if (f.op === "in" && !(f.val as unknown[]).includes(row[f.col])) return false;
    }
    return true;
  }
}

// ---------------------------------------------------------------------------
// RPC implementations (Firestore-backed)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function firebaseRpc(name: string, args?: Record<string, unknown>): Promise<any> {
  const db = fbDb();
  if (!db) return { data: null, error: new Error("Firebase not configured") };

  try {
    switch (name) {
      // ── Profile ──────────────────────────────────────────────
      case "ensure_profile":
      case "repair_missing_profile":
      case "load_session_profile":
      case "reconcile_profile_by_email":
        return { data: { ok: true, status: name }, error: null };

      case "update_creator_profile": {
        const pPayload = (args?.p_payload ?? {}) as Record<string, unknown>;
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: { ok: false, error: "not_authenticated" }, error: null };
        const docRef = doc(db, "profiles", user.uid);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return { data: { ok: false, error: "profile_not_found" }, error: null };
        const existing = snap.data();
        if (pPayload.username && existing.username !== pPayload.username) {
          const q = fbQuery(collection(db, "profiles"), where("username", "==", pPayload.username));
          const conflictSnap = await getDocs(q);
          const conflict = conflictSnap.docs.find((d) => d.id !== user.uid);
          if (conflict) return { data: { ok: false, error: "username_taken" }, error: null };
        }
        await updateDoc(docRef, { ...pPayload, updated_at: new Date().toISOString() });
        return { data: { ok: true }, error: null };
      }

      case "toggle_profile_follow": {
        const followingId = args?.p_following_id as string;
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: { ok: false, error: "not_authenticated" }, error: null };
        const followDoc = doc(db, "profile_follows", `${user.uid}_${followingId}`);
        const followSnap = await getDoc(followDoc);
        let following: boolean;
        if (followSnap.exists()) {
          await deleteDoc(followDoc);
          following = false;
        } else {
          await setDoc(followDoc, { follower_id: user.uid, following_id: followingId, created_at: new Date().toISOString() });
          following = true;
        }
        const profileRef = doc(db, "profiles", followingId);
        const profileSnap = await getDoc(profileRef);
        const followers_count = (profileSnap.data()?.followers_count as number ?? 0) + (following ? 1 : -1);
        return { data: { ok: true, following, followers_count: Math.max(0, followers_count) }, error: null };
      }

      case "get_public_profile_cards": {
        const userIds = (args?.p_user_ids ?? []) as string[];
        const results: Record<string, unknown>[] = [];
        for (const uid of userIds) {
          const docRef = doc(db, "profiles", uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const d = snap.data();
            results.push({
              id: snap.id,
              username: d.username ?? null,
              avatar_id: d.avatar_id ?? 1,
              creator_type: d.creator_type ?? null,
            });
          }
        }
        return { data: results, error: null };
      }

      case "get_public_profile": {
        const username = (args?.p_username ?? "") as string;
        const q = fbQuery(collection(db, "profiles"), where("username", "==", username));
        const snap = await getDocs(q);
        if (snap.empty) return { data: null, error: new Error("Profile not found") };
        const d = snap.docs[0].data();
        return {
          data: {
            ok: true,
            profile: {
              id: snap.docs[0].id,
              username: d.username ?? null,
              avatar_id: d.avatar_id ?? 1,
              creator_type: d.creator_type ?? null,
              bio: d.bio ?? null,
              social: d.social ?? {},
              followers_count: d.followers_count ?? 0,
              following_count: d.following_count ?? 0,
              public_loops_count: d.public_loops_count ?? 0,
              is_following: false,
            },
          },
          error: null,
        };
      }

      case "list_user_public_loops": {
        const userId = (args?.p_user_id ?? "") as string;
        const pLimit = (args?.p_limit ?? 24) as number;
        const q = fbQuery(
          collection(db, "loops"),
          where("user_id", "==", userId),
          where("is_public", "==", true),
          orderBy("created_at", "desc"),
          fbLimit(pLimit),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return { data, error: null };
      }

      // ── Usage ────────────────────────────────────────────────
      case "reset_loops_usage_if_needed": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: null, error: null };
        try {
          const profileRef = doc(db, "profiles", user.uid);
          const snap = await getDoc(profileRef);
          if (!snap.exists()) return { data: null, error: null };
          const profile = snap.data();
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const lastReset = profile.loops_reset_at as string | undefined;
          const lastResetMonth = lastReset ? new Date(lastReset).toISOString().slice(0, 7) : null;
          if (lastResetMonth !== currentMonth) {
            await updateDoc(profileRef, {
              loops_used_this_month: 0,
              loops_reset_at: now.toISOString(),
            });
          }
          return { data: null, error: null };
        } catch {
          return { data: null, error: null };
        }
      }

      case "check_loops_usage_idempotent": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: null, error: null };
        try {
          const profileRef = doc(db, "profiles", user.uid);
          const snap = await getDoc(profileRef);
          if (!snap.exists()) return { data: null, error: null };
          const p = snap.data();
          const used = (p.loops_used_this_month as number) ?? 0;
          const plan = (p.plan as string) ?? "free";
          const PLAN_LIMITS: Record<string, number> = { free: 10, pro: 75, studio: 250, plus: 1000 };
          const baseLimit = PLAN_LIMITS[plan] ?? 10;
          const bonus = Math.max(0, (p.referral_bonus as number) ?? 0)
            + Math.max(0, (p.level_bonus as number) ?? 0)
            + Math.max(0, (p.daily_bonus_month as number) ?? 0)
            + Math.max(0, (p.purchased_bonus as number) ?? 0);
          return { data: { used, limit: baseLimit + bonus, plan }, error: null };
        } catch {
          return { data: null, error: null };
        }
      }

      // ── Referral ─────────────────────────────────────────────
      case "ensure_referral_code": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: null, error: new Error("not_authenticated") };
        const profileRef = doc(db, "profiles", user.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists() && snap.data().referral_code) {
          return { data: snap.data().referral_code, error: null };
        }
        const code = generateReferralCode();
        await updateDoc(profileRef, { referral_code: code });
        return { data: code, error: null };
      }

      case "claim_referral": {
        const refCode = args?.p_code as string;
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: { ok: false, error: "not_authenticated" }, error: null };
        const q = fbQuery(collection(db, "profiles"), where("referral_code", "==", refCode));
        const snap = await getDocs(q);
        if (snap.empty) return { data: { ok: false, error: "invalid_code" }, error: null };
        const referrerId = snap.docs[0].id;
        if (referrerId === user.uid) return { data: { ok: false, error: "self_referral" }, error: null };
        const referralRef = doc(db, "referrals", `${user.uid}_${referrerId}`);
        const existingSnap = await getDoc(referralRef);
        if (existingSnap.exists()) return { data: { ok: false, error: "already_referred" }, error: null };
        await setDoc(referralRef, {
          referrer_id: referrerId,
          referred_id: user.uid,
          created_at: new Date().toISOString(),
          bonus_claimed: false,
        });
        // Referrer gets REFERRAL_REFERRER_SIGNUP_BONUS (20), referee gets REFERRAL_REFEREE_BONUS (10)
        await updateDoc(doc(db, "profiles", referrerId), {
          referral_bonus: increment(REFERRAL_REFERRER_SIGNUP_BONUS),
        });
        await updateDoc(doc(db, "profiles", user.uid), {
          referral_bonus: increment(REFERRAL_REFEREE_BONUS),
        });
        return { data: { ok: true, bonus: REFERRAL_REFEREE_BONUS }, error: null };
      }

      case "get_referral_stats": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: null, error: new Error("not_authenticated") };
        const q = fbQuery(collection(db, "referrals"), where("referrer_id", "==", user.uid));
        const snap = await getDocs(q);
        const total = snap.size;
        const bonusQ = fbQuery(collection(db, "referrals"), where("referrer_id", "==", user.uid), where("bonus_claimed", "==", true));
        const bonusSnap = await getDocs(bonusQ);
        return { data: { total, active: bonusSnap.size, pending: total - bonusSnap.size }, error: null };
      }

      case "get_referral_leaderboard": {
        const q = fbQuery(collection(db, "profiles"), orderBy("referral_bonus", "desc"), fbLimit(20));
        const snap = await getDocs(q);
        const data = snap.docs
          .filter((d) => (d.data().referral_bonus ?? 0) > 0)
          .map((d) => ({
            id: d.id,
            username: d.data().username ?? "Anonymous",
            avatar_id: d.data().avatar_id ?? 1,
            referral_count: d.data().referral_bonus ?? 0,
          }));
        return { data, error: null };
      }

      case "track_viral_share": {
        return { data: { ok: true }, error: null };
      }

      // ── Billing ──────────────────────────────────────────────
      case "sync_profile_plan_from_billing": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: { ok: true }, error: null };
        try {
          const profileRef = doc(db, "profiles", user.uid);
          const snap = await getDoc(profileRef);
          // Profile exists — plan is already synced via Stripe webhook
          if (snap.exists()) return { data: { ok: true }, error: null };
          // Profile doesn't exist yet — create with free plan
          await setDoc(profileRef, {
            id: user.uid,
            plan: "free",
            loops_used_this_month: 0,
            loops_reset_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }, { merge: true });
          return { data: { ok: true }, error: null };
        } catch {
          return { data: { ok: true }, error: null };
        }
      }

      // ── Gamification ─────────────────────────────────────────
      case "sync_gamification_state": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: { ok: true }, error: null };
        try {
          const xp = (args?.p_xp as number) ?? 0;
          const streak = (args?.p_streak as number) ?? 0;
          await updateDoc(doc(db, "profiles", user.uid), {
            gamification_xp: xp,
            gamification_streak: streak,
          }).catch(async () => {
            // Profile may not exist yet — create it
            await setDoc(doc(db, "profiles", user.uid), {
              gamification_xp: xp,
              gamification_streak: streak,
            }, { merge: true });
          });
          return { data: { ok: true }, error: null };
        } catch {
          return { data: { ok: true }, error: null };
        }
      }

      case "claim_level_rewards": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: { ok: true, rewards: { credits: 0 } }, error: null };
        try {
          const p_xp = (args?.p_xp as number) ?? 0;
          const profileRef = doc(db, "profiles", user.uid);
          const snap = await getDoc(profileRef);
          if (!snap.exists()) return { data: { ok: true, rewards: { credits: 0 }, level: 1, level_bonus: 0, daily_bonus_month: 0, credits_granted: 0 }, error: null };
          const profile = snap.data();
          const currentLevelBonus = (profile.level_bonus as number) ?? 0;
          const currentLevel = (profile.gamification_level as number) ?? 1;
          // Calculate XP-based level (mirrors gamification.ts getLevel)
          const LEVEL_XP = [0, 80, 180, 320, 500, 720, 980, 1280, 1620, 2000];
          let newLevel = 1;
          for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
            if (p_xp >= LEVEL_XP[i]) { newLevel = i + 1; break; }
          }
          if (p_xp >= 2000) newLevel = Math.min(25, 10 + Math.floor((p_xp - 2000) / 400));
          // Calculate credits for unclaimed levels
          function levelRewardCredits(lvl: number): number {
            if (lvl <= 1) return 0;
            if (lvl >= 2 && lvl <= 9) return 2;
            if (lvl === 10) return 4;
            if (lvl >= 11 && lvl <= 24) return lvl % 5 === 0 ? 2 : 1;
            if (lvl === 25) return 3;
            return 0;
          }
          let creditsGranted = 0;
          for (let l = currentLevel + 1; l <= newLevel; l++) creditsGranted += levelRewardCredits(l);
          if (creditsGranted > 0) {
            await updateDoc(profileRef, {
              level_bonus: increment(creditsGranted),
              gamification_level: newLevel,
            });
          } else if (newLevel !== currentLevel) {
            await updateDoc(profileRef, { gamification_level: newLevel });
          }
          return {
            data: {
              ok: true,
              credits_granted: creditsGranted,
              level: newLevel,
              level_bonus: currentLevelBonus + creditsGranted,
              daily_bonus_month: (profile.daily_bonus_month as number) ?? 0,
              rewards: { credits: creditsGranted },
            },
            error: null,
          };
        } catch {
          return { data: { ok: true, rewards: { credits: 0 } }, error: null };
        }
      }

      case "claim_daily_generation_bonus": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: { ok: false, error: "not_authenticated" }, error: null };
        try {
          const profileRef = doc(db, "profiles", user.uid);
          const snap = await getDoc(profileRef);
          if (!snap.exists()) return { data: { ok: false, error: "profile_not_found" }, error: null };
          const profile = snap.data();
          const today = new Date().toISOString().slice(0, 10);
          const lastClaim = (profile.last_daily_gen_bonus as string) ?? "";
          if (lastClaim === today) {
            // Already claimed today
            return { data: { ok: true, bonus: 0, credits_granted: 0, daily_bonus_month: (profile.daily_bonus_month as number) ?? 0, today }, error: null };
          }
          await updateDoc(profileRef, {
            daily_bonus_month: increment(1),
            last_daily_gen_bonus: today,
          });
          return {
            data: {
              ok: true,
              bonus: 1,
              credits_granted: 1,
              daily_bonus_month: ((profile.daily_bonus_month as number) ?? 0) + 1,
              today,
            },
            error: null,
          };
        } catch {
          return { data: { ok: false, error: "write_failed" }, error: null };
        }
      }

      // ── Growth ───────────────────────────────────────────────
      case "log_growth_event":
      case "log_growth_events_batch": {
        const events = (args?.p_events ?? []) as Array<{ name: string; props?: Record<string, unknown>; path?: string; client_ts?: string }>;
        const sessionId = args?.p_session_id as string ?? "anonymous";
        const col = collection(db, "growth_events");
        for (const ev of events) {
          await addDoc(col, {
            name: ev.name,
            props: ev.props ?? null,
            path: ev.path ?? null,
            client_ts: ev.client_ts ?? new Date().toISOString(),
            session_id: sessionId,
            created_at: new Date().toISOString(),
          });
        }
        return { data: null, error: null };
      }

      case "get_growth_dashboard": {
        return { data: { ok: true, data: { total_users: 0, total_loops: 0, total_referrals: 0 } }, error: null };
      }

      // ── Onboarding ───────────────────────────────────────────
      case "get_onboarding_progress": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: null, error: new Error("not_authenticated") };
        const docRef = doc(db, "profiles", user.uid);
        const snap = await getDoc(docRef);
        const steps = snap.data()?.onboarding_steps ?? {};
        return { data: { ok: true, steps }, error: null };
      }

      case "complete_onboarding_step": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: { ok: false, error: "not_authenticated" }, error: null };
        const stepName = args?.p_step as string;
        const docRef = doc(db, "profiles", user.uid);
        const snap = await getDoc(docRef);
        const steps = (snap.data()?.onboarding_steps ?? {}) as Record<string, unknown>;
        steps[stepName] = true;
        await updateDoc(docRef, { onboarding_steps: steps });
        return { data: { ok: true }, error: null };
      }

      // ── Notifications ────────────────────────────────────────
      case "list_user_notifications": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: [], error: null };
        const q = fbQuery(
          collection(db, "notifications"),
          where("user_id", "==", user.uid),
          orderBy("created_at", "desc"),
          fbLimit(50),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return { data, error: null };
      }

      case "mark_notification_read": {
        const notifId = args?.p_notification_id as string;
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: null, error: null };
        const docRef = doc(db, "notifications", notifId);
        await updateDoc(docRef, { read_at: new Date().toISOString() });
        return { data: null, error: null };
      }

      case "mark_all_notifications_read": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: null, error: null };
        const q = fbQuery(collection(db, "notifications"), where("user_id", "==", user.uid), where("read_at", "==", null));
        const snap = await getDocs(q);
        const now = new Date().toISOString();
        for (const d of snap.docs) {
          await updateDoc(doc(db, "notifications", d.id), { read_at: now });
        }
        return { data: null, error: null };
      }

      case "ensure_welcome_notification":
      case "ensure_activation_nudge": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: null, error: null };
        const q = fbQuery(collection(db, "notifications"), where("user_id", "==", user.uid), where("type", "==", name));
        const snap = await getDocs(q);
        if (snap.empty) {
          await addDoc(collection(db, "notifications"), {
            user_id: user.uid,
            type: name,
            title: name === "ensure_welcome_notification" ? "Welcome!" : "Ready to create?",
            body: "",
            read_at: null,
            created_at: new Date().toISOString(),
          });
        }
        return { data: null, error: null };
      }

      // ── Community ────────────────────────────────────────────
      case "get_community_loop_play_counts": {
        const loopIds = (args?.p_loop_ids ?? []) as string[];
        const data = loopIds.map((id) => ({ loop_id: id, play_count: 0 }));
        return { data, error: null };
      }

      case "get_loop_comment_counts": {
        const loopIds = (args?.p_loop_ids ?? []) as string[];
        const results: { loop_id: string; comment_count: number }[] = [];
        for (const id of loopIds) {
          try {
            const q = fbQuery(collection(db, "loop_comments"), where("loop_id", "==", id));
            const snap = await getDocs(q);
            results.push({ loop_id: id, comment_count: snap.size });
          } catch {
            results.push({ loop_id: id, comment_count: 0 });
          }
        }
        return { data: results, error: null };
      }

      case "repair_missing_profile":
      case "ensure_profile": {
        const auth = fbAuth();
        const user = auth?.currentUser;
        if (!user) return { data: null, error: null };
        const profileRef = doc(db, "profiles", user.uid);
        const snap = await getDoc(profileRef);
        if (snap.exists()) return { data: { ok: true, status: name }, error: null };
        // Create default profile
        const { ensureFirebaseProfile } = await import("@/lib/firebaseFallback");
        await ensureFirebaseProfile(user.uid, user.email);
        return { data: { ok: true, status: name }, error: null };
      }

      // ── Distribution ─────────────────────────────────────────
      case "get_distribution_usage_summary": {
        return { data: { ok: true, used: 0, limit: 10 }, error: null };
      }

      case "record_distribution_pack_export": {
        return { data: { ok: true }, error: null };
      }

      case "accept_distribution_terms": {
        return { data: { ok: true }, error: null };
      }

      // ── Email capture ────────────────────────────────────────
      case "capture_marketing_lead": {
        return { data: { ok: true }, error: null };
      }

      case "sync_user_attribution": {
        return { data: { ok: true }, error: null };
      }

      default:
        return { data: null, error: new Error(`RPC not implemented: ${name}`) };
    }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

function generateReferralCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ---------------------------------------------------------------------------
// Storage compatibility (Firebase Storage)
// ---------------------------------------------------------------------------

function firebaseStorageFrom(bucketName: string) {
  const storage = fbStorageInstance();

  function storageRef(path: string): StorageReference | null {
    if (!storage) return null;
    return ref(storage, `${bucketName}/${path}`);
  }

  function toStorageUrl(bucket: string, path: string): string {
    const cfg = getFirebaseConfig();
    return `https://firebasestorage.googleapis.com/v0/b/${cfg.storageBucket}/o/${encodeURIComponent(bucket + "/" + path)}?alt=media`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function wrapResult(data: any, error: any): any {
    return { data, error };
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upload: async (path: string, file: Blob | Uint8Array | ArrayBuffer, opts?: { upsert?: boolean; contentType?: string; cacheControl?: string }): Promise<any> => {
      if (!storage) return wrapResult(null, new Error("Firebase Storage not configured"));
      const r = storageRef(path);
      if (!r) return wrapResult(null, new Error("Invalid path"));
      try {
        await uploadBytes(r, file, { contentType: opts?.contentType });
        return wrapResult({ path }, null);
      } catch (err) {
        return wrapResult(null, err instanceof Error ? err : new Error(String(err)));
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getPublicUrl: (path: string): any => {
      return wrapResult({ publicUrl: toStorageUrl(bucketName, path) }, null);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    download: async (path: string): Promise<any> => {
      if (!storage) return wrapResult(null, new Error("Firebase Storage not configured"));
      const r = storageRef(path);
      if (!r) return wrapResult(null, new Error("Invalid path"));
      try {
        const url = await getDownloadURL(r);
        const res = await fetch(url);
        const blob = await res.blob();
        return wrapResult(blob, null);
      } catch (err) {
        return wrapResult(null, err instanceof Error ? err : new Error(String(err)));
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    remove: async (paths: string[]): Promise<any> => {
      if (!storage) return wrapResult(null, new Error("Firebase Storage not configured"));
      const errors: Error[] = [];
      for (const p of paths) {
        const r = storageRef(p);
        if (!r) continue;
        try {
          await deleteObject(r);
        } catch (err) {
          errors.push(err instanceof Error ? err : new Error(String(err)));
        }
      }
      return wrapResult(null, errors.length > 0 ? errors[0] : null);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createSignedUrl: async (path: string, _expiresIn: number): Promise<any> => {
      if (!storage) return wrapResult(null, new Error("Firebase Storage not configured"));
      try {
        const r = storageRef(path);
        if (!r) return wrapResult(null, new Error("Invalid path"));
        const url = await getDownloadURL(r);
        return wrapResult({ signedUrl: url }, null);
      } catch (err) {
        return wrapResult(null, err instanceof Error ? err : new Error(String(err)));
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Functions compatibility (HTTP fetch to Edge Functions)
// ---------------------------------------------------------------------------

let _cachedSupabaseToken: string | null = null;
let _cachedSupabaseTokenUid: string | null = null;
let _cachedSupabaseTokenExpiry = 0;

/**
 * Get a Supabase JWT by exchanging the current Firebase user's ID token
 * via Supabase's id_token grant. Cached per user UID, with 55min expiry.
 */
async function getSupabaseTokenForFirebaseUser(): Promise<string | null> {
  const auth = fbAuth();
  const user = auth?.currentUser;
  if (!user) return null;

  // Return cached token if still valid (same user + not expired)
  if (_cachedSupabaseToken && _cachedSupabaseTokenUid === user.uid && Date.now() < _cachedSupabaseTokenExpiry) {
    return _cachedSupabaseToken;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!supabaseUrl || !anonKey) return null;

  try {
    const idToken = await user.getIdToken();
    const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=id_token`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "firebase", id_token: idToken, access_token: idToken }),
    });
    if (!res.ok) return null;
    const json = await res.json() as { access_token?: string; session?: { access_token?: string } };
    const token = json.access_token ?? json.session?.access_token ?? null;
    if (token) {
      _cachedSupabaseToken = token;
      _cachedSupabaseTokenUid = user.uid;
      _cachedSupabaseTokenExpiry = Date.now() + 55 * 60 * 1000; // 55 min (Supabase JWTs last 1h)
    }
    return token;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function firebaseFunctionsInvoke(name: string, opts?: { body?: unknown; headers?: Record<string, string>; signal?: AbortSignal }): Promise<any> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (supabaseUrl && anonKey) {
    try {
      // Send the Firebase ID token as Bearer — the Edge Function verifies it via
      // Identity Toolkit and uses the service role key to bypass RLS for Firebase users.
      const auth = fbAuth();
      const user = auth?.currentUser;
      const idToken = user ? await user.getIdToken().catch(() => null) : null;
      const authToken = opts?.headers?.Authorization ?? (idToken ? `Bearer ${idToken}` : `Bearer ${anonKey}`);

      const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/${name}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          apikey: anonKey,
          Authorization: authToken,
          "Content-Type": "application/json",
          Accept: "application/json",
          ...opts?.headers,
        },
        body: JSON.stringify(opts?.body ?? {}),
        signal: opts?.signal,
      });
      const text = await res.text().catch(() => "");
      if (!res.ok) return { data: null, error: new Error(text || `Edge Function error (${res.status})`) };
      try {
        return { data: JSON.parse(text) as unknown, error: null };
      } catch {
        return { data: text, error: null };
      }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  return { data: null, error: new Error("Functions not available") };
}

// ---------------------------------------------------------------------------
// Realtime compatibility (Firestore onSnapshot)
// ---------------------------------------------------------------------------

class FirebaseRealtimeChannel {
  private name: string;
  private unsubscribers: Unsubscribe[] = [];

  constructor(name: string) {
    this.name = name;
  }

  on(
    _type: string,
    filter: { event: string; schema: string; table: string; filter?: string },
    callback: (payload: { new: Record<string, unknown>; old?: Record<string, unknown>; eventType: string }) => void,
  ) {
    const db = fbDb();
    if (!db) return this;

    const tableName = filter.table;
    const eventType = filter.event;

    try {
      let q;
      if (filter.filter && filter.filter.startsWith("id=eq.")) {
        const id = filter.filter.replace("id=eq.", "");
        q = fbQuery(collection(db, tableName), where("id", "==", id));
      } else if (filter.filter && filter.filter.includes("user_id=eq.")) {
        const userId = filter.filter.match(/user_id=eq\.(.+)/)?.[1] ?? "";
        if (eventType === "*") {
          q = fbQuery(collection(db, tableName), where("user_id", "==", userId));
        } else {
          q = fbQuery(collection(db, tableName));
        }
      } else {
        q = collection(db, tableName);
      }

      const unsub = onSnapshot(q, (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (eventType === "*" || change.type === eventType.toLowerCase()) {
            callback({
              new: { id: change.doc.id, ...change.doc.data() } as Record<string, unknown>,
              eventType: change.type,
            });
          }
        }
      });
      this.unsubscribers.push(unsub);
    } catch {
      // Ignore subscription errors — realtime is best-effort
    }
    return this;
  }

  subscribe() {
    return this;
  }

  unsubscribe() {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }
}

// ---------------------------------------------------------------------------
// Auth compatibility
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySession = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyUser = any;

const firebaseAuthCompat = {
  getSession: async (): Promise<{ data: { session: AnySession | null }; error: AnySession | null }> => {
    const session = await fbGetSession();
    // Inject the real Firebase ID token so callers using `session.access_token`
    // send a JWT the Supabase Edge Function can verify via Identity Toolkit.
    const auth = fbAuth();
    const user = auth?.currentUser;
    if (user && session?.data?.session) {
      try {
        const idToken = await user.getIdToken();
        session.data.session.access_token = idToken;
      } catch {
        // keep fallback (UID)
      }
    }
    return session as unknown as Promise<{ data: { session: AnySession | null }; error: AnySession | null }>;
  },

  getUser: async (_token?: string): Promise<{ data: { user: AnyUser | null }; error: AnySession | null }> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auth = fbAuth() as any;
    if (!auth || !auth.currentUser) return { data: { user: null }, error: new Error("Not authenticated") };
    return { data: { user: supabaseUserFromFirebase(auth.currentUser) }, error: null };
  },

  onAuthStateChange: (callback: (event: string, session: AnySession) => void) => {
    return fbOnAuthStateChange(callback as (event: string, session: unknown) => void);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signInWithPassword: async (params: { email: string; password: string }): Promise<any> => {
    return fbSignInWithPassword(params.email, params.password);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signUp: async (params: { email: string; password: string; options?: { emailRedirectTo?: string } }): Promise<any> => {
    return fbSignUp(params.email, params.password);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signInWithOAuth: async (params: { provider: string; options?: { redirectTo?: string; queryParams?: Record<string, string>; skipBrowserRedirect?: boolean } }): Promise<any> => {
    if (params.provider === "google") {
      return fbSignInWithGoogle();
    }
    if (params.provider === "apple") {
      return { data: null, error: { message: "Apple sign-in via Firebase requires configuration" } };
    }
    return { data: null, error: { message: `OAuth provider ${params.provider} not supported` } };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signInWithIdToken: async (params: { provider: string; token: string }): Promise<any> => {
    const auth = fbAuth();
    if (!auth) return { data: null, error: new Error("Firebase Auth not configured") };
    try {
      const { OAuthProvider, signInWithCredential } = await import("firebase/auth");
      if (params.provider === "apple") {
        const provider = new OAuthProvider("apple.com");
        const credential = provider.credential({ idToken: params.token });
        const result = await signInWithCredential(auth, credential);
        return {
          data: {
            user: supabaseUserFromFirebase(result.user),
            session: { access_token: result.user.uid, refresh_token: result.user.uid, user: supabaseUserFromFirebase(result.user) },
          },
          error: null,
        };
      }
      return { data: null, error: new Error("IdToken provider not supported") };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exchangeCodeForSession: async (_code: string): Promise<any> => {
    const session = await fbGetSession();
    return session;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setSession: async (params: { access_token: string; refresh_token: string }): Promise<any> => {
    const auth = fbAuth();
    if (auth?.currentUser) {
      return {
        data: {
          session: { access_token: params.access_token, refresh_token: params.refresh_token, user: supabaseUserFromFirebase(auth.currentUser) },
        },
        error: null,
      };
    }
    return { data: { session: null }, error: null };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateUser: async (params: { password?: string }): Promise<any> => {
    if (params.password) {
      return fbUpdatePassword(params.password);
    }
    return { data: null, error: null };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resetPasswordForEmail: async (email: string, _opts?: { redirectTo?: string }): Promise<any> => {
    return fbResetPassword(email);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signOut: async (_params?: { scope?: string }): Promise<any> => {
    _cachedSupabaseToken = null;
    _cachedSupabaseTokenUid = null;
    return fbSignOut();
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resend: async (params: { type: string; email: string; options?: { emailRedirectTo?: string } }): Promise<any> => {
    if (params.type === "signup") {
      return fbSendVerificationEmail();
    }
    return { data: null, error: null };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linkIdentity: async (params: { provider: string; options?: { redirectTo?: string; queryParams?: Record<string, string> } }): Promise<any> => {
    if (params.provider === "google") {
      return fbSignInWithGoogle();
    }
    return { data: null, error: new Error("Link identity not supported for this provider") };
  },
};

// ---------------------------------------------------------------------------
// Event tracking (mirrored from original supabaseClient.ts)
// ---------------------------------------------------------------------------

type ClientEventPayload = {
  name: string;
  ts: number;
  path?: string;
  props?: Record<string, unknown>;
};

const EVENT_QUEUE_KEY = "producerhit_event_queue_v1";
const FLUSH_BATCH_SIZE = 8;
const FLUSH_MIN_INTERVAL_MS = 120_000;
let lastFlushAt = 0;

function safeJsonParse(raw: string): unknown {
  try { return JSON.parse(raw) as unknown; } catch { return null; }
}

function readQueue(): ClientEventPayload[] {
  try {
    const raw = window.localStorage.getItem(EVENT_QUEUE_KEY);
    if (!raw) return [];
    const parsed = safeJsonParse(raw);
    return Array.isArray(parsed) ? (parsed as ClientEventPayload[]) : [];
  } catch { return []; }
}

function writeQueue(events: ClientEventPayload[]) {
  try {
    window.localStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(events.slice(-200)));
  } catch { /* ignore */ }
}

export function trackClientEvent(name: string, props?: Record<string, unknown>) {
  const attribution = getAttributionProps();
  const mergedProps = { ...attribution, ...props };
  const payload: ClientEventPayload = {
    name,
    ts: Date.now(),
    path: typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined,
    props: mergedProps,
  };
  const q = readQueue();
  q.push(payload);
  writeQueue(q);

  const eventId = mirrorEventToAdPixels(name, mergedProps);
  if (eventId && shouldMirrorToServer(name)) {
    sendServerConversion(name, eventId, mergedProps);
  }
}

export async function flushEventQueue(): Promise<void> {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
  const now = Date.now();
  if (now - lastFlushAt < FLUSH_MIN_INTERVAL_MS) return;

  const q = readQueue();
  if (!q.length) return;

  lastFlushAt = now;
  const batch = q.slice(0, FLUSH_BATCH_SIZE);

  const eventsPayload = batch.map((event) => ({
    name: event.name,
    props: event.props ?? null,
    path: event.path ?? null,
    client_ts: new Date(event.ts).toISOString(),
  }));

  const { error } = await firebaseRpc("log_growth_events_batch", {
    p_session_id: getOrCreateSessionId(),
    p_events: eventsPayload,
  });

  if (!error) {
    writeQueue(q.slice(batch.length));
  }
}

/** @deprecated Use flushEventQueue */
export async function flushClientEvents(_userId: string) {
  await flushEventQueue();
}

// ---------------------------------------------------------------------------
// Exported supabase object
// ---------------------------------------------------------------------------

export const supabase = {
  auth: firebaseAuthCompat,
  from: (tableName: string) => new FirebaseQueryBuilder(tableName),
  rpc: (name: string, args?: Record<string, unknown>) => firebaseRpc(name, args),
  functions: {
    invoke: (name: string, opts?: { body?: unknown; headers?: Record<string, string>; signal?: AbortSignal }) =>
      firebaseFunctionsInvoke(name, opts),
  },
  storage: {
    from: (bucketName: string) => firebaseStorageFrom(bucketName),
  },
  channel: (name: string) => new FirebaseRealtimeChannel(name),
  removeChannel: (channel: FirebaseRealtimeChannel) => {
    channel.unsubscribe();
  },
};

export function isUsingFirebase(): boolean {
  return true;
}

export function isUsingBackup(): boolean {
  return false;
}

export function isBackupConfigured(): boolean {
  return false;
}

export function switchToBackup(): void {
  /* no-op — Firebase is the primary */
}

export function switchToFirebase(): void {
  /* no-op */
}

export function exitFirebaseFallback(): void {
  /* no-op */
}

export function switchToPrimary(): void {
  /* no-op */
}
