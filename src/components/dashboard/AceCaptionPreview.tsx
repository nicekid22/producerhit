import { useEffect, useMemo, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import { buildDashboardSection } from "@/i18n/dashboardCatalog";
import { resolveGenerationCaptionContext } from "@/lib/promptEnhancer";

const STORAGE_KEY = "pk.showAcePreview";

type Props = {
  locale: AppLocale;
  displayIdea: string;
  formGenre: string;
  mode: "beat" | "song";
  diceAceOverride?: string | null;
};

function readPreviewEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AceCaptionPreview({
  locale,
  displayIdea,
  formGenre,
  mode,
  diceAceOverride,
}: Props) {
  const d = buildDashboardSection(locale);
  const [enabled, setEnabled] = useState(readPreviewEnabled);
  const [open, setOpen] = useState(false);
  const [debouncedIdea, setDebouncedIdea] = useState(displayIdea);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedIdea(displayIdea), 300);
    return () => window.clearTimeout(id);
  }, [displayIdea]);

  const caption = useMemo(() => {
    if (!enabled || !debouncedIdea.trim()) return "";
    const ctx = resolveGenerationCaptionContext({
      displayIdea: debouncedIdea,
      formGenre,
      mode,
      uiLocale: locale,
      diceAceOverride,
    });
    return ctx.captionOverride?.trim() ?? "";
  }, [enabled, debouncedIdea, formGenre, mode, locale, diceAceOverride]);

  const toggleEnabled = () => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  if (!enabled) {
    return (
      <button
        type="button"
        className="mt-2 text-xs text-pk-muted underline-offset-2 hover:text-pk-text hover:underline"
        onClick={toggleEnabled}
      >
        {d.acePreviewEnable}
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-pk border border-pk-border/80 bg-pk-input/40">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-pk-muted"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{d.acePreviewTitle}</span>
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && caption ? (
        <div className="border-t border-pk-border/60 px-3 py-2">
          <p className="font-mono text-[11px] leading-relaxed text-pk-text/90">{caption}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-pk-muted">{d.acePreviewNote}</p>
        </div>
      ) : null}
      {open && !caption ? (
        <p className="border-t border-pk-border/60 px-3 py-2 text-[11px] text-pk-muted">
          {d.ideaPromptHint}
        </p>
      ) : null}
    </div>
  );
}
