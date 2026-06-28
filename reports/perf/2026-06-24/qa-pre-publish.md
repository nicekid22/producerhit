# QA pré-publication — performance web (2026-06-24)

Checklist binaire avant release :

- [ ] Cold load `/` : pas de FOUC thème, hero LCP stable
- [ ] Login → `/library` : scroll 30 s sans long task > 200 ms (Chrome Performance)
- [ ] Lecture 3 morceaux : pas de fuite mémoire audio/canvas après 2 navigations
- [ ] Wizard distribution + regen cover : image change, UI fluide
- [ ] iPhone Safari ou Chrome Android : scroll library acceptable
- [ ] `prefers-reduced-motion: reduce` : animations réduites
- [ ] Console : 0 erreurs sur parcours standard
- [ ] Lighthouse mobile ≥ 90 sur `/` et `/library` (`npm run perf:lighthouse`)

Commandes :

```bash
npm run build
npm run perf:bundle
npx vite preview --port 4173
npm run perf:lighthouse
npm run test:e2e:public
```
