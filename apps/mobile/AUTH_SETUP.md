# Auth unifiée web ↔ iOS

## Variables

Copier depuis la racine `.env` vers `apps/mobile/.env` :

```env
EXPO_PUBLIC_SUPABASE_URL=https://pmfnzenqemnonpglmjqx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Supabase Dashboard → Authentication → URL Configuration

Ajouter dans **Redirect URLs** :

- `producerhit://auth/callback`
- `https://www.producerhit.com/auth/callback` (déjà web)

## Flux mobile

| Méthode | Implémentation |
|---------|----------------|
| Email / password | `signInWithPassword` / `signUp` |
| Google | OAuth PKCE + `expo-web-browser` → `producerhit://auth/callback` |
| Reset password | email avec redirect mobile |

Fichiers : `lib/auth.ts`, `lib/supabase.ts` (PKCE + AsyncStorage), `app/auth/callback.tsx`.

## Tests manuels (acceptance)

1. **iOS → web** : créer compte sur iOS → se connecter sur https://www.producerhit.com avec le même email.
2. **Web → iOS** : compte existant web → login iOS OK.
3. **Reset** : forgot password → email → nouveau mot de passe → login iOS.
4. **Google** : OAuth sur device/simulateur avec build dev (pas Expo Go pour IAP ; OAuth OK en dev client).

Même `auth.users.id` → même `profiles.id` → mêmes `loops.user_id`.
