import { useEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import {
  pickNextHeroPromptIndex,
  prepareRotatingPromptPlaceholders,
  type PromptMode,
} from "@/lib/randomPromptIdeas";
import { resolveRandomPromptLocale } from "@/lib/resolveRandomPromptLocale";

const DEFAULT_CYCLE_MS = 2300;

type Options = {
  uiLocale: AppLocale;
  mode: PromptMode;
  value: string;
  promptLocale?: AppLocale;
  paused?: boolean;
  cycleMs?: number;
  fallback?: string;
  /** Texte actuellement affiché comme placeholder (génération si champ vide). */
  onActivePlaceholder?: (text: string) => void;
};

function resolvePlaceholderLocale(uiLocale: AppLocale, mode: PromptMode, promptLocale?: AppLocale): AppLocale {
  if (promptLocale) return promptLocale;
  if (mode === "beat") {
    return resolveRandomPromptLocale({ surface: "dashboard-beat", uiLocale });
  }
  return resolveRandomPromptLocale({
    surface: "dashboard-song",
    uiLocale,
    vocalLanguageMode: "auto",
    manualVocalLanguage: "en",
  });
}

export function useRotatingPromptPlaceholder({
  uiLocale,
  mode,
  value,
  promptLocale,
  paused = false,
  cycleMs = DEFAULT_CYCLE_MS,
  fallback = "",
  onActivePlaceholder,
}: Options): string {
  const resolvedLocale = resolvePlaceholderLocale(uiLocale, mode, promptLocale);

  const prepared = useMemo(
    () => prepareRotatingPromptPlaceholders(resolvedLocale, mode),
    [resolvedLocale, mode],
  );

  const [index, setIndex] = useState(prepared.startIndex);

  useEffect(() => {
    setIndex(prepared.startIndex);
  }, [prepared.pool, prepared.startIndex]);

  useEffect(() => {
    if (paused) return;
    if (value.trim().length > 0) return;
    if (prepared.pool.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => pickNextHeroPromptIndex(prepared.pool, current));
    }, cycleMs);

    return () => window.clearInterval(timer);
  }, [paused, value, prepared.pool, cycleMs]);

  const active = prepared.pool[index] ?? prepared.pool[0] ?? fallback;

  useEffect(() => {
    onActivePlaceholder?.(active);
  }, [active, onActivePlaceholder]);

  return active;
}
