# CLOUD theme — rollback

Thème **Cloud** (glassmorphism Apple-like, 4 accents) en **opt-in** via flag + switch UI. **Prism** et **Warm Glass** restent inchangés par défaut.

## Tester rapidement (app complète)

**Dev** : Cloud activé par défaut dans Paramètres → Apparence.

Raccourci direct studio :

```
/theme-preview/cloud?go=dashboard
```

Active Cloud + accent sauvegardé, puis ouvre le **vrai** Dashboard (pas de texte moodboard).

Autres cibles : `?go=landing`, `?go=library`, `?go=settings`

## Activer en production

`.env` :

```
VITE_CLOUD_THEME=1
```

Désactiver : `VITE_CLOUD_THEME=0`

Puis **Paramètres → Apparence** : Prism / Warm Glass / Cloud + 4 accents.

Persistance :

- Thème : `localStorage` clé `producerhit_visual_theme_v1` (`cloud`)
- Accent : `localStorage` clé `producerhit_cloud_accent_v1`

## Rollback rapide

1. Paramètres → Apparence → **Prism** ou **Warm Glass**
2. Ou `.env` : `VITE_CLOUD_THEME=0`

## Rollback complet (supprimer le feature)

1. `VITE_CLOUD_THEME=0` ou retirer
2. Supprimer les fichiers :
   - `src/styles/cloud-theme.css`
   - `src/stores/cloudAccentStore.ts`
   - `src/hooks/useCloudHtmlClass.ts`
   - `src/components/CloudBackdrop.tsx`
   - `src/components/CloudThemePicker.tsx`
   - `src/components/CloudThemeSettingsBlock.tsx`
   - `src/pages/CloudThemePreview.tsx`
   - `src/lib/CLOUD_THEME_ROLLBACK.md`
3. Retirer `"cloud"` de `src/stores/visualThemeStore.ts`
4. Retirer `CLOUD_THEME_ENABLED` de `src/lib/featureFlags.ts`
5. Retirer imports / branches Cloud dans :
   - `src/lib/themeStyles.ts`
   - `src/main.tsx`
   - `src/components/ThemeBootstrap.tsx`
   - `src/components/AppShell.tsx`
   - `src/components/marketing/MarketingPageShell.tsx`
   - `src/pages/Settings.tsx`
   - `src/App.tsx` (route preview)

## Périmètre

- **CSS scopé** : `.pk-cloud-stage`, `html.pk-cloud-active`
- **Overrides** : cartes Prism, pills, sidebar, champs — base studio utilisable
- **Pas de refonte** des pages existantes — activation via classe + variables CSS
- Moodboard : `public/img/new cloud theme v.2 moodboard/`
- Photos fond (par accent) : voir `src/lib/cloudThemeAssets.ts`
- Favicons : `public/favicon-cloud-{transparent,green,red,blue}.svg`
- PNG / iOS : `npm run icons:generate` → `favicon-cloud-*-32.png`, `apple-touch-icon-cloud-*.png`
- Chrome navigateur : `src/lib/brandChrome.ts` (theme-color, apple-touch, favicon PNG)
