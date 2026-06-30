/**
 * Music Prompt Engine — ProducerHit
 * Stack 2026 : OpenRouter (hub central) + BYOK multi-provider + Fallback local
 *
 * STRATÉGIE :
 * Une seule clé OpenRouter + tes clés gratuites en BYOK = ~1M+ req/mois gratuits
 *
 * Pipeline :
 *   1. OpenRouter :free   → 26+ modèles gratuits, auto-routing (meta-llama/llama-3.3-70b-instruct:free etc.)
 *   2. OpenRouter BYOK    → Cerebras / Groq / Gemini via ta clé OR (1M req/mois gratuits)
 *   3. Cerebras direct    → 1M tokens/jour, 2600 t/s
 *   4. Groq direct        → 14,400 req/jour
 *   5. Gemini direct      → 1,500 req/jour, 1M context
 *   6. Fallback local     → 100% offline, zéro API, zéro latence
 *
 * CLÉS À CONFIGURER (.env) :
 *   VITE_OPENROUTER_API_KEY=sk-or-...   → openrouter.ai (email seulement, gratuit)
 *   VITE_CEREBRAS_API_KEY=              → cloud.cerebras.ai (email seulement)
 *   VITE_GROQ_API_KEY=                  → console.groq.com (email seulement)
 *   VITE_GEMINI_API_KEY=                → aistudio.google.com (compte Google)
 *
 * BYOK OPENROUTER (optionnel mais recommandé) :
 *   → Va sur openrouter.ai/settings/integrations
 *   → Ajoute tes clés Cerebras / Groq / Gemini
 *   → 1M requêtes/mois gratuites via le routeur OpenRouter
 */

import { buildFallbackPrompt } from './musicPromptFallback';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AceStepPrompt {
  caption: string;
  lyrics: string;
  bpm: number;
  key: string;
  duration: number;
  language: string;
  _provider?: string;
}

export interface EngineOptions {
  duration?: number;
  language?: string;
  debug?: boolean;
}

// ─── System Prompt ACE-Step ───────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are MusicPromptEngine, an expert AI music director and lyricist for ProducerHit.
Transform the user's rough music idea into a perfectly structured prompt for ACE-Step 1.5 XL.

RESPOND ONLY WITH A VALID JSON OBJECT. No markdown. No backticks. No extra text.

{
  "caption": "...",
  "lyrics": "...",
  "bpm": 95,
  "key": "F Minor",
  "duration": 180,
  "language": "French"
}

CAPTION RULES:
- Dense comma-separated descriptive tags (NOT sentences)
- Include: genre, sub-genre, mood, energy level, vocal type, main instruments, production style, mix quality, era/vibe
- 80 to 160 words minimum
- Never include artist names or song titles

LYRICS RULES:
- Full song with section labels: [Intro] [Verse 1] [Pre-Chorus] [Chorus] [Verse 2] [Bridge] [Outro]
- Authentic to the genre (slang, flow, rhyme scheme, cadence)
- Write in the detected or specified language
- 4 to 8 lines per section, emotionally resonant

BPM BY GENRE:
Trap:135-145 | Hip-Hop:85-100 | R&B:70-90 | Pop:100-120 | EDM:126-132
Lo-fi:70-85 | Rock:120-160 | Afrobeats:95-110 | Jazz:120-180 | Drill:140-150

KEY: Minor for dark/emotional, Major for uplifting. Pick the most fitting for the theme.

GENRE ENRICHMENT:
- Hip-Hop/Trap: 808 bass, trap hi-hats, adlibs, punchy kick, melodic hooks, radio-ready
- Pop: polished topline, vocal harmonies, bright synth pads, catchy chorus, mainstream appeal
- R&B/Soul: smooth groove, warm bass, soulful chords, falsetto, neo-soul textures
- EDM: drop, build-up, riser, sidechain compression, supersaw synths, festival energy
- Lo-fi: vinyl crackle, soft piano, tape saturation, rain ambiance, nostalgic mood
- Rock: electric guitar riff, distortion, live drums, raw energy, anthemic
- Afrobeats: percussive groove, talking drum, steel pan, tropical rhythm, celebratory`;

// ─── Providers Config ─────────────────────────────────────────────────────────

interface ProviderConfig {
  name: string;
  baseUrl: string;
  model: string;
  apiKeyEnv: string;
  /** Headers supplémentaires (ex: OpenRouter nécessite HTTP-Referer) */
  extraHeaders?: Record<string, string>;
}

// OpenRouter free models (IDs se terminent par :free)
// Liste complète : https://openrouter.ai/models?q=:free
const OPENROUTER_FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',    // Très bon, 128K ctx
  'deepseek/deepseek-r1:free',                   // Excellent raisonnement
  'deepseek/deepseek-v3:free',                   // Fort en génération créative
  'qwen/qwen3-235b-a22b:free',                   // Puissant, multilingue
  'google/gemma-3-27b-it:free',                  // Solide, rapide
  'mistralai/mistral-small-3.2-24b-instruct:free', // Bon équilibre perf/vitesse
  'openrouter/auto',                             // Auto-routing vers le meilleur gratuit dispo
];

const PROVIDERS: ProviderConfig[] = [
  // ── 1. OpenRouter :free (26+ modèles gratuits, auto-routing) ─────────────
  {
    name: 'OpenRouter:free',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: OPENROUTER_FREE_MODELS[0], // commence par llama-3.3-70b:free
    apiKeyEnv: 'VITE_OPENROUTER_API_KEY',
    extraHeaders: {
      'HTTP-Referer': 'https://producerhit.com',
      'X-Title': 'ProducerHit Music Prompt Engine',
    },
  },
  // ── 2. OpenRouter auto (fallback vers le meilleur modèle gratuit dispo) ──
  {
    name: 'OpenRouter:auto',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openrouter/auto',
    apiKeyEnv: 'VITE_OPENROUTER_API_KEY',
    extraHeaders: {
      'HTTP-Referer': 'https://producerhit.com',
      'X-Title': 'ProducerHit Music Prompt Engine',
    },
  },
  // ── 3. Cerebras direct (1M tokens/jour, 2600 t/s, OpenAI-compatible) ─────
  {
    name: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    model: 'llama-4-scout',
    apiKeyEnv: 'VITE_CEREBRAS_API_KEY',
  },
  // ── 4. Groq direct (14,400 req/jour, ultra-rapide) ───────────────────────
  {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    apiKeyEnv: 'VITE_GROQ_API_KEY',
  },
  // ── 5. Gemini direct (1,500 req/jour, 1M context) ────────────────────────
  {
    name: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    apiKeyEnv: 'VITE_GEMINI_API_KEY',
  },
];

// ─── Appel API générique OpenAI-compatible ────────────────────────────────────

async function callProvider(
  provider: ProviderConfig,
  userMessage: string,
  debug: boolean
): Promise<string> {
  const apiKey = (import.meta.env[provider.apiKeyEnv] ?? '').trim();
  if (!apiKey) throw new Error(`No key for ${provider.apiKeyEnv}`);

  if (debug) console.log(`[MPE] → ${provider.name} (${provider.model})`);

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(provider.extraHeaders ?? {}),
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 1500,
      temperature: 0.82,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  if (!content) throw new Error('Empty response from provider');
  return content;
}

// ─── Parsing JSON robuste ─────────────────────────────────────────────────────

function parseJson(raw: string): AceStepPrompt {
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Extraction si le LLM a mis du texte avant/après le JSON
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* continue */ }
    }
    throw new Error(`JSON parse failed. Raw: ${raw.slice(0, 300)}`);
  }
}

// ─── buildAceStepPrompt — export principal ────────────────────────────────────

export async function buildAceStepPrompt(
  userIdea: string,
  options: EngineOptions = {}
): Promise<AceStepPrompt> {
  const { duration = 180, language, debug = false } = options;

  const userMessage = `Music idea: "${userIdea}"
Duration: ${duration} seconds
${language ? `Forced language: ${language}` : 'Auto-detect language from user idea.'}
Generate the ACE-Step prompt now.`;

  const errors: string[] = [];

  // ── Tentatives API dans l'ordre de priorité ───────────────────────────────
  for (const provider of PROVIDERS) {
    const apiKey = (import.meta.env[provider.apiKeyEnv] ?? '').trim();
    if (!apiKey) {
      if (debug) console.log(`[MPE] Skip ${provider.name}: no key`);
      continue;
    }

    try {
      const raw = await callProvider(provider, userMessage, debug);
      const parsed = parseJson(raw);
      parsed.duration = duration;
      parsed._provider = provider.name;
      if (debug) console.log(`[MPE] ✅ ${provider.name}`, parsed);
      return parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${provider.name}: ${msg}`);
      if (debug) console.warn(`[MPE] ❌ ${provider.name}:`, msg);
    }
  }

  // ── Fallback local (toujours disponible, zéro API) ────────────────────────
  if (debug) console.warn('[MPE] All APIs failed → local fallback', errors);

  const fallback = buildFallbackPrompt(userIdea, duration);
  if (language) fallback.language = language;
  return fallback;
}

// ─── Rotation des modèles OpenRouter (évite les rate limits) ─────────────────

/**
 * Version avancée : tourne sur tous les modèles OpenRouter :free
 * avant de passer aux autres providers.
 * Utile si tu veux maximiser les quotas gratuits d'OpenRouter.
 */
export async function buildAceStepPromptWithRotation(
  userIdea: string,
  options: EngineOptions = {}
): Promise<AceStepPrompt> {
  const { duration = 180, language, debug = false } = options;

  const apiKey = (import.meta.env['VITE_OPENROUTER_API_KEY'] ?? '').trim();
  const errors: string[] = [];

  const userMessage = `Music idea: "${userIdea}"
Duration: ${duration} seconds
${language ? `Forced language: ${language}` : 'Auto-detect language.'}
Generate the ACE-Step prompt now.`;

  // Essaie tous les modèles OpenRouter :free en rotation
  if (apiKey) {
    for (const model of OPENROUTER_FREE_MODELS) {
      try {
        const provider: ProviderConfig = {
          name: `OpenRouter(${model.split('/').pop()})`,
          baseUrl: 'https://openrouter.ai/api/v1',
          model,
          apiKeyEnv: 'VITE_OPENROUTER_API_KEY',
          extraHeaders: {
            'HTTP-Referer': 'https://producerhit.com',
            'X-Title': 'ProducerHit Music Prompt Engine',
          },
        };
        const raw = await callProvider(provider, userMessage, debug);
        const parsed = parseJson(raw);
        parsed.duration = duration;
        parsed._provider = provider.name;
        if (debug) console.log(`[MPE] ✅ ${provider.name}`);
        return parsed;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`OR(${model}): ${msg}`);
        if (debug) console.warn(`[MPE] ❌ OR(${model}):`, msg);
      }
    }
  }

  // Puis les autres providers directs
  return buildAceStepPrompt(userIdea, options);
}

// ─── Helper payload ACE-Step ──────────────────────────────────────────────────

export function toAceStepPayload(prompt: AceStepPrompt): Record<string, unknown> {
  return {
    tags: prompt.caption,
    lyrics: prompt.lyrics,
    duration: prompt.duration,
    bpm: prompt.bpm,
    key: prompt.key,
  };
}

// ─── Export liste des modèles OR gratuits (utile pour debug/UI) ──────────────
export { OPENROUTER_FREE_MODELS };
