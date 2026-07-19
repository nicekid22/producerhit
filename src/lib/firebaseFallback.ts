/**
 * Firebase fallback — lecture de profiles et loops depuis Firestore
 * quand Supabase primary + backup sont tous les deux down.
 *
 * Les données sont sync depuis Supabase vers Firebase via le script
 * scripts/sync-firebase.mjs (GitHub Actions, tous les 3 jours).
 *
 * Ceci est un fallback en lecture seule — les écritures restent sur Supabase.
 */

import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "./firebaseClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FirebaseProfile = {
  // Core fields (always present)
  id: string;
  plan: string;
  username: string | null;
  // Full UserProfileRow fields
  legal_first_name: string | null;
  legal_last_name: string | null;
  avatar_id: number;
  creator_type: string | null;
  bio: string | null;
  loops_used_this_month: number;
  voice_to_song_used_this_month: number;
  voice_clone_used_this_month: number;
  referral_bonus: number;
  purchased_bonus: number;
  referral_code: string | null;
  level_bonus: number;
  daily_bonus_month: number;
  social: Record<string, string>;
  hosted_audio_expires_at: string | null;
  // Metadata
  updated_at: string | null;
  email?: string | null;
};

export type FirebaseLoop = {
  id: string;
  user_id: string;
  name: string;
  genre: string | null;
  bpm: number | null;
  mood: string | null;
  key: string | null;
  scale: string | null;
  cover_url: string | null;
  audio_url: string | null;
  is_public: boolean;
  is_saved: boolean;
  created_at: string;
  loop_length: number | null;
  energy_level: number | null;
  influence: string | null;
};

// ---------------------------------------------------------------------------
// Lecture — utilisées quand Supabase est down
// ---------------------------------------------------------------------------

/** Charge un profil depuis Firestore. Retourne null si non trouvé ou si Firebase n'est pas configuré. */
export async function getFirebaseProfile(userId: string): Promise<FirebaseProfile | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const snap = await getDoc(doc(db, "profiles", userId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as FirebaseProfile;
  } catch {
    return null;
  }
}

/** Charge les loops d'un utilisateur depuis Firestore. Limite à 200 (même que Supabase). */
export async function getFirebaseLoops(userId: string): Promise<FirebaseLoop[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  try {
    const q = query(
      collection(db, "loops"),
      where("user_id", "==", userId),
      orderBy("created_at", "desc"),
      limit(200),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirebaseLoop));
  } catch {
    return [];
  }
}

/** Charge les loops publiques (community/explore) depuis Firestore. */
export async function getFirebasePublicLoops(pageLimit = 30): Promise<FirebaseLoop[]> {
  const db = getFirebaseDb();
  if (!db) return [];

  try {
    const q = query(
      collection(db, "loops"),
      where("is_public", "==", true),
      orderBy("created_at", "desc"),
      limit(pageLimit),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirebaseLoop));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Écriture — création/update de profiles Firestore pour Firebase Auth users
// ---------------------------------------------------------------------------

function generateReferralCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const DEFAULT_FIREBASE_PROFILE = {
  plan: "free",
  username: null,
  legal_first_name: null,
  legal_last_name: null,
  avatar_id: 1,
  creator_type: null,
  bio: null,
  loops_used_this_month: 0,
  voice_to_song_used_this_month: 0,
  voice_clone_used_this_month: 0,
  referral_bonus: 0,
  purchased_bonus: 0,
  referral_code: null,
  level_bonus: 0,
  daily_bonus_month: 0,
  social: {},
  hosted_audio_expires_at: null,
  updated_at: null,
};

/** Crée un profil Firestore par défaut pour un utilisateur Firebase Auth.
 *  Idempotent — si le profil existe déjà, ne fait rien. */
export async function ensureFirebaseProfile(
  userId: string,
  email?: string | null,
): Promise<FirebaseProfile | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const docRef = doc(db, "profiles", userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as FirebaseProfile;
    }
    // Créer le profil
    const referralCode = generateReferralCode();
    const profile: Omit<FirebaseProfile, "id"> = {
      ...DEFAULT_FIREBASE_PROFILE,
      referral_code: referralCode,
      email: email ?? null,
      updated_at: new Date().toISOString(),
    };
    await setDoc(docRef, profile, { merge: true });
    return { id: userId, ...profile };
  } catch {
    return null;
  }
}

/** Met à jour un profil existant dans Firestore.
 *  Appelé par le sync script côté serveur. */
export async function saveFirebaseProfile(
  userId: string,
  profile: Partial<FirebaseProfile>,
): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    const docRef = doc(db, "profiles", userId);
    await updateDoc(docRef, {
      ...profile,
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch {
    return false;
  }
}

/** Charge un profil Firestore. Si absent, crée un profil par défaut (Firebase Auth user).
 *  Retourne le profil ou null si Firebase non configuré. */
export async function loadFirebaseProfile(
  userId: string,
  email?: string | null,
): Promise<FirebaseProfile | null> {
  const db = getFirebaseDb();
  if (!db) return null;

  const docRef = doc(db, "profiles", userId);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as FirebaseProfile;
    }
  } catch {
    // Firestore down
  }
  // Profil absent — créer par défaut pour ce Firebase user
  return ensureFirebaseProfile(userId, email);
}

export function isFirebaseAvailable(): boolean {
  return isFirebaseConfigured() && getFirebaseDb() !== null;
}
