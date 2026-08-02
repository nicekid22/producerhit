# ACE features probe — 2026-08-01T16:24:59.455Z

Endpoint de base: `https://api.acemusic.ai`  •  Modèle: `acestep-v15-xl-turbo`  •  Prompt: dark trap instrumental 16s
Total tests: 5 (DRY RUN — aucun appel réseau)

| # | Test | Endpoint | Status | Accepté | Latence | Détail |
|---|------|----------|--------|---------|---------|--------|
| 00-baseline | Baseline (control) | `/v1/chat/completions` | dry | — | —ms |  |
| 01-guidance-scale | audio_config.guidance_scale = 7.0 | `/v1/chat/completions` | dry | — | —ms |  |
| 03-infer-method-sde | audio_config.infer_method = 'sde' | `/v1/chat/completions` | dry | — | —ms |  |
| 05-normalization | audio_config.normalization_db + enable_normalization (v1.5) | `/v1/chat/completions` | dry | — | —ms |  |
| 11-auto-lrc | auto_lrc = true (top-level) | `/v1/chat/completions` | dry | — | —ms |  |

## Lecture du rapport
- **✅** : serveur atteint, audio renvoyé → feature acceptée et exploitable
- **⚠️ 200 no-audio** : serveur 200 mais aucune audio dans `message.audio` → feature probablement ignorée
- **❌** : 400/422 → message d'erreur souvent explicite sur les champs rejetés
- **∉ endpoint** : 404 → l'endpoint distant n'expose pas cette route (e.g. release_task)

Voir aussi `ace-features-probe-results.jsonl` (1 ligne brute par test).