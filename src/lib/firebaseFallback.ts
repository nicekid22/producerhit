/**
 * Firebase fallback — lecture de profiles et loops depuis Firestore
 * quand Supabase primary + backup sont tous les deux down.
 *
 * Les données sont sync depuis Supabase vers Firebase via le script
 * scripts/sync-firebase.mjs (GitHub Actions, tous les 3 jours).
 *
 * Ceci est un fallback en lecture seule — les écritures restent sur Supabase.
 */

import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { getFirebaseDb, isFirebaseConfigured } from "./firebaseClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FirebaseProfile = {
  id: string;
  plan: string;
  username: string | null;
  avatar_id: number | null;
  creator_type: string | null;
  bio: string | null;
  loops_used_this_month: number;
  referral_bonus: number;
  purchased_bonus: number;
  level_bonus: number;
  daily_bonus_month: number;
  referral_code: string | null;
  updated_at: string | null;
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
// Écriture — utilisées par le sync script (server-side via firebase-admin)
// Ces fonctions ne sont pas appelées côté client, mais sont exportées
// pour que le sync script puisse réutiliser les types.
// ---------------------------------------------------------------------------

export function isFirebaseAvailable(): boolean {
  return isFirebaseConfigured() && getFirebaseDb() !== null;
}
