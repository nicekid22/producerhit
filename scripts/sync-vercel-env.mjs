/**
 * Sync des variables d'environnement critiques vers Vercel
 * ========================================================
 * USAGE:
 *   1. Se connecter au dashboard Vercel: https://vercel.com/dashboard
 *   2. Projet: producerhit
 *   3. Settings → Environment Variables
 *   4. OU exécuter: vercel env add <name> (si CLI configurée)
 *
 * VARIABLES À AJOUTER (pour Production, Preview, Development):
 * ──────────────────────────────────────────────────────────
 *
 * Nom               │ Valeur (copier depuis .env)
 * ──────────────────┼────────────────────────────────────
 * VITE_SUPABASE_URL │ https://pmfnzenqemnonpglmjqx.supabase.co
 * VITE_SUPABASE_ANON_KEY │ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtZm56ZW5xZW1ub25wZ2xtanF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDQ2MzUsImV4cCI6MjA5MjE4MDYzNX0.7Y8G__M7BXNRT02M5BSK4ULDoEEkJ-LE4cEpSGz0OCs
 * ──────────────────────────────────────────────────────────
 *
 * REDÉPLOYER APRÈS AVOIR AJOUTÉ LES VARIABLES
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envFile = join(root, ".env");

const CRITICAL_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
];

let envVars = {};
try {
  const content = readFileSync(envFile, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    envVars[key] = val;
  }
} catch (e) {
  console.error("❌ .env non trouvé:", e.message);
  process.exit(1);
}

console.log("\n📋 Variables critiques pour Vercel:\n");
for (const key of CRITICAL_VARS) {
  const val = envVars[key];
  if (val) {
    console.log(`✅ ${key}`);
    console.log(`   ${val}\n`);
  } else {
    console.log(`❌ ${key} — MANQUANTE dans .env\n`);
  }
}

console.log(`
═════════════════════════════════════════════════════════════════════
🔧 ACTIONS OBLIGATOIRES SUR VERCEL DASHBOARD
═════════════════════════════════════════════════════════════════════

1. Ouvrir https://vercel.com/dashboard
2. Cliquer sur le projet "producerhit"
3. Settings → Environment Variables
4. Pour CHAQUE variable ci-dessus:
   a) Cliquer "Add New" / "Ajouter"
   b) Nom: <copier le nom>
   c) Valeur: <copier la valeur>
   d) Environments: ✅ Production  ✅ Preview  ✅ Development
   e) Cliquer "Save"
5. Une fois toutes les variables ajoutées:
   - Aller dans "Deployments"
   - Cliquer sur le dernier déploiement
   - Cliquer "Redeploy"
   - Attendre que le déploiement se termine

═════════════════════════════════════════════════════════════════════
🔧 ACTIONS OBLIGATOIRES SUR SUPABASE DASHBOARD
═════════════════════════════════════════════════════════════════════

1. Ouvrir https://supabase.com/dashboard/project/pmfnzenqemnonpglmjqx

2. Authentication → URL Configuration
   Site URL: https://www.producerhit.com
   Redirect URLs — ajouter ces 2 URLs:
     • https://www.producerhit.com/auth/callback
     • https://producerhit.com/auth/callback
   Cliquer "Save"

3. Authentication → Providers → Google
   - Vérifier que "Enable Sign in with Google" est ON
   - Si NON: l'activer et configurer Google Client ID + Client Secret
     (Créer une OAuth App sur https://console.cloud.google.com/)

4. Authentication → Providers → Apple
   - Vérifier que "Enable Sign in with Apple" est ON si utilisé

5. Authentication → Email → Confirm
   - Si "Confirm email" est activé, les nouveaux utilisateurs
     doivent confirmer leur email avant de pouvoir se connecter

═════════════════════════════════════════════════════════════════════
📱 APRÈS LES CORRECTIONS
═════════════════════════════════════════════════════════════════════

1. Attendre le redéploiement Vercel
2. Aller sur https://www.producerhit.com/debug-auth
   → Cette page affiche l'état de santé de l'authentification
3. Tester la connexion:
   - Email/password: https://www.producerhit.com/auth?mode=signup
   - Google: https://www.producerhit.com/auth?mode=login (cliquer Google)

4. Si ça marche toujours pas, vérifier la console du navigateur (F12)
   pour les erreurs réseau

═════════════════════════════════════════════════════════════════════
`);

// Exporter pour usage programme
export const criticalVars = CRITICAL_VARS.map((k) => ({ key: k, value: envVars[k] }));