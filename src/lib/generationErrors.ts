/** Messages utilisateur pour erreurs de génération (ACE / Edge / réseau). */

export function normalizeGenerationRawError(raw: string): string {
  let msg = (raw || "").trim();
  const songPrefix = /^song generation failed:\s*/i;
  if (songPrefix.test(msg)) msg = msg.replace(songPrefix, "").trim();
  return msg;
}

export function formatGenerationErrorMessage(raw: string, locale: "en" | "fr"): string {
  const msg = normalizeGenerationRawError(raw);
  if (!msg) return locale === "fr" ? "Génération échouée — réessaie" : "Generation failed — try again";

  const lower = msg.toLowerCase();

  if (lower.includes("limit reached") || lower.includes("monthly limit") || lower.includes("limite mensuelle")) {
    return locale === "fr" ? "Limite mensuelle atteinte" : "Monthly limit reached";
  }

  if (
    lower.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("rate limit")
  ) {
    return locale === "fr"
      ? "API ACE saturée — réessaie dans 30–60 s (ou 1 version à la fois)"
      : "ACE API busy — retry in 30–60s (or try 1 version)";
  }

  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("504") ||
    lower.includes("546")
  ) {
    return locale === "fr" ? "Génération trop longue (timeout) — réessaie" : "Generation timed out — try again";
  }

  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("load failed")) {
    return locale === "fr"
      ? "Connexion interrompue (souvent génération trop longue) — réessaie ou 1 version"
      : "Connection dropped (often long generation) — retry or try 1 version";
  }

  if (lower.includes("cors") || lower.includes("502") || lower.includes("503")) {
    return locale === "fr"
      ? "Serveur ACE ou proxy indisponible — réessaie"
      : "ACE or proxy unavailable — try again";
  }

  if (lower.includes("ace api") || lower.includes("chat/completions") || lower.includes("acemusic")) {
    return locale === "fr"
      ? "Erreur côté ACE Music — réessaie (souvent temporaire)"
      : "ACE Music API error — retry (often temporary)";
  }

  if (lower.includes("no audio") || lower.includes("audio manquant") || lower.includes("missing audio")) {
    return locale === "fr" ? "ACE n'a pas renvoyé d'audio — réessaie" : "ACE returned no audio — try again";
  }

  return msg.length > 220 ? `${msg.slice(0, 220)}…` : msg;
}

export function isRetryableGenerationError(raw: string): boolean {
  const lower = normalizeGenerationRawError(raw).toLowerCase();
  return (
    lower.includes("too many requests") ||
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("504") ||
    lower.includes("546") ||
    lower.includes("cors") ||
    lower.includes("non-2xx")
  );
}

/** Backoff between retries in startOne (ACE 429 needs longer than generic network). */
export function generationRetryDelayMs(raw: string, attemptIndex: number): number {
  const lower = normalizeGenerationRawError(raw).toLowerCase();
  if (lower.includes("429") || lower.includes("too many requests") || lower.includes("rate limit")) {
    return 2800 + attemptIndex * 3200;
  }
  return 1600 + attemptIndex * 800;
}
