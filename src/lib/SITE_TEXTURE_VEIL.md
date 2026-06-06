# Voile texture site (effet feutre)

Profondeur logique — le voile vit **dans le fond**, pas par-dessus l’UI.

## Principe

| Zone | Traitement |
|------|------------|
| Mesh / dégradé / marges | **Cozy** (`BackdropTextureVeil`) — grain large, le plus visible |
| Panneaux dashboard (console, workspace, cartes) | Fond légèrement plus opaque → le grain ne traverse plus le verre |
| Dashboard | **Aucun** overlay fixed plein écran |
| Landing / marketing | Cozy sur fond + ambient fin (~5,5 %) **sous** le contenu |

## Fichiers

| Fichier | Rôle |
|--------|------|
| `BackdropTextureVeil.tsx` | Voile dans `.pk-warm-backdrop` / fond landing |
| `SiteTextureVeil.tsx` | Ambient marketing uniquement (z-4, très léger) |
| `site-texture-veil.css` | Opacités + fonds UI + micro-grain panneaux |
| `public/textures/site-texture-veil-cozy.png` | Grain large flou |
| `public/textures/prism-landing-veil.png` | Grain fin (ambient + micro-grain) |

## Variables (ajustement rapide)

```css
--pk-veil-backdrop-opacity   /* cozy fond — ~0.11–0.12 (moins agressif) */
--pk-veil-marketing-ambient /* ambient — ~0.042 */
--pk-veil-panel-grain        /* micro-grain panneaux — ~0.034–0.038 */
--pk-veil-surface-focal      /* panneau focal — ~36 % opaque */
--pk-veil-surface-mid        /* cartes / sections — ~23 % */
--pk-veil-surface-soft       /* loops, tiles — ~15 % */
--pk-veil-surface-ghost      /* zones ouvertes (hub hero) — ~8 % */
```

## Harmonisation systémique

Le bloc **HARMONIE SYSTÉMIQUE** (fin de `site-texture-veil.css`) applique automatiquement :

- `.pk-prism-card`, `.pk-prism-glass`, `.pk-pricing-card`, `.pk-blog-card`
- Tout panneau marketing `main/div` avec `rounded` + `border` (blog, compare, légal…)
- Dashboard : écrase les fonds opaques de `index.css` (0.9 → transparence tier)
- 4 tiers : focal → mid → soft → ghost

Pas besoin de lister chaque page blog : les sélecteurs structurels couvrent le marketing entier.

## Hiérarchie landing

1. **Générateur hero** — le plus propre (focal)
2. **Cartes communauté / features** — tier 2
3. **Cartes latérales hero** — plus texturées
4. **Trust / intro** — fond respire (cozy visible)

## Hiérarchie dashboard

1. **Console création** — la plus propre
2. **Workspace** — tier 2 + micro-grain
3. **Cartes loops** — un peu plus de grain (tier 3)

## Couverture site (matrice)

| Zone | Backdrop cozy | Micro-grain panneau |
|------|---------------|---------------------|
| Landing | ✓ | hero gen, cartes, footer |
| Marketing (auth, pricing, blog, legal, compare, profil) | ✓ | panneaux `pk-*` + sections glass |
| Dashboard | ✓ | console, workspace, loops, rail, chrome mobile |
| Explore / community | ✓ | hub hero, nav, vibe tiles, cartes |
| Library / Settings / SampleLab | ✓ | page hero, section cards |
| Player dock (bas) | — | grain sur `.pk-prism-player--dock` |
| Modales / dropdowns | — | `.pk-veil-modal-panel`, `.pk-dropdown-panel` |
| Nav mobile bas | — | `.pk-app-shell-mobile-nav` |

## Rollback

```
VITE_SITE_TEXTURE_VEIL=0
```

Désactive les composants voile (`SiteTextureVeil`, `BackdropTextureVeil`). Les règles CSS panneau restent légères ; pour un rollback visuel complet, commenter l’import dans `main.tsx`.
