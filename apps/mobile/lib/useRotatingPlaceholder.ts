import { useEffect, useMemo, useRef, useState } from "react";
import type { PromptMode } from "@producerhit/shared";
import { getRotatingPlaceholderPool, pickNextPoolIndex } from "@producerhit/shared";
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

  const pool = useMemo(() => getRotatingPlaceholderPool(promptLocale, mode), [promptLocale, mode]);
  const poolRef = useRef(pool);
  poolRef.current = pool;

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(pool.length > 1 ? Math.floor(Math.random() * pool.length) : 0);
  }, [promptLocale, mode, pool.length]);

  useEffect(() => {
    if (paused || pool.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => pickNextPoolIndex(poolRef.current, i));
    }, 6000);
    return () => clearInterval(id);
  }, [paused, pool.length, promptLocale, mode]);

  return pool[index] ?? pool[0] ?? "";
}
