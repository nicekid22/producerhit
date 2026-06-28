# VIRAL Content OS

Mission unifiée OpenClaw + Hermes + Odysseus : **contenu viral → trafic ProducerHit**, budget **$0**.

## Install

```powershell
powershell -ExecutionPolicy Bypass -File "scripts/viral/install-viral-os.ps1"
powershell -ExecutionPolicy Bypass -File "scripts/launch-all-agents-windows.ps1"
```

## Agents (×3 plateformes, même brief)

| Rôle | OpenClaw | Hermes skill | Odysseus |
|------|----------|--------------|----------|
| Strategist | ph-viral-strategist | ph-viral-strategist | viral-strategist-ody |
| Hooks | ph-viral-hooks | ph-viral-hooks | viral-hooks-ody |
| Render | ph-viral-render | ph-viral-render | viral-render-ody |
| Publish | ph-viral-publish | ph-viral-publish | viral-publish-ody |

## Crons

| Job | Schedule |
|-----|----------|
| Strategist | 08:30 daily |
| Hooks | every 2h |
| Render | every 4h |
| Publish | every 6h |

## Pipeline manuel

```powershell
npm run viral:agent -- status
npm run viral:agent -- pipeline
npm run viral:agent -- publish
```

Voir `NEEDS.md` pour TikTok OAuth et Reels navigateur.
