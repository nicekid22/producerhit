import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Search, X, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ALL_ARTIST_PRESETS,
  FR_ARTIST_PRESETS,
  type ArtistPreset,
  type ArtistRegion,
} from "@producerhit/shared";

type Props = {
  selectedId?: string;
  onSelect: (preset: ArtistPreset | null) => void;
  className?: string;
};

const REGION_TABS: { key: "all" | ArtistRegion; label: string }[] = [
  { key: "all", label: "All" },
  { key: "fr", label: "🇫🇷 France" },
  { key: "us", label: "🇺🇸 US" },
];

function getPresets(region: "all" | ArtistRegion): readonly ArtistPreset[] {
  if (region === "fr") return FR_ARTIST_PRESETS;
  if (region === "us") return ALL_ARTIST_PRESETS.filter((p) => p.region === "us");
  return ALL_ARTIST_PRESETS;
}

export function ArtistPresetPicker({ selectedId, onSelect, className }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<"all" | ArtistRegion>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const base = getPresets(region);
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (p) =>
        p.artistName.toLowerCase().includes(q) ||
        p.display.toLowerCase().includes(q) ||
        p.genre.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)),
    );
  }, [region, search]);

  const selected = useMemo(
    () => (selectedId ? ALL_ARTIST_PRESETS.find((p) => p.id === selectedId) : undefined),
    [selectedId],
  );

  const handleSelect = useCallback(
    (preset: ArtistPreset) => {
      onSelect(selectedId === preset.id ? null : preset);
      setOpen(false);
      setSearch("");
    },
    [onSelect, selectedId],
  );

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors",
          selected
            ? "border-purple-500/50 bg-purple-500/10 text-purple-200"
            : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10",
        )}
      >
        <Music className="h-4 w-4 shrink-0 opacity-60" />
        <span className="min-w-0 flex-1 truncate">
          {selected ? selected.display : "Inspired by (artist)"}
        </span>
        {selected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
            }}
            className="ml-1 rounded p-0.5 text-white/40 hover:text-white/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[320px] overflow-hidden rounded-xl border border-white/10 bg-gray-900 shadow-2xl"
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-white/40" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artist..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
            />
          </div>

          <div className="flex gap-1 border-b border-white/10 px-3 py-2">
            {REGION_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRegion(tab.key)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  region === tab.key
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:bg-white/8 hover:text-white/70",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-[320px] overflow-y-auto overscroll-contain p-1">
            {filtered.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-white/30">No artist found</div>
            )}
            {filtered.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelect(preset)}
                className={cn(
                  "flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors",
                  selectedId === preset.id
                    ? "bg-purple-500/20 ring-1 ring-purple-500/40"
                    : "hover:bg-white/8",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{preset.display}</span>
                  <span className="text-[10px] text-white/30">
                    {preset.bpm} BPM · {preset.key} {preset.scale}
                  </span>
                </div>
                <span className="mt-0.5 text-xs text-white/40 line-clamp-1">{preset.genre}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 px-3 py-1.5 text-center text-[10px] text-white/25">
            {filtered.length} artist{filtered.length !== 1 ? "s" : ""} · {region === "all" ? "FR + US" : region.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
}
