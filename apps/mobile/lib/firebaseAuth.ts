import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function supabaseSessionFromFirebase(fbUser: FirebaseUser): { session: any; user: any } {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fbSignInWithPassword(email: string, password: string): Promise<{ data: { user: any; session: any } | null; error: { message: string } | null }> {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fbSignUp(email: string, password: string): Promise<{ data: { user: any; session: any } | null; error: { message: string } | null }> {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fbSignOut(): Promise<{ error: { message: string } | null }> {
  try {
    const auth = getAuth();
    await firebaseSignOut(auth);
    return { error: null };
  } catch (e: unknown) {
    return { error: { message: e instanceof Error ? e.message : "Signout failed" } };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fbResetPassword(email: string): Promise<{ error: { message: string } | null }> {
  try {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (e: unknown) {
    return { error: { message: e instanceof Error ? e.message : "Failed" } };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fbUpdateProfile(displayName: string): Promise<{ data: { user: any } | null; error: { message: string } | null }> {
  try {
    const auth = getAuth();
    if (!auth.currentUser) return { data: null, error: { message: "No user" } };
    await updateProfile(auth.currentUser, { displayName });
    return { data: { user: supabaseUserFromFirebase(auth.currentUser) }, error: null };
  } catch (e: unknown) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Failed" } };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fbOnAuthStateChange(callback: (event: string, session: any | null) => void): { data: { subscription: { unsubscribe: () => void } } } {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fbGetSession(): Promise<{ data: { session: any | null } }> {
  const auth = getAuth();
  if (auth.currentUser) {
    const { session } = supabaseSessionFromFirebase(auth.currentUser);
    return { data: { session } };
  }
  return { data: { session: null } };
}

export function fbGetCurrentUser(): FirebaseUser | null {
  return getAuth().currentUser;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fbUpdatePassword(newPassword: string): Promise<{ error: { message: string } | null }> {
  try {
    const auth = getAuth();
    if (!auth.currentUser) return { error: { message: "No user" } };
    return { error: null };
  } catch (e: unknown) {
    return { error: { message: e instanceof Error ? e.message : "Failed" } };
  }
}
