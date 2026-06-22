import { useEffect, useMemo, useState } from "react";
import type { PromptMode } from "@producerhit/shared";
import { getDisplayPromptPool } from "@producerhit/shared";
import type { AppLocale } from "@/lib/i18n/catalog";
import { resolveMobilePromptLocale, type VocalLanguageMode } from "@/lib/resolvePromptLocale";

type Options = {
  uiLocale: AppLocale;
  mode: PromptMode;
  paused: boolean;
  vocalLanguageMode?: VocalLanguageMode;
  manualVocalLanguage?: string;
};

export function useRotatingPlaceholder({
  uiLocale,
  mode,
  paused,
  vocalLanguageMode = "auto",
  manualVocalLanguage = "en",
}: Options): string {
  const promptLocale = useMemo(
    () =>
      resolveMobilePromptLocale({
        uiLocale,
        mode,
        vocalLanguageMode,
        manualVocalLanguage,
      }),
    [uiLocale, mode, vocalLanguageMode, manualVocalLanguage],
  );

  const pool = useMemo(() => getDisplayPromptPool(promptLocale, mode), [promptLocale, mode]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(pool.length > 1 ? Math.floor(Math.random() * pool.length) : 0);
  }, [promptLocale, mode, pool]);

  useEffect(() => {
    if (paused || pool.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % pool.length);
    }, 6000);
    return () => clearInterval(id);
  }, [paused, pool]);

  return pool[index] ?? pool[0] ?? "";
}
