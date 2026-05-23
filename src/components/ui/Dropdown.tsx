import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

export type DropdownOption = { value: string; label: string; group?: string };

export function Dropdown({
  label,
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);
  const showSearch = options.length >= 14;

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q) || (o.group ?? "").toLowerCase().includes(q));
  }, [options, query]);

  const flatList = useMemo(() => {
    const groups = Array.from(new Set(filteredOptions.map((o) => o.group).filter(Boolean))) as string[];
    const ungrouped = filteredOptions.filter((o) => !o.group);
    const inGroups = groups.flatMap((g) => filteredOptions.filter((o) => o.group === g));
    return [...ungrouped, ...inGroups];
  }, [filteredOptions]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(-1);
      return;
    }
    const onDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => {
      if (showSearch) searchRef.current?.focus();
      else listRef.current?.focus();
    }, 0);
  }, [open, showSearch]);

  useEffect(() => {
    if (!open) return;
    const idx = flatList.findIndex((o) => o.value === value);
    if (idx >= 0) setActiveIndex(idx);
  }, [flatList, open, value]);

  const commit = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (disabled) return;
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(flatList.length - 1, Math.max(0, prev) + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(0, prev <= 0 ? 0 : prev - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = flatList[activeIndex];
      if (item) commit(item.value);
      return;
    }
  };

  return (
    <label className={cn("block", className)}>
      <div className="text-xs text-pk-muted">{label}</div>
      <div ref={rootRef} className="relative mt-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setOpen((v) => !v);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 pr-10 text-left text-sm text-pk-text outline-none transition-colors focus:border-pk-accent disabled:cursor-not-allowed disabled:opacity-60",
            open ? "border-pk-accent/60 ring-1 ring-pk-accent/25" : "",
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {selected ? selected.label : placeholder ? <span className="text-pk-muted">{placeholder}</span> : <span className="text-pk-muted">—</span>}
        </button>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pk-muted" aria-hidden />

        {open ? (
          <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-pk border border-pk-border bg-pk-bg/90 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            {showSearch ? (
              <div className="border-b border-pk-border/60 bg-white/3 p-2">
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={label}
                  className="w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm text-pk-text outline-none focus:border-pk-accent"
                />
              </div>
            ) : null}

            <div
              ref={listRef}
              tabIndex={0}
              onKeyDown={onKeyDown}
              className="max-h-80 overflow-auto p-1 outline-none"
              role="listbox"
            >
              {(() => {
                const groups = Array.from(new Set(filteredOptions.map((o) => o.group).filter(Boolean))) as string[];
                const ungrouped = filteredOptions.filter((o) => !o.group);
                const renderOption = (o: DropdownOption) => {
                  const isActive = flatList[activeIndex]?.value === o.value;
                  const isSelected = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(flatList.findIndex((x) => x.value === o.value))}
                      onClick={() => commit(o.value)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-pk px-3 py-2 text-left text-sm transition-colors",
                        isActive ? "bg-pk-accent/15 text-pk-text" : "text-pk-text hover:bg-white/5",
                      )}
                    >
                      <span className={cn("truncate", isSelected ? "font-semibold" : "")}>{o.label}</span>
                      {isSelected ? <Check className="h-4 w-4 text-pk-accent" /> : <span className="h-4 w-4" />}
                    </button>
                  );
                };

                return (
                  <>
                    {ungrouped.map(renderOption)}

                    {groups.map((g) => {
                      const items = filteredOptions.filter((o) => o.group === g);
                      if (items.length === 0) return null;
                      return (
                        <div key={g} className="mt-1">
                          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-pk-muted">{g}</div>
                          {items.map(renderOption)}
                        </div>
                      );
                    })}

                    {filteredOptions.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-pk-muted">Aucun résultat / No results</div>
                    ) : null}
                  </>
                );
              })()}
            </div>
          </div>
        ) : null}
      </div>
    </label>
  );
}
