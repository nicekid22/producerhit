import { cn } from "@/lib/utils";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";
import { Check, ChevronDown, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

export type DropdownOption = { value: string; label: string; group?: string };

type PanelRect = { top: number; left: number; width: number; maxHeight: number };

function DropdownOptionsList({
  filteredOptions,
  flatList,
  activeIndex,
  value,
  listRef,
  listClassName,
  listStyle,
  onKeyDown,
  onHoverOption,
  onSelect,
}: {
  filteredOptions: DropdownOption[];
  flatList: DropdownOption[];
  activeIndex: number;
  value: string;
  listRef: RefObject<HTMLDivElement | null>;
  listClassName?: string;
  listStyle?: CSSProperties;
  onKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => void;
  onHoverOption: (optionValue: string) => void;
  onSelect: (optionValue: string) => void;
}) {
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
        data-selected={isSelected ? "true" : undefined}
        onMouseEnter={() => onHoverOption(o.value)}
        onClick={() => onSelect(o.value)}
        className={cn(
          "flex w-full items-center justify-between rounded-pk px-3 py-2.5 text-left text-sm transition-colors",
          isActive ? "bg-pk-accent/15 text-pk-text" : "text-pk-text hover:bg-white/5",
        )}
      >
        <span className={cn("truncate", isSelected ? "font-semibold" : "")}>{o.label}</span>
        {isSelected ? <Check className="h-4 w-4 shrink-0 text-pk-accent" /> : <span className="h-4 w-4 shrink-0" />}
      </button>
    );
  };

  return (
    <div
      ref={listRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={listStyle}
      className={cn("overflow-y-auto overscroll-contain p-1 outline-none", listClassName)}
      role="listbox"
    >
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
    </div>
  );
}

function computeDesktopPanelRect(anchor: HTMLElement): PanelRect {
  const rect = anchor.getBoundingClientRect();
  const margin = 12;
  const gap = 8;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 640;
  const availableBelow = viewportHeight - rect.bottom - gap - margin;
  const availableAbove = rect.top - gap - margin;
  const preferBelow = availableBelow >= 180 || availableBelow >= availableAbove;
  const maxHeight = Math.max(160, Math.min(320, preferBelow ? availableBelow : availableAbove));
  const top = preferBelow ? rect.bottom + gap : Math.max(margin, rect.top - gap - maxHeight);

  return {
    top,
    left: rect.left,
    width: rect.width,
    maxHeight,
  };
}

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
  const isMobile = useIsMobileViewport();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [panelRect, setPanelRect] = useState<PanelRect | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
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

  const updatePanelRect = () => {
    const anchor = rootRef.current;
    if (!anchor) return;
    setPanelRect(computeDesktopPanelRect(anchor));
  };

  const scrollActiveIntoView = () => {
    window.requestAnimationFrame(() => {
      const buttons = listRef.current?.querySelectorAll('button[role="option"]');
      const target =
        (activeIndex >= 0 ? buttons?.[activeIndex] : null) ??
        listRef.current?.querySelector('[data-selected="true"]');
      target?.scrollIntoView({ block: "nearest", behavior: "auto" });
    });
  };

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(-1);
      setPanelRect(null);
      return;
    }

    const idx = flatList.findIndex((o) => o.value === value);
    if (idx >= 0) setActiveIndex(idx);
    if (!isMobile) updatePanelRect();

    window.setTimeout(() => {
      if (showSearch) searchRef.current?.focus();
      else listRef.current?.focus();
      scrollActiveIntoView();
    }, 0);
  }, [flatList, isMobile, open, showSearch, value]);

  useEffect(() => {
    if (!open || isMobile) return;
    const onLayout = () => updatePanelRect();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [isMobile, open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (isMobile) return;
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [isMobile, open]);

  useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    scrollActiveIntoView();
  }, [activeIndex, open]);

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
    }
  };

  const listProps = {
    filteredOptions,
    flatList,
    activeIndex,
    value,
    listRef,
    onKeyDown,
    onHoverOption: (optionValue: string) => setActiveIndex(flatList.findIndex((x) => x.value === optionValue)),
    onSelect: commit,
  };

  const desktopListMaxHeight = panelRect ? Math.max(120, panelRect.maxHeight - (showSearch ? 56 : 0)) : 320;

  const desktopPanel =
    open && !isMobile && panelRect
      ? createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: panelRect.top,
              left: panelRect.left,
              width: panelRect.width,
              maxHeight: panelRect.maxHeight,
              zIndex: 200,
            }}
            className="flex flex-col overflow-hidden rounded-pk border border-pk-border bg-pk-bg/95 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            {showSearch ? (
              <div className="shrink-0 border-b border-pk-border/60 bg-white/3 p-2">
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
            <DropdownOptionsList {...listProps} listStyle={{ maxHeight: desktopListMaxHeight }} />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
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

          {open && isMobile ? (
            <div className="fixed inset-0 z-[120] flex flex-col justify-end md:hidden" role="presentation">
              <button
                type="button"
                className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
              />
              <div className="relative z-[1] flex max-h-[min(78vh,560px)] flex-col overflow-hidden rounded-t-2xl border border-pk-border bg-pk-bg shadow-[0_-24px_80px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between gap-3 border-b border-pk-border/70 px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-pk-muted">{label}</div>
                    {selected ? <div className="truncate text-sm font-semibold text-pk-text">{selected.label}</div> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pk-border bg-pk-input text-pk-muted"
                    aria-label="Fermer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {showSearch ? (
                  <div className="shrink-0 border-b border-pk-border/60 p-3">
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder={label}
                      className="w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2.5 text-sm text-pk-text outline-none focus:border-pk-accent"
                    />
                  </div>
                ) : null}

                <DropdownOptionsList {...listProps} listClassName="min-h-0 flex-1" listStyle={{ maxHeight: "min(62vh, 480px)" }} />
              </div>
            </div>
          ) : null}
        </div>
      </label>
      {desktopPanel}
    </>
  );
}
