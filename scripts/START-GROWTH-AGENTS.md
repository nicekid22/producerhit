# Demarrer OpenClaw + Hermes — guide pas a pas (Windows)

Tu as besoin de **fenetres PowerShell separees** qui restent ouvertes.
Chaque fenetre = un service qui tourne en arriere-plan.

---

## PARTIE A — OpenClaw (crons marketing ph-*)

### Pourquoi "pairing required" ?

OpenClaw protege ton PC : la 1ere fois que le CLI veut creer des crons (actions admin),
il doit etre **approuve comme appareil de confiance**. C'est normal, une seule fois.

### Etape 1 — Ollama (si pas deja lance)

**Fenetre PowerShell #1** — laisse ouverte :

```powershell
ollama serve
```

### Etape 2 — Gateway OpenClaw

**Fenetre PowerShell #2** — laisse ouverte (ne ferme pas !) :

```powershell
openclaw gateway --force
```

Attends le message : `[gateway] ready`

### Etape 3 — Approuver ton PC (pairing)

**Fenetre PowerShell #3** — commandes one-shot :

```powershell
# Voir la demande en attente
openclaw devices list

# Apercu de la demande la plus recente (affiche la commande exacte)
openclaw devices approve --latest
```

La commande `--latest` affiche quelque chose comme :
`openclaw devices approve abc123-def456...`

**Recopie et execute** la commande avec l'ID affiche :

```powershell
openclaw devices approve PASTE_REQUEST_ID_HERE
```

**Alternative visuelle** — ouvre le dashboard dans le navigateur :

```powershell
openclaw dashboard
```

Dans la page web, cherche **Devices** / **Pairing** et clique **Approve**.

### Etape 4 — Enregistrer les crons ProducerHit

Toujours fenetre #3 (gateway #2 toujours ouvert) :

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2\scripts\openclaw\register-cron-jobs.ps1"
```

### Verifier

```powershell
openclaw cron list
openclaw health
```

Si tu vois 6 jobs "PH *" → OK.

---

## PARTIE B — Hermes (machine de croissance)

Hermes n'a **pas** le meme pairing OpenClaw. Plus simple.

### Etape 1 — Ollama

Meme fenetre #1 que ci-dessus (`ollama serve`).

### Etape 2 — Gateway Hermes

**Fenetre PowerShell #4** — laisse ouverte :

```powershell
$env:HERMES_HOME = "$env:LOCALAPPDATA\hermes"
& "$env:LOCALAPPDATA\hermes\hermes-agent\.venv\Scripts\hermes.exe" gateway run
```

(Premiere fois : `hermes gateway setup` pour Discord si besoin.)

### Etape 3 — Crons Hermes

**Fenetre PowerShell #5** :

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2\scripts\hermes\register-cron-jobs.ps1"
```

### Verifier

```powershell
& "$env:LOCALAPPDATA\hermes\hermes-agent\.venv\Scripts\hermes.exe" cron list
```

---

## PARTIE D — VIRAL Content OS (Shorts / TikTok / trafic)

Install une fois :

```powershell
powershell -ExecutionPolicy Bypass -File "scripts/viral/install-viral-os.ps1"
```

4 agents × 3 plateformes (OpenClaw `ph-viral-*`, Hermes `ph-viral-*`, Odysseus `viral-*-ody`).

Test pipeline :

```powershell
npm run viral:agent -- status
npm run viral:agent -- pipeline
```

Voir `scripts/viral/NEEDS.md` pour TikTok OAuth et profils navigateur Reels.

---

```
[Fenetre 1]  ollama serve          ← toujours ouvert
[Fenetre 2]  openclaw gateway      ← toujours ouvert (OpenClaw)
[Fenetre 3]  commands (pairing + cron register)  ← tu travailles ici
[Fenetre 4]  hermes gateway run    ← toujours ouvert (Hermes)
[Fenetre 5]  hermes cron register  ← one-shot
```

---

## Erreurs frequentes

| Message | Solution |
|---------|----------|
| `gateway closed` / `1006` | Fenetre #2 pas ouverte → relance `openclaw gateway --force` |
| `pairing required` | Etape 3 OpenClaw pas faite → `devices approve` |
| `Gateway is not running` (Hermes) | Fenetre #4 pas ouverte → `hermes gateway run` |
| OpenClaw tres lent | Normal au 1er lancement (~2-4 min) |

---

## Test manuel rapide (sans cron)

OpenClaw :

```powershell
openclaw agent --agent ph-research --message "Execute tasks/research-hourly.md"
```

Hermes :

```powershell
& "$env:LOCALAPPDATA\hermes\hermes-agent\.venv\Scripts\hermes.exe" chat --workdir "$env:LOCALAPPDATA\hermes\projects\producerhit"
```

Rapports OpenClaw : `%USERPROFILE%\.openclaw\workspace-producerhit\reports\daily\`
Rapports Hermes : `%LOCALAPPDATA%\hermes\projects\producerhit\reports\daily\`

---

## PARTIE C — Apex Revenue OS (Team 3 — le plus agressif)

Mission : maximiser revenus / profit / valeur — pas limite a ProducerHit.
North Star : **Weekly Net Revenue Growth** | Cible : **100k MRR → 1M MRR**

### Install one-shot

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2\scripts\apex\install-apex-revenue-os.ps1"
```

### Crons (gateways ouverts)

```powershell
powershell -File "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2\scripts\apex\register-cron-jobs.ps1"
powershell -File "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2\scripts\apex\register-hermes-crons.ps1"
```

### Agents (8)

`apex-ceo`, `apex-scout`, `apex-validator`, `apex-sales`, `apex-growth`, `apex-distribution`, `apex-analyst`, `apex-automation`

### Cadence (plus rapide que ph-*)

| Job | Frequence |
|-----|-----------|
| Scout | toutes les 30 min |
| Sales | hourly |
| Validator | 2h |
| Growth | 4h |
| CEO | 08:30 daily + dimanche weekly |

Workspace OpenClaw : `%USERPROFILE%\.openclaw\workspace-apex\`
Hermes : `%LOCALAPPDATA%\hermes\projects\apex-revenue\`

Doc : `scripts/apex/README.md`

---

## PARTIE D — TITAN Revenue Command (Team 4 — Odysseus, le plus autonome)

Plateforme : [Odysseus](https://pewdiepie-archdaemon.github.io/odysseus/) — workspace AI self-hosted avec agents, skills evolutifs, recherche web, taches planifiees.

### Install

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2\scripts\odysseus\install-titan-revenue.ps1"
```

Puis lancer le serveur :

```powershell
cd C:\Users\dylar\odysseus
powershell -ExecutionPolicy Bypass -File .\launch-windows.ps1
```

UI : http://127.0.0.1:7000 — login `admin` / `TitanRev2026!` (a changer)

### 9 agents TITAN

Radar (15 min), Proof, Closer, Scale, Quant, Capital, Amplify, Engine, Architect (CEO)

Rapports : Documents `titan-revenue/` dans Odysseus

Doc : `scripts/odysseus/README.md`

---

## PARTIE E — INFLU Influencer Marketing (Team 5)

Mission : contacter beatmakers, chanteurs, micro-influenceurs — partnership ProducerHit sans budget cash (Pro/Studio + lien parrainage).

### Install

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\dylar\Documents\ProducerKit AI - Cursor 2\scripts\influ\install-influ-marketing.ps1"
```

### Agents (7 + Odysseus 5 tasks)

Scout, Enrich, Pitch, Outreach, Followup, Learn, CEO — **autonomes** (emails, CRM, learnings)

Workspace OpenClaw : `%USERPROFILE%\.openclaw\workspace-influ\`
Hermes : `%LOCALAPPDATA%\hermes\projects\influencer-marketing\`
Odysseus : Documents `influencer-marketing/`

**Email autonome** : Odysseus → Email → Add account (obligatoire pour envoi auto)

Doc : `scripts/influ/README.md`


