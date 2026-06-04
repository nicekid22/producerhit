# ProducerHit Samples — AI Sample Lab

## Vision produit (mise à jour marché 2026)

Les beatmakers n’achètent pas surtout des **loops de 8 mesures** — ils achètent des **compositions mélodiques** (~1–2 min) qui sonnent **comme un morceau fini** (intro, couplet, refrain, bridge), **sans drums ni 808**, avec **BPM + key** pour chopper dans le DAW et poser leur beat.

Références : [ProducerGrind](https://producergrind.com/collections/sample-packs) (*composition format*, no drums), [Beatstars Sound Kits](https://www.beatstars.com/explore-sound-kits), [91Vocals RnDrill](https://91vocals.com/products/rnb-vocals-x-soulful-drill), [Komorebi Drill vs RnB](https://komorebiaudio.com/product/drill-sample-pack-vs-rnb/).

Voir aussi : **`docs/SAMPLE_PACK_MARKET_RESEARCH.md`**

> **Positionnement :** *« Générateur IA de compositions sample-ready — morceau fini sans drums, vocaux soul pitchés drill, prêt à chop. »*

## Phase 1b — Livré (pivot composition)

- **3 formats** : `composition` (défaut 60–120 s), `vocal_composition` (RnDrill / soul drill), `mini_loop` (2–16 mesures)
- Prompts : structure **intro → verse → pre-chorus → chorus → bridge**, bloc **NO drums / NO 808**
- Packs : Guitar Drip, **Soul Drill Vocals**, RnB Stack, OVO Sessions, Dark Trap Comp, etc.
- Nom export style marché : `Guitar Drip 92 BPM Amin · 90s`
- UI Sample Lab : sélecteur format + durée

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/lib/sampleLab.ts` | Formats, packs, prompts composition |
| `src/lib/sampleLabGenerate.ts` | Génération 60–120 s |
| `src/pages/SampleLab.tsx` | UI formats |
| `docs/SAMPLE_PACK_MARKET_RESEARCH.md` | Étude marché |

## Phase 2 — Qualité & workflow beatmaker

- Détection drums parasites post-gen (rejouer / prompt renforcé)
- Export WAV + nom fichier `Title 140 BPM Fmin.wav`
- **Stems** par couche (keys, guitar, vocals) si API le permet
- Filtre bibliothèque « Compositions » / « Vocal packs »
- Waveform + marqueurs sections (intro/chorus) — aide au chop

## Phase 3 — Pipeline ACE XL Base

Extract → Lego → Complete pour **stems séparés** sans drums dans le mix source.

## Phase 4 — Packs & Le Flux

- Playlists **Guitar Drip Vol.1**, **Soul Drill Vocals** sur Le Flux
- Bundles téléchargeables (10 compositions + stems)
- Monétisation packs premium

## Phase 5 — MIDI & DAW

- MIDI des progressions d’accords
- Tags BPM/key dans metadata fichier

## Fix drums (2026-03)

Le pipeline ACE **préfixait** chaque instrumental par *« Create a modern beat with contemporary drums »* (`buildAceChatCompletionsParts`). Le Sample Lab envoie maintenant `melodyComposition: true` pour **sauter ce template** (edge + client direct).

Si des drums persistent encore → limite du modèle `text2music` ; phase 2 : post-traitement `extract` (XL Base) pour retirer la piste drums.

## Limites connues

| Sujet | Détail |
|--------|--------|
| ACE peut encore ajouter des drums | Malgré `melodyComposition` — pas garanti à 100 % sans stem extract |
| Max 120 s | Suffisant pour ~1:30–2:00 |
| Vocaux pitchés | Variable selon modèle ; pack `vocal_composition` dédié |

## Feature flag (standby)

**Par défaut masqué** (pas de nav, route `/sample-lab` inactive).

Activer tests internes : `VITE_SAMPLE_LAB=1` dans `.env` + redeploy edge `generate-loop-ace`.

## Negative prompt ACE (playground)

Champs envoyés sur `chat/completions` quand `melodyComposition` :

- `lm_negative_prompt` — drums, kick, 808, percussion…
- `negative_prompt` — alias
- `lm_cfg_scale: 2.8` — CFG > 1 requis pour effet (doc ACE-Step)

Sync : `src/lib/aceMelodyComposition.ts` + edge function.

**Note :** Turbo peut ignorer partiellement le negative ; efficacité variable selon hébergeur.

## Tests prioritaires

1. **Composition** 90 s, Soul Drill Vocals, Drill 140 BPM — pas de kick ?  
2. **Guitar Drip** 90 s Trapsoul — sections audibles ?  
3. Chop dans DAW + drums par-dessus — workflow naturel ?  
4. Comparer à un pack ProducerGrind gratuit (UTOPIA)
