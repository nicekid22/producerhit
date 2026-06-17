export type LandingPendingGeneration = {
  prompt: string;
  mode: "beat" | "song";
};

const STORAGE_KEY = "producerhit_pending_landing";

export function saveLandingPendingGeneration(payload: LandingPendingGeneration) {
  const prompt = payload.prompt.trim();
  if (!prompt) return;
  const mode = payload.mode === "beat" ? "beat" : "song";
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ prompt, mode }));
    window.localStorage.setItem("producerhit_pending_prompt", prompt);
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
      const prompt = typeof parsed.prompt === "string" ? parsed.prompt.trim() : "";
      if (prompt) {
        return { prompt, mode: parsed.mode === "beat" ? "beat" : "song" };
      }
    }
  } catch {
    void 0;
  }

  try {
    const legacy = window.localStorage.getItem("producerhit_pending_prompt")?.trim();
    if (legacy) return { prompt: legacy, mode: "song" };
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
  return `/dashboard?prompt=${encodeURIComponent(pending.prompt)}&mode=${pending.mode}`;
}
