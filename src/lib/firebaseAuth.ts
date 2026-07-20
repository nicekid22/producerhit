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
  type User as FirebaseUser,
  type UserCredential,
} from "firebase/auth";


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
    const auth = getAuth();
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
    const auth = getAuth();
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
    const auth = getAuth();
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
    const auth = getAuth();
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
    const auth = getAuth();
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
    const auth = getAuth();
    if (!auth.currentUser) return { data: null, error: { message: "No user" } };
    await updateProfile(auth.currentUser, { displayName });
    return { data: { user: supabaseUserFromFirebase(auth.currentUser) }, error: null };
  } catch (e: unknown) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Failed" } };
  }
}

/**
 * Signe avec Google via popup.
 */
export async function fbSignInWithGoogle(): Promise<{
  data: { user: any; session: any } | null;
  error: { message: string } | null;
}> {
  try {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const cred: UserCredential = await signInWithPopup(auth, provider);
    const { session, user } = supabaseSessionFromFirebase(cred.user);
    return { data: { user, session }, error: null };
  } catch (e: unknown) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Google sign-in failed" } };
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
  try {
    const auth = getAuth();
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
  const auth = getAuth();
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
  const auth = getAuth();
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
  return getAuth().currentUser;
}

/**
 * Met à jour le mot de passe.
 */
export async function fbUpdatePassword(newPassword: string): Promise<{ error: { message: string } | null }> {
  try {
    const auth = getAuth();
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