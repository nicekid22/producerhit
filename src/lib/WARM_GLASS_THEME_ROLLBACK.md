# Warm Glass theme — rollback

Thème **Warm Glass** (orange / rose / jaune) en **opt-in** via switch UI. Le thème **Prism** reste le défaut.

## Switcher (runtime)

- **Sidebar** (barre latérale) : bouton ☀ / ✦ — toggle instantané
- **Paramètres → Apparence** : choix Prism / Warm Glass
- Persistance : `localStorage` clé `producerhit_visual_theme_v1`

## Activer Warm Glass par défaut au premier visit (optionnel)

`.env` :

```
VITE_WARM_GLASS_THEME=1
```

Sans choix utilisateur en cache, le premier chargement ouvre en Warm Glass.

## Rollback rapide

1. Clic sur le bouton thème dans la sidebar → retour **Prism**
2. Ou Paramètres → Apparence → **Prism**

## Rollback complet (supprimer le feature)

1. `VITE_WARM_GLASS_THEME=0` ou retirer
2. Retirer `import "./styles/warm-glass-theme.css"` de `src/main.tsx`
3. Retirer `WARM_GLASS_THEME_DEFAULT` de `src/lib/featureFlags.ts`
4. Retirer `pk-warm-glass-stage` dans `src/components/AppShell.tsx`
5. Supprimer :
   - `src/styles/warm-glass-theme.css`
   - `src/stores/visualThemeStore.ts`
   - `src/components/ThemeToggleButton.tsx`
   - imports dans `Sidebar.tsx` et `Settings.tsx`
   - `src/lib/WARM_GLASS_THEME_ROLLBACK.md`

## Périmètre

- **Dashboard** : `AppShell` + `pk-warm-glass-stage`
- **Landing** : mesh + backdrop warm
- **Marketing** : `MarketingPageShell` — blog, tarifs, SEO (`Home`), comparatifs, légal, auth, loop public, profil créateur
- Classe globale portails : `html.pk-warm-glass-active` via `ThemeBootstrap`
- Overrides CSS scopés `.pk-warm-glass-stage` — Prism reste disponible via le switch

## Thème principal (Warm par défaut)

Quand le visuel est validé partout :

```
VITE_WARM_GLASS_THEME=1
```

Ou `WARM_GLASS_THEME_DEFAULT = true` dans `featureFlags.ts` (équivalent au flag ci-dessus).
