export type LandingGenreStrategy = "from_idea" | "random";

export type LandingPendingGeneration = {
  prompt: string;
  mode: "beat" | "song";
  /** Prompt ACE technique (dé landing) — invisible pour l'utilisateur. */
  acePrompt?: string;
  /** Déduit du prompt si absent : rempli → depuis l'idée, vide → aléatoire. */
  genreStrategy?: LandingGenreStrategy;
};

const STORAGE_KEY = "producerhit_pending_landing";

export function landingGenreStrategyFromPrompt(prompt: string): LandingGenreStrategy {
  return prompt.trim() ? "from_idea" : "random";
}

export function normalizeLandingPendingGeneration(
  raw: Partial<LandingPendingGeneration> | null | undefined,
): LandingPendingGeneration | null {
  if (!raw) return null;
  const prompt = typeof raw.prompt === "string" ? raw.prompt.trim() : "";
  const acePrompt = typeof raw.acePrompt === "string" ? raw.acePrompt.trim() : "";
  const mode = raw.mode === "beat" ? "beat" : "song";
  const genreStrategy = raw.genreStrategy === "random" || raw.genreStrategy === "from_idea"
    ? raw.genreStrategy
    : landingGenreStrategyFromPrompt(prompt);
  if (!prompt && genreStrategy !== "random") return null;
  return { prompt, mode, genreStrategy, ...(acePrompt ? { acePrompt } : {}) };
}

export function saveLandingPendingGeneration(payload: LandingPendingGeneration) {
  const normalized = normalizeLandingPendingGeneration(payload);
  if (!normalized) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    if (normalized.prompt) {
      window.localStorage.setItem("producerhit_pending_prompt", normalized.prompt);
    } else {
      window.localStorage.removeItem("producerhit_pending_prompt");
    }
    window.localStorage.setItem("producerhit_pending_source", "landing");
    window.sessionStorage.removeItem("producerhit_landing_autogen_done");
    window.sessionStorage.removeItem("producerhit_landing_autogen_key");
  } catch {
    void 0;
  }
  void import("@/pages/Dashboard");
}

export function readLandingPendingGeneration(): LandingPendingGeneration | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LandingPendingGeneration>;
      const normalized = normalizeLandingPendingGeneration(parsed);
      if (normalized) return normalized;
    }
  } catch {
    void 0;
  }

  try {
    const legacy = window.localStorage.getItem("producerhit_pending_prompt")?.trim();
    if (legacy) {
      return { prompt: legacy, mode: "song", genreStrategy: "from_idea" };
    }
  } catch {
    void 0;
  }

  return null;
}

export function clearLandingPendingGeneration() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem("producerhit_pending_prompt");
  } catch {
    void 0;
  }
}

export function buildDashboardUrlFromLandingPending(): string | null {
  const pending = readLandingPendingGeneration();
  if (!pending) return null;
  if (pending.prompt) {
    return `/dashboard?prompt=${encodeURIComponent(pending.prompt)}&mode=${pending.mode}`;
  }
  return `/dashboard?mode=${pending.mode}`;
}
