/**
 * Firebase client — initialisation lazy pour le fallback Firestore.
 * Utilisé uniquement quand Supabase primary + backup sont tous les deux down.
 *
 * Les env vars VITE_FIREBASE_* doivent être définies pour activer Firebase.
 * Si absentes, le module est inerte (getFirebaseDb() retourne null).
 */

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

let firebaseApp: FirebaseApp | null = null;
let firebaseDb: Firestore | null = null;

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

/** Retourne la config Firebase, ou null si les vars d'env sont absentes. */
export function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseConfig();
  return !!(cfg.apiKey && cfg.projectId);
}

/** Lazy-init de l'instance Firestore. Retourne null si non configuré. */
export function getFirebaseDb(): Firestore | null {
  if (firebaseDb) return firebaseDb;
  if (!isFirebaseConfigured()) return null;

  try {
    const cfg = getFirebaseConfig();
    firebaseApp = initializeApp(cfg);
    firebaseDb = getFirestore(firebaseApp);
    return firebaseDb;
  } catch {
    // Firebase déjà initialisé ou config invalide
    return null;
  }
}
