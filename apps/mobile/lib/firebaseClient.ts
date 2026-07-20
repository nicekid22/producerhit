import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import Constants from "expo-constants";

let firebaseApp: FirebaseApp | null = null;
let firebaseDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;
let firebaseStorage: FirebaseStorage | null = null;

function getFirebaseConfig() {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  return {
    apiKey:
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY ??
      extra?.firebaseApiKey,
    authDomain:
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ??
      extra?.firebaseAuthDomain,
    projectId:
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
      extra?.firebaseProjectId,
    storageBucket:
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
      extra?.firebaseStorageBucket,
    messagingSenderId:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
      extra?.firebaseMessagingSenderId,
    appId:
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID ??
      extra?.firebaseAppId,
  };
}

export function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseConfig();
  return !!(cfg.apiKey && cfg.projectId);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (firebaseApp) return firebaseApp;
  if (!isFirebaseConfigured()) return null;
  try {
    firebaseApp = initializeApp(getFirebaseConfig());
    return firebaseApp;
  } catch {
    return null;
  }
}

export function getFirebaseDb(): Firestore | null {
  if (firebaseDb) return firebaseDb;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    firebaseDb = getFirestore(app);
    return firebaseDb;
  } catch {
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  if (firebaseAuth) return firebaseAuth;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    firebaseAuth = getAuth(app);
    return firebaseAuth;
  } catch {
    return null;
  }
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (firebaseStorage) return firebaseStorage;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    firebaseStorage = getStorage(app);
    return firebaseStorage;
  } catch {
    return null;
  }
}
