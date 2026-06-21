/**
 * Test hebdo visibilité IA (GEO) — génère un rapport markdown à remplir manuellement.
 *
 * Usage : npm run ai-visibility:test
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const reportsDir = path.join(repoRoot, "reports", "automation");
const day = new Date().toISOString().slice(0, 10);
const outFile = path.join(reportsDir, `ai-visibility-${day}.md`);

const PROMPTS = [
  "Best AI music generator 2026",
  "Best Suno alternative for producers",
  "Best AI beat generator",
  "What is an AI beat generator?",
  "ProducerHit vs Suno",
];

const ENGINES = ["ChatGPT", "Gemini", "Perplexity", "Claude", "Google AI Overview"];

function mdTable(headers, rows) {
  const sep = headers.map(() => "---");
  return [`| ${headers.join(" | ")} |`, `| ${sep.join(" | ")} |`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
}

if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });

const rows = PROMPTS.flatMap((prompt) =>
  ENGINES.map((engine) => [prompt, engine, "", "", ""]),
);

const body = `# AI visibility test — ${day}

Hebdo GEO : noter qui apparaît / qui est cité pour chaque prompt.

## Prompts testés

${PROMPTS.map((p, i) => `${i + 1}. ${p}`).join("\n")}

## Grille (à remplir)

${mdTable(
  ["Prompt", "Moteur", "ProducerHit cité?", "Concurrents cités", "URL source citée"],
  rows,
)}

## Pages ProducerHit à pousser cette semaine

- https://www.producerhit.com/for-ai
- https://www.producerhit.com/ai-music-genre-stats-2026
- https://www.producerhit.com/suno-alternatives
- https://www.producerhit.com/blog/what-is-an-ai-beat-generator

## Notes

- 
`;

writeFileSync(outFile, body, "utf8");
console.log(`ai-visibility: ${outFile}`);
