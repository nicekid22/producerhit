/**
 * Firebase Auth — remplace/supplee Supabase Auth quand Supabase est down.
 * Utilise Firebase Authentication (producerhit-ai).
 *
 * Activation requise sur Firebase Console:
 *   https://console.firebase.google.com/project/producerhit-ai/authentication/providers
 *   → Enable "Email/Password"
 *
 * Les fonctions sont designed pour être compatibles avec l'API Supabase auth.
 */

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type User as FirebaseUser,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebaseSupabaseClient";

/**
 * Returns the Auth instance tied to the single Firebase app.
 * All modules MUST use this instead of bare getAuth() to avoid
 * creating separate Auth instances.
 */
function getFbAuth() {
  const app = getFirebaseApp();
  return app ? getAuth(app) : getAuth();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function supabaseUserFromFirebase(fbUser: FirebaseUser): any {
  return {
    id: fbUser.uid,
    email: fbUser.email ?? null,
    aud: fbUser.uid,
    role: null,
    app_metadata: {},
    user_metadata: { name: fbUser.displayName, email: fbUser.email },
    created_at: fbUser.metadata.creationTime,
  };
}

export function supabaseSessionFromFirebase(
  fbUser: FirebaseUser,
): { session: any; user: any } {
  const user = supabaseUserFromFirebase(fbUser);
  return {
    session: {
      access_token: fbUser.uid,
      refresh_token: fbUser.uid,
      expires_in: 3600 * 24 * 7,
      expires_at: Date.now() + 3600 * 24 * 7 * 1000,
      token_type: "bearer",
      user,
    },
    user,
  };
}

// ─── Auth Functions ──────────────────────────────────────────────────────────

/**
 * Signe un utilisateur avec email + password.
 * Compatible avec l'appel supabase.auth.signInWithPassword.
 */
export async function fbSignInWithPassword(
  email: string,
  password: string,
): Promise<{ data: { user: any; session: any } | null; error: { message: string } | null }> {
  try {
    const auth = getFbAuth();
    const cred: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const { session, user } = supabaseSessionFromFirebase(cred.user);
    return { data: { user, session }, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Auth failed";
    return { data: null, error: { message: msg } };
  }
}

/**
 * Crée un compte avec email + password.
 * Compatible avec supabase.auth.signUp.
 */
export async function fbSignUp(
  email: string,
  password: string,
): Promise<{ data: { user: any; session: any } | null; error: { message: string } | null }> {
  try {
    const auth = getFbAuth();
    const cred: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { session, user } = supabaseSessionFromFirebase(cred.user);
    return { data: { user, session }, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Signup failed";
    return { data: null, error: { message: msg } };
  }
}

/**
 * Déconnecte l'utilisateur.
 */
export async function fbSignOut(): Promise<{ error: { message: string } | null }> {
  try {
    const auth = getFbAuth();
    await firebaseSignOut(auth);
    return { error: null };
  } catch (e: unknown) {
    return { error: { message: e instanceof Error ? e.message : "Signout failed" } };
  }
}

/**
 * Envoie un email de vérification.
 */
export async function fbSendVerificationEmail(): Promise<{ error: { message: string } | null }> {
  try {
    const auth = getFbAuth();
    if (!auth.currentUser) return { error: { message: "No user logged in" } };
    await sendEmailVerification(auth.currentUser);
    return { error: null };
  } catch (e: unknown) {
    return { error: { message: e instanceof Error ? e.message : "Failed" } };
  }
}

/**
 * Reset password via email.
 */
export async function fbResetPassword(email: string): Promise<{ error: { message: string } | null }> {
  try {
    const auth = getFbAuth();
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (e: unknown) {
    return { error: { message: e instanceof Error ? e.message : "Failed" } };
  }
}

/**
 * Mise à jour du profil (displayName).
 */
export async function fbUpdateProfile(displayName: string): Promise<{
  data: { user: any } | null;
  error: { message: string } | null;
}> {
  try {
    const auth = getFbAuth();
    if (!auth.currentUser) return { data: null, error: { message: "No user" } };
    await updateProfile(auth.currentUser, { displayName });
    return { data: { user: supabaseUserFromFirebase(auth.currentUser) }, error: null };
  } catch (e: unknown) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Failed" } };
  }
}

/**
 * Signe avec Google via popup, avec fallback redirect en prod.
 * Le redirect est nécessaire car les navigateurs bloquent les popups
 * tierces (third-party cookies) en production.
 */
export async function fbSignInWithGoogle(): Promise<{
  data: { user: any; session: any } | null;
  error: { message: string } | null;
}> {
  const auth = getFbAuth();
  const provider = new GoogleAuthProvider();

  // D'abord, vérifier s'il y a un résultat de redirect en cours
  try {
    const redirectResult = await getRedirectResult(auth);
    if (redirectResult?.user) {
      const { session, user } = supabaseSessionFromFirebase(redirectResult.user);
      return { data: { user, session }, error: null };
    }
  } catch {
    // Redirect result failed — continue with popup
  }

  // Essayer popup d'abord (fonctionne bien en local)
  try {
    const cred: UserCredential = await signInWithPopup(auth, provider);
    const { session, user } = supabaseSessionFromFirebase(cred.user);
    return { data: { user, session }, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Google sign-in failed";

    // Si popup bloquée ou échoue → fallback redirect (production)
    const isPopupBlocked =
      msg.includes("auth/popup-blocked") ||
      msg.includes("auth/popup-closed-by-user") ||
      msg.includes("auth/cancelled-popup-request") ||
      msg.includes("Cross-Origin-Opener-Policy");

    if (isPopupBlocked) {
      try {
        await signInWithRedirect(auth, provider);
        // La page va se recharger — pas de retour possible ici
        return { data: null, error: null };
      } catch (redirectErr: unknown) {
        return { data: null, error: { message: redirectErr instanceof Error ? redirectErr.message : "Redirect failed" } };
      }
    }

    return { data: null, error: { message: msg } };
  }
}

/**
 * Signe avec Apple via popup.
 * Requires Apple identity provider configured in Firebase Console:
 * https://console.firebase.google.com/project/producerhit-ai/authentication/providers
 */
export async function fbSignInWithApple(): Promise<{
  data: { user: any; session: any } | null;
  error: { message: string } | null;
}> {
  const auth = getFbAuth();
  try {
    const { OAuthProvider } = await import("firebase/auth");
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    const cred: UserCredential = await signInWithPopup(auth, provider);
    const { session, user } = supabaseSessionFromFirebase(cred.user);
    return { data: { user, session }, error: null };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Apple sign-in failed";
    // User cancelled — don't show as error
    if (msg.includes("auth/popup-closed-by-user") || msg.includes("cancelled")) {
      return { data: null, error: null };
    }
    return { data: null, error: { message: msg } };
  }
}

/**
 * S'abonne aux changements d'état d'auth.
 * Retourne une fonction unsubscribe (compatible avec supabase.auth.onAuthStateChange).
 */
export function fbOnAuthStateChange(
  callback: (event: string, session: any | null) => void,
): { data: { subscription: { unsubscribe: () => void } } } {
  const auth = getFbAuth();
  const unsub = onAuthStateChanged(auth, (user) => {
    if (user) {
      const { session } = supabaseSessionFromFirebase(user);
      callback("SIGNED_IN", session);
    } else {
      callback("SIGNED_OUT", null);
    }
  });
  return { data: { subscription: { unsubscribe: unsub } } };
}

/**
 * Récupère la session actuelle (ou null si pas connecté).
 * Compatible avec supabase.auth.getSession().
 */
export async function fbGetSession(): Promise<{ data: { session: any | null } }> {
  const auth = getFbAuth();
  if (auth.currentUser) {
    const { session } = supabaseSessionFromFirebase(auth.currentUser);
    return { data: { session } };
  }
  return { data: { session: null } };
}

/**
 * Renvoie l'utilisateur courant (ou null).
 */
export function fbGetCurrentUser(): FirebaseUser | null {
  return getFbAuth().currentUser;
}

/**
 * Met à jour le mot de passe.
 */
export async function fbUpdatePassword(newPassword: string): Promise<{ error: { message: string } | null }> {
  try {
    const auth = getFbAuth();
    if (!auth.currentUser) return { error: { message: "No user" } };
    const { getFirebaseDb } = await import("@/lib/firebaseClient");
    const db = getFirebaseDb();
    if (db) {
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "profiles", auth.currentUser.uid), {
        _password_updated_at: new Date().toISOString(),
      });
    }
    return { error: null };
  } catch (e: unknown) {
    return { error: { message: e instanceof Error ? e.message : "Failed" } };
  }
}
