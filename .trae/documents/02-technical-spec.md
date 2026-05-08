## Spécification technique — MVP

### Stack
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS (dark par défaut)
- Routing: React Router v6
- State: Zustand
- Backend/Auth/DB: Supabase
- Toasts: react-hot-toast
- Icons: lucide-react

### Architecture frontend
- `src/pages`: routes
- `src/components`: UI partagée
- `src/stores`: Zustand stores (auth, loops, player)
- `src/lib`: clients (supabase) et helpers
- `src/styles`: tokens CSS

### Auth
- Client Supabase dans `src/lib/supabaseClient.ts`.
- Gestion session:
  - Récupération session au boot
  - Listener `onAuthStateChange`
- Routes protégées via wrapper `ProtectedRoute`.
- OAuth Google: `signInWithOAuth({ provider: 'google' })`.

### Loops & lecture audio
- Génération placeholder: création d’un court fichier WAV synthétique côté client.
- Stockage temporaire côté client: Zustand.
- Persistance DB: insertion d’une ligne `loops` à la génération et `is_saved` toggle.

### Base de données (Supabase)
- `profiles`: 1-1 avec `auth.users` (id uuid).
- `loops`: éléments générés, liés au user.
- RLS activée, policies:
  - Lire ses loops
  - Insérer ses loops
  - Mettre à jour ses loops
  - Supprimer ses loops
- Grants explicites sur `anon`/`authenticated`.

### Déploiement
- Vercel (SPA). Les routes front doivent être réécrites vers `index.html`.
