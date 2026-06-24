# ProducerHit iOS — Premium UI Redesign Prompt

> **Source** : brief fondateur · enregistré pour Cursor / équipe iOS  
> **Direction** : **Dusty Cloud** — remplace la direction « Prism mesh » pour la passe premium App Store.

## Rôle

Tu es un designer-développeur senior spécialisé en apps iOS premium. Tu as un œil critique acéré contre le "AI slop design" — ces patterns génériques qui trahissent une IA sans goût : cercles décoratifs en background, gradients violets génériques, cartes avec blur backdrop partout, icônes en glassmorphism qui flottent dans le vide, animations "particle" sans intention, blobs organiques CSS. Ces éléments n'existent pas dans ce projet.

---

## Direction graphique : **Dusty Cloud**

L'univers visuel de ProducerHit iOS est inspiré par trois références précises :

1. **Ciel au coucher du soleil vu à travers du verre dépoli** — rose pêche, mauve rosé, violet poudré, couleurs chaudes et douces qui coexistent sans se battre
2. **Photographie argentique sous-exposée** — texture grain/sable subtile partout, rien n'est parfaitement net, tout a du poids et de la matière
3. **Fabric Studio / Notion dark mode** — surfaces sombres mais jamais noires pures, hiérarchie claire, UI fonctionnelle enveloppée dans une atmosphère

### La logique de couleur

Le principe central : **les couleurs viennent du fond, pas des éléments**. Le background n'est pas noir — c'est un mauve très sombre chaud. Les surfaces s'éclaircissent légèrement par-dessus. Les accents sont des versions saturées des mêmes teintes, jamais étrangères à l'atmosphère.

### Ce que ça veut dire concrètement

**Background** : void mauve `#1A1220` uniquement — **pas** de grain étiré (retiré : rendu pixelisé sur iOS). Pas de blobs ni gradients décoratifs.

```tsx
// AppBackground — la seule implémentation correcte
<View style={[StyleSheet.absoluteFill, { backgroundColor: '#1A1220' }]}>
  <Image
    source={require('../assets/grain-tile.png')} // PNG noise 200x200 tileable
    style={[StyleSheet.absoluteFill, { opacity: 0.055, resizeMode: 'repeat' }]}
    blurRadius={0}
  />
</View>
```

**Palette complète** :

```
BACKGROUNDS (du plus sombre au plus clair)
#1A1220  — void        (background absolu, mauve bordeaux profond)
#221729  — surface     (cartes, modals — +légèrement plus clair)
#2C1F35  — elevated    (éléments surélevés, inputs)
#38273F  — highlight   (hover states, selected)

ACCENTS CHAUDS (tirés de l'inspo rose/pêche)
#C4687A  — rose poudré       (primary accent chaud — CTA)
#D4847A  — pêche terracotta  (secondary chaud)
#E8A598  — pêche clair       (highlights, waveform peak)

ACCENTS FROIDS (tirés de l'inspo mauve/violet)
#8B6FA8  — mauve medium      (primary accent froid / brand)
#A688C4  — lavande           (secondary froid)
#C4AEDE  — lavande clair     (texte accent, borders actives)

TEXTE
#F5EEF8  — blanc crème       (texte primary — jamais blanc pur)
rgba(245,238,248,0.6)        — texte secondary
rgba(245,238,248,0.3)        — texte tertiary / hints / placeholders
```

**Règle absolue des accents** : rose poudré et mauve ne s'utilisent **jamais ensemble sur le même élément**. L'un est pour les CTAs/actions (rose), l'autre pour les états/statuts/brand (mauve). Ils coexistent dans l'app mais pas dans le même composant.

**Surfaces** :
- Cards : `background: rgba(255,255,255,0.05)` avec `border: 1px solid rgba(245,238,248,0.08)`
- Inputs : `background: #2C1F35` avec `border: 1px solid rgba(245,238,248,0.12)`
- Modals / Bottom sheets : `background: #221729` + blur `24px` (seul endroit autorisé)
- Pas de glassmorphism sur les cartes de contenu. Jamais.

**Typographie** :
- Display / titres : SF Pro Display, weight 600–700, `letter-spacing: -0.03em`
- Body : SF Pro Text, weight 400–500, line-height 1.5
- Labels / metadata : SF Pro Rounded, weight 500, uppercase interdit sauf 1 seul endroit max
- Monospace (BPM, durée, seeds) : SF Mono, weight 400
- **Pas de gradient sur le body text**. Gradient text réservé aux titres h1 et grandes valeurs numériques.

**Spacing** : système 8pt. Padding card minimum `16pt`. Gap `12pt` ou `16pt`. Marges écran `20pt`.

**Border radius** :
- Cards grandes : `20pt`
- Boutons primaires : `14pt`
- Pills / chips : `100pt`
- Inputs : `12pt`

**Ombres** : shadow `#0D0810`. Bouton rose → `shadowColor: '#C4687A'`, `shadowOpacity: 0.35`, `shadowRadius: 16`.

---

## Ce qu'il faut supprimer immédiatement

- ❌ Cercles décoratifs `absolute` + `borderRadius: 50%` en background
- ❌ Gradient radial derrière une card
- ❌ Aurora / mesh gradient (cercles flous superposés)
- ❌ `LinearGradient` violet→rose sur une card entière
- ❌ Glassmorphism sur icônes / cartes de contenu
- ❌ Pulse sur cercles décoratifs
- ❌ Glow rings sur nav ordinaire
- ❌ Texte `opacity: 0.3` « mystérieux »
- ❌ `Animated.loop` sur layout statique
- ❌ Emojis dans les titres de section

---

## Composants à rebuilder (ordre obligatoire)

1. **AppBackground** — void `#1A1220` + grain seul
2. **GenreChip / StyleChip** — inactive/active mauve, press `scale(0.97)` 120ms
3. **SongCard / TrackCard** — cover 64, waveform accent, pas de shadow colorée
4. **PlayerCard** (FullPlayer) — orbe centré, progress 2pt, contrôles minimalistes
5. **MiniPlayer** — blur autorisé ici seulement, orbe 36×36, progress 1pt
6. **GenerateButton** — rose plat `#C4687A`, shadow rose, pas de gradient
7. **TabBar** — blur, SF Symbols, active `#C4AEDE`, pas de labels

Voir `EXECUTION-IOS.md` pour le mapping fichiers → tâches.

---

## Orbe 3D — intégration

Palette orbe = Dusty Cloud :
- colorA (bass) : `#C4687A`
- colorB (mid) : `#8B6FA8`
- colorC (high) : `#C4AEDE`
- Fond orbe : `#1A1220` (seamless avec l'app)

Le brief original prévoit WebView + HTML Three.js bundlé (`assets/orb/index.html`). **Décision projet** : voir `EXECUTION-IOS.md` § Orbe — recolorer `AIOrb` Skia en priorité ; WebView si le rendu Skia ne suffit pas au player plein écran.

---

## Règles de process pour Cursor

1. Lire les fichiers existants avant chaque composant
2. Ne garder un décor background que s'il est fonctionnel en une phrase
3. Test anti-slop : si ça ressemble à un pitch deck IA générique, recommencer
4. Animations : Reanimated uniquement, 80–300ms, pas de loop sauf orbe/loading
5. Couleurs : hex de la palette ci-dessus (tokens `dustyCloud` dans `theme/`)
6. **Ordre** : AppBackground → SongCard → MiniPlayer → PlayerCard → GenerateButton → TabBar

---

## Fichiers de référence

- `app/_layout.tsx` — navigation
- `stores/` — Zustand
- `components/` — inventaire à remplacer
- `theme/ThemeProvider.tsx` — garder le système, mettre à jour les valeurs
- `design-system/EXECUTION-IOS.md` — plan d'exécution et état d'avancement

---

## Livrable attendu

- UI où un designer senior ne devine pas le « AI slop »
- Identité Dusty Cloud reconnaissable sans répétition mécanique
- Seuls les éléments **informatifs** sont colorés (progress, actif, orbe)
- Test : *« Ce décor existerait-il dans Spotify, Apple Music ou Teenage Engineering OP-1 ? »* — sinon, supprimer.
