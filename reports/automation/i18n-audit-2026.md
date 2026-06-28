# Audit i18n — ProducerHit (2026-06-17)

## Langues UI (14)

| Code | Langue | Nav/SEO/Landing | Blog/CRO/Footer | RTL | Notes |
|------|--------|-----------------|-----------------|-----|-------|
| en | English | ✅ | ✅ | — | Référence |
| fr | Français | ✅ | ✅ | — | Slugs SEO FR (`localizedPath`) |
| es | Español | ✅ | ✅ | — | Suffixe prix `/mes` |
| pt | Português | ✅ | ✅ | — | |
| de | Deutsch | ✅ | ✅ | — | Suffixe prix `/Mon.` |
| it | Italiano | ✅ | ✅ | — | |
| nl | Nederlands | ✅ | ✅ | — | **Nouveau** |
| ar | العربية | ✅ | ✅ | ✅ | **Nouveau** — `dir=rtl` |
| ja | 日本語 | ✅ | ✅ | — | |
| ko | 한국어 | ✅ | ✅ | — | |
| tr | Türkçe | ✅ | ✅ | — | **Nouveau** |
| hi | हिन्दी | ✅ | ✅ | — | **Nouveau** |
| zh | 中文 | ✅ | ✅ | — | |
| th | ไทย | ✅ | ✅ | — | |

## Architecture

- **`src/i18n/locales/*.ts`** — nav, seo, landing, app (par locale)
- **`src/i18n/extraCatalog.ts`** — common, blog, cro, footer (14 langues via helper `L()`)
- **`src/i18n/format.ts`** — dates, nombres, prix (`/mo`, `/mes`, `/月`…), temps de lecture
- **`src/i18n/resolve.ts`** — `pickLocalized()` avec repli EN
- **`getMessages(locale)`** — fusion base + extra

## Pages branchées sur i18n

- Blog (liste, article, filtres, pagination, auteur)
- NotFound
- LandingFooter
- CRO (trust bar, auth, pricing hero/teaser, sticky CTA, FAQ)
- planPriceLabel / suffixes localisés

## Encore EN/FR ou EN seulement (hors scope marketing)

- **Dashboard** (~100 `isFr`) — studio producteur, contenu dense
- **landingContent.ts** — témoignages, piliers benefits (EN + FR via `legacyEnFr`)
- **Articles blog** — contenu rédactionnel EN (SEO international)
- **Catégories blog labels** — FR + EN ; autres locales → EN
- **Auteurs blog bio/rôle** — FR + EN ; autres → EN

## SEO

- `index.html` — hreflang + og:locale:alternate pour les 14 langues
- `SeoBootstrap` — hreflang dynamique via `UI_LOCALES`

## Vérification

```bash
npm run check
```

## Prochaines étapes (optionnel)

1. Traduire `landingContent.ts` pour ES/DE/… ou externaliser en JSON
2. Dashboard : migration progressive `useT()` / clés `app.*` étendues
3. Contenu blog multilingue (slugs ou champs `titleFr`, etc.)
