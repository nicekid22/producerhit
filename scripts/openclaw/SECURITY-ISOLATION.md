# OpenClaw + Hermes — Isolation des donnees sensibles (ProducerHit)

## Principe

Les agents marketing **ne doivent jamais** lire :
- `.env`, Supabase, Stripe, OAuth YouTube, tokens gateway
- Le repo complet (edge functions, migrations, secrets CI)

## OpenClaw (implemente)

| Mesure | Fichier |
|--------|---------|
| Policy + deny paths | `workspace-producerhit/SECURITY.md`, `POLICY.md` |
| Contexte sanitise | `workspace-producerhit/public-context/product.md` |
| Sandbox par agent | `openclaw.json` → `sandbox.mode: all`, workspace isole |
| Tools deny | exec, browser, gateway, cron, apply_patch |
| ph-dev read-only | workspaceAccess ro, allow read only |
| FS workspace only | `tools.fs.workspaceOnly: true` |
| Exec global deny | `tools.exec.security: deny` |

## Hermes (implemente)

| Mesure | Emplacement |
|--------|-------------|
| Project jail | `%LOCALAPPDATA%\hermes\projects\producerhit\` |
| SECURITY.md | interdit repo + secrets |
| terminal.cwd | fixe sur project dir dans config.yaml |
| Skills isoles | `%LOCALAPPDATA%\hermes\skills\ph-*` |

## Sync contexte public

OpenClaw lit `public-context/` — Hermes lit `projects/producerhit/*.md`.
Ne pas dupliquer de secrets dans ces fichiers.

## Validation

```powershell
openclaw security audit
& "$env:LOCALAPPDATA\hermes\hermes-agent\.venv\Scripts\hermes.exe" doctor
```
