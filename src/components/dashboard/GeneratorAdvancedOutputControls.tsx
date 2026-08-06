import { GenerationCreditAmount } from "@/components/GenerationCreditIcon";
import { cn } from "@/lib/utils";

import type { AppLocale } from "@/i18n/config";
export const VOCAL_STYLE_OPTIONS = [
  { value: "Singer", label: "Singer" },
  { value: "Rapper", label: "Rapper" },
  { value: "Singer-Rapper", label: "Hybrid" },
  { value: "Choir", label: "Vocal group" },
] as const;

export type VocalStyleValue = (typeof VOCAL_STYLE_OPTIONS)[number]["value"];

type Props = {
  locale: AppLocale;
  versions: 1 | 2;
  onVersionsChange: (v: 1 | 2) => void;
  remaining: number;
  chipRowClass: string;
  /** Studio+ — Pro et Free limités à ×1 */
  canDualGeneration?: boolean;
  onDualLocked?: () => void;
  showVocalStyle?: boolean;
  vocalStyle?: VocalStyleValue;
  onVocalStyleChange?: (v: VocalStyleValue) => void;
  /** Toggle "Batch ACE officiel" — force batch_size=2 (1 seul appel ACE) quand Versions=2 */
  batchMode?: boolean;
  onBatchModeChange?: (enabled: boolean) => void;
};

export function GeneratorAdvancedOutputControls({
  locale,
  versions,
  onVersionsChange,
  remaining,
  chipRowClass,
  canDualGeneration = true,
  onDualLocked,
  showVocalStyle = false,
  vocalStyle = "Singer",
  onVocalStyleChange,
  batchMode = false,
  onBatchModeChange,
}: Props) {
  const isFr = locale === "fr";

  return (
    <div className="grid min-w-0 max-w-full gap-4">
      <div className="min-w-0 max-w-full">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="min-w-0 text-xs font-medium text-pk-muted">{isFr ? "Versions" : "Versions"}</div>
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/[0.06] bg-white/5 p-1">
            <button
              type="button"
              onClick={() => onVersionsChange(1)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                versions === 1 ? "pk-prism-pill-active" : "text-white/50 hover:text-white",
              )}
            >
              1
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canDualGeneration) {
                  onDualLocked?.();
                  return;
                }
                onVersionsChange(2);
              }}
              disabled={canDualGeneration && remaining < 2}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                versions === 2 ? "pk-prism-pill-active" : "text-white/50 hover:text-white",
                canDualGeneration && remaining < 2 && "opacity-50",
                !canDualGeneration && "opacity-45",
              )}
            >
              2
            </button>
          </div>
        </div>
        <p className="mt-1.5 inline-flex max-w-full flex-wrap items-center gap-1 text-[10px] leading-snug text-pk-muted/80">
          {versions === 2 ? (
            <>
              <span>{isFr ? "2 pistes (" : "2 tracks ("}</span>
              <GenerationCreditAmount amount={2} iconClassName="h-2.5 w-2.5" />
              <span>{isFr ? ")." : ")."}</span>
            </>
          ) : (
            <>
              <span>{isFr ? "1 piste (" : "1 track ("}</span>
              <GenerationCreditAmount amount={1} iconClassName="h-2.5 w-2.5" />
              <span>{isFr ? ")." : ")."}</span>
            </>
          )}
        </p>
      </div>

      {versions === 2 && onBatchModeChange ? (
        <div className="min-w-0 max-w-full">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0 text-xs font-medium text-pk-muted">
              {isFr ? "Batch officiel ACE" : "Official ACE batch"}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={batchMode}
              onClick={() => onBatchModeChange(!batchMode)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                batchMode ? "bg-pk-accent/80" : "bg-white/10",
              )}
            >
              <span
                className={cn(
                  "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                  batchMode ? "translate-x-4" : "translate-x-1",
                )}
              />
            </button>
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-pk-muted/80">
            {isFr
              ? "batch_size=2 : 1 seul appel ACE génère les 2 pistes. Désactivé = 2 appels séparés."
              : "batch_size=2: 1 single ACE call generates both tracks. Off = 2 separate calls."}
          </p>
        </div>
      ) : null}

      {showVocalStyle && onVocalStyleChange ? (
        <div className="min-w-0 max-w-full">
          <div className="text-xs text-pk-muted">{isFr ? "Style vocal" : "Vocal Style"}</div>
          <div className={cn(chipRowClass, "max-w-full flex-wrap")}>
            {VOCAL_STYLE_OPTIONS.map((v) => {
              const active = vocalStyle === v.value;
              return (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => onVocalStyleChange(v.value)}
                  className={
                    active
                      ? "rounded-full border border-pk-accent/40 bg-pk-accent/15 px-3.5 py-2 text-xs font-semibold text-pk-accent"
                      : "rounded-full border border-pk-border bg-pk-bg px-3.5 py-2 text-xs text-pk-muted hover:bg-white/5 hover:text-pk-text"
                  }
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
