import {
  getAuth,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  type Auth,
} from "firebase/auth";
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
  supabaseUserFromFirebase,
  supabaseSessionFromFirebase,
} from "@/lib/firebaseAuth";
import Constants from "expo-constants";

// ---------------------------------------------------------------------------
// Firebase Init
// ---------------------------------------------------------------------------

function getFirebaseConfig() {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? extra?.firebaseApiKey,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? extra?.firebaseAuthDomain,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? extra?.firebaseProjectId,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? extra?.firebaseStorageBucket,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? extra?.firebaseMessagingSenderId,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? extra?.firebaseAppId,
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
  }
}

function fbDb(): Firestore | null {
  ensureFirebase();
  return _db;
}

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

// ---------------------------------------------------------------------------
// Query Builder
// ---------------------------------------------------------------------------

type FilterClause = { col: string; op: WhereFilterOp | "in"; val: unknown };
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async execute(): Promise<{ data: any; error: any; count?: number | null }> {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async executeSelect(db: Firestore): Promise<{ data: any; error: any; count?: number | null }> {
    if (this.expectSingle || this.expectMaybeSingle) {
      return this.executeSelectSingle(db);
    }
    return this.executeSelectMany(db);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async executeSelectSingle(db: Firestore): Promise<{ data: any; error: any; count?: number | null }> {
    const idFilter = this.filters.find((f) => f.col === "id" && f.op === "==");
    if (idFilter && typeof idFilter.val === "string") {
      const docRef = doc(db, this.tableName, idFilter.val);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        if (this.expectSingle) return { data: null, error: new Error("Row not found") };
        return { data: null, error: null };
      }
      const data = { id: snap.id, ...snap.data() };
      if (!this.matchesRemainingFilters(data, idFilter)) {
        if (this.expectSingle) return { data: null, error: new Error("Row not found") };
        return { data: null, error: null };
      }
      return { data, error: null };
    }

    const ref = collection(db, this.tableName);
    let constraints = [];

    for (const f of this.filters) {
      if (f.op === "in") {
        constraints.push(where(f.col, "in", f.val as unknown[]));
      } else {
        constraints.push(where(f.col, f.op, f.val));
      }
    }
    for (const o of this.orders) {
      constraints.push(orderBy(o.col, o.dir));
    }
    if (this.limitCount !== null) {
      constraints.push(fbLimit(this.limitCount));
    }

    try {
      const q = constraints.length > 0 ? fbQuery(ref, ...constraints) : ref;
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (this.expectSingle) {
        if (results.length === 0) return { data: null, error: new Error("Row not found") };
        return { data: results[0], error: null };
      }
      if (this.expectMaybeSingle) {
        return { data: results[0] ?? null, error: null };
      }

      const result: { data: unknown; error: unknown; count?: number | null } = { data: results, error: null };
      if (this.countExact) {
        result.count = results.length;
      }
      return result;
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async executeSelectMany(db: Firestore): Promise<{ data: any; error: any; count?: number | null }> {
    const ref = collection(db, this.tableName);
    let constraints = [];

    for (const f of this.filters) {
      if (f.op === "in") {
        constraints.push(where(f.col, "in", f.val as unknown[]));
      } else {
        constraints.push(where(f.col, f.op, f.val));
      }
    }
    for (const o of this.orders) {
      constraints.push(orderBy(o.col, o.dir));
    }
    if (this.limitCount !== null) {
      constraints.push(fbLimit(this.limitCount));
    }

    try {
      const q = constraints.length > 0 ? fbQuery(ref, ...constraints) : ref;
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const result: { data: unknown; error: unknown; count?: number | null } = { data: results, error: null };
      if (this.countExact) {
        result.count = results.length;
      }
      return result;
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async executeInsert(db: Firestore): Promise<{ data: any; error: any }> {
    const ref = collection(db, this.tableName);
    const idFilter = this.filters.find((f) => f.col === "id" && f.op === "==");
    try {
      if (idFilter && typeof idFilter.val === "string") {
        await setDoc(doc(db, this.tableName, idFilter.val as string), (this.payload ?? {}) as Record<string, unknown>);
        const snap = await getDoc(doc(db, this.tableName, idFilter.val as string));
        return { data: { id: snap.id, ...snap.data() }, error: null };
      }
      const docRef = await addDoc(ref, this.payload ?? {} as Record<string, unknown>);
      const snap = await getDoc(docRef);
      return { data: { id: snap.id, ...snap.data() }, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async executeUpdate(db: Firestore): Promise<{ data: any; error: any }> {
    const idFilter = this.filters.find((f) => f.col === "id" && f.op === "==");
    if (!idFilter || typeof idFilter.val !== "string") {
      return { data: null, error: new Error("Update requires .eq('id', ...) filter") };
    }
    try {
      const docRef = doc(db, this.tableName, idFilter.val as string);
      await updateDoc(docRef, (this.payload ?? {}) as any);
      const snap = await getDoc(docRef);
      return { data: snap.exists() ? { id: snap.id, ...snap.data() } : null, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async executeUpsert(db: Firestore): Promise<{ data: any; error: any }> {
    const idFilter = this.filters.find((f) => f.col === "id" && f.op === "==");
    const upsertId = idFilter && typeof idFilter.val === "string" ? (idFilter.val as string) : undefined;
    try {
      if (upsertId) {
        await setDoc(doc(db, this.tableName, upsertId), (this.payload ?? {}) as Record<string, unknown>, { merge: true });
        const snap = await getDoc(doc(db, this.tableName, upsertId));
        return { data: { id: snap.id, ...snap.data() }, error: null };
      }
      const docRef = await addDoc(collection(db, this.tableName), (this.payload ?? {}) as Record<string, unknown>);
      const snap = await getDoc(docRef);
      return { data: { id: snap.id, ...snap.data() }, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async executeDelete(db: Firestore): Promise<{ data: any; error: any }> {
    const idFilter = this.filters.find((f) => f.col === "id" && f.op === "==");
    if (!idFilter || typeof idFilter.val !== "string") {
      return { data: null, error: new Error("Delete requires .eq('id', ...) filter") };
    }
    try {
      await deleteDoc(doc(db, this.tableName, idFilter.val as string));
      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private matchesRemainingFilters(item: any, skipFilter?: FilterClause): boolean {
    for (const f of this.filters) {
      if (skipFilter && f.col === skipFilter.col && f.op === skipFilter.op && f.val === skipFilter.val) continue;
      if (f.op === "==") {
        if (item[f.col] !== f.val) return false;
      }
    }
    return true;
  }
}

// ---------------------------------------------------------------------------
// RPC implementations
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetProfile(db: Firestore, p_user_id: string): Promise<any> {
  const snap = await getDoc(doc(db, "profiles", p_user_id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetProfilesBatch(db: Firestore, p_user_ids: string[]): Promise<any[]> {
  const results: Record<string, unknown>[] = [];
  for (const uid of p_user_ids) {
    const snap = await getDoc(doc(db, "profiles", uid));
    if (snap.exists()) results.push({ id: snap.id, ...snap.data() });
  }
  return results;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetPublicProfileCards(db: Firestore, p_user_ids: string[]): Promise<any[]> {
  return rpcGetProfilesBatch(db, p_user_ids);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetOrCreateProfile(db: Firestore, p_user_id: string, p_email?: string): Promise<any> {
  const ref = doc(db, "profiles", p_user_id);
  const snap = await getDoc(ref);
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  const newProfile: Record<string, unknown> = {
    id: p_user_id,
    email: p_email ?? "",
    plan: "free",
    loops_used_this_month: 0,
    referral_bonus: 0,
    level_bonus: 0,
    daily_bonus_month: 0,
    purchased_bonus: 0,
    referral_code: null,
    username: null,
    created_at: new Date().toISOString(),
  };
  await setDoc(ref, newProfile);
  return { id: p_user_id, ...newProfile };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcClaimDailyGenerationBonus(db: Firestore, p_user_id: string): Promise<any> {
  const ref = doc(db, "profiles", p_user_id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, error: "Profile not found" };
  const data = snap.data();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastClaim = data.daily_bonus_month ?? "";
  const lastClaimDay = data.last_daily_claim_date ?? "";

  if (lastClaim === currentMonth && lastClaimDay === new Date().toISOString().slice(0, 10)) {
    return { ok: false, already_claimed: true, credits_granted: 0, daily_bonus_month: data.daily_bonus_month ?? 0 };
  }

  const credits = 1;
  const currentBonus = data.daily_bonus_month ?? 0;
  const newBonus = lastClaim === currentMonth ? currentBonus + credits : credits;
  await updateDoc(ref, {
    daily_bonus_month: newBonus,
    last_daily_claim_date: new Date().toISOString().slice(0, 10),
  } as any);
  return { ok: true, already_claimed: false, credits_granted: credits, daily_bonus_month: newBonus };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcCompleteOnboardingStep(db: Firestore, p_user_id: string, p_step_id: string): Promise<any> {
  const ref = doc(db, "onboarding", p_user_id);
  const snap = await getDoc(ref);
  const steps = snap.exists() ? (snap.data().steps ?? []) : [];
  if (!steps.includes(p_step_id)) {
    steps.push(p_step_id);
    await setDoc(ref, { user_id: p_user_id, steps }, { merge: true });
  }
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetOnboardingProgress(db: Firestore, p_user_id: string): Promise<any> {
  const snap = await getDoc(doc(db, "onboarding", p_user_id));
  if (!snap.exists()) return { ok: true, steps: [] };
  return { ok: true, steps: snap.data().steps ?? [] };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcCreateReferral(db: Firestore, p_user_id: string, p_code: string): Promise<any> {
  await setDoc(doc(db, "referrals", p_user_id), {
    user_id: p_user_id,
    code: p_code,
    created_at: new Date().toISOString(),
  });
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcApplyReferral(db: Firestore, p_user_id: string, p_code: string): Promise<any> {
  const snaps = await getDocs(fbQuery(collection(db, "referrals"), where("code", "==", p_code)));
  if (snaps.empty) return { ok: false, error: "Invalid referral code" };
  const referrerId = snaps.docs[0].id;
  if (referrerId === p_user_id) return { ok: false, error: "Cannot refer yourself" };

  const ref = doc(db, "profiles", referrerId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { referral_bonus: increment(1) });
  }
  const ref2 = doc(db, "profiles", p_user_id);
  const snap2 = await getDoc(ref2);
  if (snap2.exists()) {
    await updateDoc(ref2, { referral_bonus: increment(1) });
  }
  await setDoc(doc(db, "referral_uses", `${p_user_id}_${referrerId}`), {
    user_id: p_user_id,
    referrer_id: referrerId,
    used_at: new Date().toISOString(),
  });
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcRedeemReferral(db: Firestore, p_user_id: string): Promise<any> {
  return rpcGetOrCreateProfile(db, p_user_id);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetNotifications(db: Firestore, p_user_id: string): Promise<any[]> {
  const q = fbQuery(collection(db, "notifications"), where("user_id", "==", p_user_id), orderBy("created_at", "desc"), fbLimit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcMarkNotificationRead(db: Firestore, p_notification_id: string): Promise<any> {
  await updateDoc(doc(db, "notifications", p_notification_id), { read: true });
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetUnreadNotificationCount(db: Firestore, p_user_id: string): Promise<any> {
  const q = fbQuery(collection(db, "notifications"), where("user_id", "==", p_user_id), where("read", "==", false));
  const snap = await getDocs(q);
  return { count: snap.size };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetGrowthMetrics(db: Firestore, p_user_id: string): Promise<any> {
  const snap = await getDoc(doc(db, "growth_metrics", p_user_id));
  if (!snap.exists()) return null;
  return snap.data();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcTrackGrowthEvent(db: Firestore, p_user_id: string, p_event: string, p_data?: Record<string, unknown>): Promise<any> {
  const ref = doc(db, "growth_events", `${p_user_id}_${p_event}_${Date.now()}`);
  await setDoc(ref, {
    user_id: p_user_id,
    event: p_event,
    data: p_data ?? {},
    created_at: new Date().toISOString(),
  });
  const metricsRef = doc(db, "growth_metrics", p_user_id);
  const snap = await getDoc(metricsRef);
  if (snap.exists()) {
    await updateDoc(metricsRef, { [`last_${p_event}`]: new Date().toISOString() });
  } else {
    await setDoc(metricsRef, { user_id: p_user_id, [`last_${p_event}`]: new Date().toISOString() });
  }
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetInvoiceHistory(db: Firestore, p_user_id: string): Promise<any[]> {
  const q = fbQuery(collection(db, "invoices"), where("user_id", "==", p_user_id), orderBy("created_at", "desc"), fbLimit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetDistributionUsageSummary(db: Firestore, p_user_id: string): Promise<any> {
  const snap = await getDoc(doc(db, "profiles", p_user_id));
  if (!snap.exists()) return { plan: "free", used: 0, quota: 0, month_key: "" };
  const data = snap.data();
  const monthKey = new Date().toISOString().slice(0, 7);
  const usageSnap = await getDoc(doc(db, "distribution_usage", `${p_user_id}_${monthKey}`));
  const used = usageSnap.exists() ? (usageSnap.data().count ?? 0) : 0;
  const plan = (data.plan as string) ?? "free";
  const quota = plan === "pro" ? 50 : plan === "unlimited" ? 9999 : 2;
  return { plan, used, quota, month_key: monthKey };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcRecordDistributionPackExport(db: Firestore, p_user_id: string, p_loop_id: string, p_title: string, p_artist_name: string, p_featuring: string[], p_genre_name: string | null, p_language_code: string, p_explicit: boolean, p_release_date: string | null): Promise<any> {
  const ref = await addDoc(collection(db, "distribution_releases"), {
    user_id: p_user_id,
    loop_id: p_loop_id,
    release_type: "single",
    title: p_title,
    artist_name: p_artist_name,
    featuring: p_featuring,
    genre_name: p_genre_name,
    language_code: p_language_code,
    explicit: p_explicit,
    release_date: p_release_date,
    status: "draft",
    status_detail: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const monthKey = new Date().toISOString().slice(0, 7);
  const usageRef = doc(db, "distribution_usage", `${p_user_id}_${monthKey}`);
  const usageSnap = await getDoc(usageRef);
  if (usageSnap.exists()) {
    await updateDoc(usageRef, { count: increment(1) });
  } else {
    await setDoc(usageRef, { user_id: p_user_id, month: monthKey, count: 1 });
  }
  return { ok: true, release_id: ref.id };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcAcceptDistributionTerms(db: Firestore, p_user_id: string): Promise<any> {
  await updateDoc(doc(db, "profiles", p_user_id), { distribution_terms_accepted: true });
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetUserPlan(db: Firestore, p_user_id: string): Promise<any> {
  const snap = await getDoc(doc(db, "profiles", p_user_id));
  if (!snap.exists()) return { plan: "free" };
  return { plan: snap.data().plan ?? "free" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcUpdateUserPlan(db: Firestore, p_user_id: string, p_plan: string): Promise<any> {
  await updateDoc(doc(db, "profiles", p_user_id), { plan: p_plan });
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcUpdateProfile(db: Firestore, p_user_id: string, p_data: Record<string, unknown>): Promise<any> {
  await updateDoc(doc(db, "profiles", p_user_id), p_data as any);
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetGenerationUsage(db: Firestore, p_user_id: string): Promise<any> {
  const snap = await getDoc(doc(db, "profiles", p_user_id));
  if (!snap.exists()) return { loops_used_this_month: 0, daily_bonus_month: 0 };
  return {
    loops_used_this_month: snap.data().loops_used_this_month ?? 0,
    daily_bonus_month: snap.data().daily_bonus_month ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcIncrementGenerationUsage(db: Firestore, p_user_id: string): Promise<any> {
  await updateDoc(doc(db, "profiles", p_user_id), { loops_used_this_month: increment(1) });
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetLevelInfo(db: Firestore, p_user_id: string): Promise<any> {
  const snap = await getDoc(doc(db, "profiles", p_user_id));
  if (!snap.exists()) return { level: 1, xp: 0, xp_for_next: 100 };
  return { level: snap.data().level ?? 1, xp: snap.data().xp ?? 0, xp_for_next: 100 };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcAddXp(db: Firestore, p_user_id: string, p_amount: number): Promise<any> {
  const ref = doc(db, "profiles", p_user_id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false };
  const currentXp = (snap.data().xp ?? 0) + p_amount;
  const xpForNext = 100;
  let level = snap.data().level ?? 1;
  if (currentXp >= xpForNext) {
    level += 1;
    await updateDoc(ref, { xp: currentXp - xpForNext, level: level });
  } else {
    await updateDoc(ref, { xp: currentXp });
  }
  return { ok: true, level, xp: currentXp >= xpForNext ? currentXp - xpForNext : currentXp };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetStripeCustomerId(db: Firestore, p_user_id: string): Promise<any> {
  const snap = await getDoc(doc(db, "stripe_customers", p_user_id));
  if (!snap.exists()) return { customer_id: null };
  return { customer_id: snap.data().customer_id ?? null };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcSetStripeCustomerId(db: Firestore, p_user_id: string, p_customer_id: string): Promise<any> {
  await setDoc(doc(db, "stripe_customers", p_user_id), { user_id: p_user_id, customer_id: p_customer_id });
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetCheckoutSession(db: Firestore, p_session_id: string): Promise<any> {
  const q = fbQuery(collection(db, "checkout_sessions"), where("session_id", "==", p_session_id));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcCreatePurchaseBonus(db: Firestore, p_user_id: string, p_bonus: number): Promise<any> {
  await updateDoc(doc(db, "profiles", p_user_id), { purchased_bonus: increment(p_bonus) });
  return { ok: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcGetStripePortalUrl(db: string): Promise<any> {
  return { url: null };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcAdminCheckUser(db: Firestore, p_user_id: string): Promise<any> {
  return rpcGetOrCreateProfile(db, p_user_id);
}

// ---------------------------------------------------------------------------
// Supabase-compatible API
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSupabaseApi(): any {
  const api: any = {
    from: (tableName: string) => new FirebaseQueryBuilder(tableName),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rpc: (fnName: string, params?: Record<string, unknown>): Promise<{ data: any; error: any }> => {
      return rpcHandler(fnName, params);
    },
  };

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";

  api.auth = {
    getSession: async () => fbGetSession(),
    signInWithPassword: async (params: { email: string; password: string }) => fbSignInWithPassword(params.email, params.password),
    signUp: async (params: { email: string; password: string }) => fbSignUp(params.email, params.password),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signInWithOAuth: async (params: { provider: string; options?: any }): Promise<any> => {
      if (params.provider === "google") {
        return signInWithGoogleOAuth(params.options?.redirectTo);
      }
      return { data: null, error: new Error(`OAuth provider ${params.provider} not supported on mobile`) };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signInWithIdToken: async (params: { provider: string; token: string }): Promise<any> => {
      const auth = fbAuth();
      if (!auth) return { data: null, error: new Error("Firebase Auth not configured") };
      try {
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
    exchangeCodeForSession: async (_code: string) => {
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
    signOut: async () => fbSignOut(),
    onAuthStateChange: (callback: (event: string, session: unknown) => void) => fbOnAuthStateChange(callback),
    resetPasswordForEmail: async (email: string) => fbResetPassword(email),
    updateUser: async (params: { password?: string }) => {
      if (params.password) {
        return fbUpdatePassword(params.password);
      }
      return { data: null, error: null };
    },
  };

  api.storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: Blob | Uint8Array | ArrayBuffer) => {
        const s = fbStorageInstance();
        if (!s) return { data: null, error: new Error("Storage not configured") };
        try {
          const storageRef = ref(s, `${bucket}/${path}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          return { data: { path, fullPath: `${bucket}/${path}` }, error: null };
        } catch (err) {
          return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
        }
      },
      getPublicUrl: (path: string) => {
        const s = fbStorageInstance();
        if (!s) return { data: { publicUrl: null } };
        const storageRef = ref(s, `${bucket}/${path}`);
        return { data: { publicUrl: storageRef.toString() } };
      },
      download: async (path: string) => {
        const s = fbStorageInstance();
        if (!s) return { data: null, error: new Error("Storage not configured") };
        try {
          const storageRef = ref(s, `${bucket}/${path}`);
          const url = await getDownloadURL(storageRef);
          const response = await fetch(url);
          const blob = await response.blob();
          return { data: blob, error: null };
        } catch (err) {
          return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
        }
      },
      remove: async (paths: string[]) => {
        const s = fbStorageInstance();
        if (!s) return { data: null, error: new Error("Storage not configured") };
        try {
          for (const path of paths) {
            await deleteObject(ref(s, `${bucket}/${path}`));
          }
          return { data: null, error: null };
        } catch (err) {
          return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
        }
      },
      createSignedUrl: async (path: string, _expiresIn: number) => {
        const s = fbStorageInstance();
        if (!s) return { data: null, error: new Error("Storage not configured") };
        try {
          const storageRef = ref(s, `${bucket}/${path}`);
          const url = await getDownloadURL(storageRef);
          return { data: { signedUrl: url }, error: null };
        } catch (err) {
          return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
        }
      },
      list: async (prefix?: string) => {
        const s = fbStorageInstance();
        if (!s) return { data: null, error: new Error("Storage not configured") };
        try {
          const storageRef = ref(s, bucket);
          const listRef = prefix ? ref(s, `${bucket}/${prefix}`) : storageRef;
          const result = await listAll(listRef);
          return { data: { items: result.items.map((item) => ({ name: item.name })), prefixes: result.prefixes.map((p) => ({ name: p.name })) }, error: null };
        } catch (err) {
          return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
        }
      },
    }),
  };

  api.functions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoke: async (name: string, args?: { body?: Record<string, unknown>; headers?: Record<string, string> }): Promise<{ data: any; error: any }> => {
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
      if (!supabaseUrl) {
        return { data: null, error: new Error("Supabase URL not configured for Edge Functions") };
      }
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
            ...(args?.headers ?? {}),
          },
          body: args?.body ? JSON.stringify(args.body) : undefined,
        });
        const text = await response.text();
        if (!response.ok) {
          const err = new Error(`Edge Function ${name} returned ${response.status}`);
          (err as unknown as Record<string, unknown>).context = { status: response.status, body: text };
          return { data: null, error: err };
        }
        let data: unknown;
        try { data = JSON.parse(text) as unknown; } catch { data = text; }
        return { data: data ?? null, error: null };
      } catch (err) {
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
  };

  api.channel = (name: string) => {
    let unsub: Unsubscribe | null = null;
    let listeners: Array<{ event: string; schema?: string; table?: string; filter?: string; callback: (payload: unknown) => void }> = [];

    return {
      on: (event: string, config: { event?: string; schema?: string; table?: string; filter?: string }, callback: (payload: unknown) => void) => {
        listeners.push({ event, ...config, callback });
        return api.channel(name);
      },
      subscribe: () => {
        const db = fbDb();
        if (!db) return;
        for (const listener of listeners) {
          if (listener.table && listener.schema === "public") {
            const ref = collection(db, listener.table);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const q = fbQuery(ref);
            unsub = onSnapshot(q, (snapshot) => {
              for (const change of snapshot.docChanges()) {
                listener.callback({
                  eventType: change.type,
                  new: { id: change.doc.id, ...change.doc.data() },
                  old: null,
                });
              }
            });
          }
        }
        return api.channel(name);
      },
      unsubscribe: () => {
        if (unsub) unsub();
      },
    };
  };

  api.removeChannel = (_channel: { unsubscribe?: () => void }) => {};

  return api;
}

// ---------------------------------------------------------------------------
// Google OAuth (mobile)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function signInWithGoogleOAuth(_redirectTo?: string): Promise<any> {
  const auth = fbAuth();
  if (!auth) return { data: null, error: new Error("Firebase Auth not configured") };

  try {
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;
    const { session } = supabaseSessionFromFirebase(fbUser);
    return { data: { user: supabaseUserFromFirebase(fbUser), session, url: null }, error: null };
  } catch (err) {
    // signInWithPopup not available in React Native
    // auth.ts handles Google OAuth via WebBrowser + Firebase Auth REST directly
    return { data: null, error: new Error("Google OAuth via popup not available on mobile; use Firebase direct flow") };
  }
}

// ---------------------------------------------------------------------------
// RPC dispatch
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rpcHandler(fnName: string, params?: Record<string, unknown>): Promise<{ data: any; error: any }> {
  const db = fbDb();
  if (!db) return { data: null, error: new Error("Firebase not configured") };

  const userId = fbAuth()?.currentUser?.uid ?? params?.p_user_id ?? "";

  try {
    switch (fnName) {
      case "get_profile":
        return { data: await rpcGetProfile(db, userId as string), error: null };
      case "get_profiles_batch":
        return { data: await rpcGetProfilesBatch(db, params?.p_user_ids as string[] ?? []), error: null };
      case "get_public_profile_cards":
        return { data: await rpcGetPublicProfileCards(db, params?.p_user_ids as string[] ?? []), error: null };
      case "get_or_create_profile":
        return { data: await rpcGetOrCreateProfile(db, userId as string, params?.p_email as string | undefined), error: null };
      case "claim_daily_generation_bonus":
        return { data: await rpcClaimDailyGenerationBonus(db, userId as string), error: null };
      case "complete_onboarding_step":
        return { data: await rpcCompleteOnboardingStep(db, userId as string, params?.p_step_id as string), error: null };
      case "get_onboarding_progress":
        return { data: await rpcGetOnboardingProgress(db, userId as string), error: null };
      case "create_referral":
        return { data: await rpcCreateReferral(db, userId as string, params?.p_code as string), error: null };
      case "apply_referral":
        return { data: await rpcApplyReferral(db, userId as string, params?.p_code as string), error: null };
      case "redeem_referral":
        return { data: await rpcRedeemReferral(db, userId as string), error: null };
      case "get_notifications":
        return { data: await rpcGetNotifications(db, userId as string), error: null };
      case "mark_notification_read":
        return { data: await rpcMarkNotificationRead(db, params?.p_notification_id as string), error: null };
      case "get_unread_notification_count":
        return { data: await rpcGetUnreadNotificationCount(db, userId as string), error: null };
      case "get_growth_metrics":
        return { data: await rpcGetGrowthMetrics(db, userId as string), error: null };
      case "track_growth_event":
        return { data: await rpcTrackGrowthEvent(db, userId as string, params?.p_event as string, params?.p_data as Record<string, unknown> | undefined), error: null };
      case "get_invoice_history":
        return { data: await rpcGetInvoiceHistory(db, userId as string), error: null };
      case "get_distribution_usage_summary":
        return { data: await rpcGetDistributionUsageSummary(db, userId as string), error: null };
      case "record_distribution_pack_export":
        return { data: await rpcRecordDistributionPackExport(db, userId as string, params?.p_loop_id as string, params?.p_title as string, params?.p_artist_name as string, params?.p_featuring as string[] ?? [], params?.p_genre_name as string | null, params?.p_language_code as string, params?.p_explicit as boolean, params?.p_release_date as string | null), error: null };
      case "accept_distribution_terms":
        return { data: await rpcAcceptDistributionTerms(db, userId as string), error: null };
      case "get_user_plan":
        return { data: await rpcGetUserPlan(db, userId as string), error: null };
      case "update_user_plan":
        return { data: await rpcUpdateUserPlan(db, userId as string, params?.p_plan as string), error: null };
      case "update_profile":
        return { data: await rpcUpdateProfile(db, userId as string, params?.p_data as Record<string, unknown>), error: null };
      case "get_generation_usage":
        return { data: await rpcGetGenerationUsage(db, userId as string), error: null };
      case "increment_generation_usage":
        return { data: await rpcIncrementGenerationUsage(db, userId as string), error: null };
      case "get_level_info":
        return { data: await rpcGetLevelInfo(db, userId as string), error: null };
      case "add_xp":
        return { data: await rpcAddXp(db, userId as string, params?.p_amount as number), error: null };
      case "get_stripe_customer_id":
        return { data: await rpcGetStripeCustomerId(db, userId as string), error: null };
      case "set_stripe_customer_id":
        return { data: await rpcSetStripeCustomerId(db, userId as string, params?.p_customer_id as string), error: null };
      case "get_checkout_session":
        return { data: await rpcGetCheckoutSession(db, params?.p_session_id as string), error: null };
      case "create_purchase_bonus":
        return { data: await rpcCreatePurchaseBonus(db, userId as string, params?.p_bonus as number), error: null };
      case "get_stripe_portal_url":
        return { data: await rpcGetStripePortalUrl(params?.p_user_id as string ?? userId as string), error: null };
      case "admin_check_user":
        return { data: await rpcAdminCheckUser(db, params?.p_user_id as string), error: null };
      default:
        return { data: null, error: new Error(`RPC ${fnName} not implemented in Firebase layer`) };
    }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

const supabase = buildSupabaseApi();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isSupabaseConfigured(): boolean {
  const cfg = getFirebaseConfig();
  return !!(cfg.apiKey && cfg.projectId);
}

export { supabase, isSupabaseConfigured };
export type { FirebaseQueryBuilder };
