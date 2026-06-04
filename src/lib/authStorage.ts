/**
 * Stockage auth Supabase — localStorage + miroir sessionStorage.
 * Sur mobile (Safari / PWA), le retour OAuth peut parfois ne pas retrouver le verifier
 * si seul un des deux espaces est accessible ; le miroir améliore la reprise PKCE.
 */
export const supabaseAuthStorage = {
  getItem(key: string): string | null {
    try {
      const fromLocal = window.localStorage.getItem(key);
      if (fromLocal != null) return fromLocal;
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
