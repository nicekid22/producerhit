/**
 * Firebase client — lazy init pour le fallback Firestore.
 * Réutilise l'instance FirebaseApp de firebaseSupabaseClient pour éviter
 * les appels multiples à initializeApp.
 *
 * Les env vars VITE_FIREBASE_* doivent être définies pour activer Firebase.
 * Si absentes, le module est inerte (getFirebaseDb() retourne null).
 */

import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApp, isFirebaseReady } from "./firebaseSupabaseClient";

let firebaseDb: Firestore | null = null;
let tried = false;

/** Lazy-init de l'instance Firestore. Retourne null si non configuré. */
export function getFirebaseDb(): Firestore | null {
  if (firebaseDb) return firebaseDb;
  if (tried) return null;
  tried = true;

  const app = getFirebaseApp();
  if (!app) return null;

  try {
    firebaseDb = getFirestore(app);
    return firebaseDb;
  } catch {
    return null;
  }
}

export function isFirebaseConfigured(): boolean {
  return isFirebaseReady();
}
