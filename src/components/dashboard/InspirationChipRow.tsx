import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const VISIBLE_COUNT = 5;
const ROTATE_MIN_MS = 11_000;
const ROTATE_MAX_MS = 18_000;

function pickInitialVisible(pool: readonly string[], count: number): string[] {
  if (pool.length <= count) return [...pool];
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function pickReplacement(pool: readonly string[], visible: string[]): string | null {
  const hidden = pool.filter((c) => !visible.includes(c));
  if (!hidden.length) return null;
  return hidden[Math.floor(Math.random() * hidden.length)] ?? null;
}

type Props = {
  chips: readonly string[];
  isActive: (chip: string) => boolean;
  onChipClick: (chip: string) => void;
  className?: string;
};

/** Une ligne de chips inspiration — remplace un chip de temps en temps (animation douce). */
export function InspirationChipRow({ chips, isActive, onChipClick, className }: Props) {
  const poolKey = chips.join("\u0001");
  const [visible, setVisible] = useState<string[]>(() => pickInitialVisible(chips, VISIBLE_COUNT));
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setVisible(pickInitialVisible(chips, VISIBLE_COUNT));
  }, [poolKey]);

  const scheduleRotate = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (chips.length <= VISIBLE_COUNT) return;

    const delay = ROTATE_MIN_MS + Math.random() * (ROTATE_MAX_MS - ROTATE_MIN_MS);
    timerRef.current = setTimeout(() => {
      setVisible((prev) => {
        const nextChip = pickReplacement(chips, prev);
        if (!nextChip) return prev;
        const idx = Math.floor(Math.random() * prev.length);
        const next = [...prev];
        next[idx] = nextChip;
        return next;
      });
      scheduleRotate();
    }, delay);
  }, [chips, poolKey]);

  useEffect(() => {
    if (paused || chips.length <= VISIBLE_COUNT) return;
    scheduleRotate();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [chips.length, paused, poolKey, scheduleRotate]);

  if (!chips.length) return null;

  return (
    <div
      className={cn("pk-inspiration-chip-row mt-3", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      {visible.map((chip) => {
        const on = isActive(chip);
        return (
          <span key={chip} className="pk-inspiration-chip-slot shrink-0">
            <button
              type="button"
              onClick={() => onChipClick(chip)}
              className={
                on
                  ? "rounded-full border border-pk-accent/40 bg-pk-accent/15 px-3 py-1 text-[11px] font-semibold text-pk-accent whitespace-nowrap"
                  : "rounded-full border border-pk-border bg-pk-bg px-3 py-1 text-[11px] text-pk-muted whitespace-nowrap hover:bg-white/5 hover:text-pk-text"
              }
            >
              {chip}
            </button>
          </span>
        );
      })}
    </div>
  );
}
