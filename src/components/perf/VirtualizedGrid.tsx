import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

function useColumnCount(breakpoints: { minWidth: number; columns: number }[], defaultColumns = 2) {
  const [columns, setColumns] = useState(defaultColumns);

  useEffect(() => {
    const sorted = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth);
    const update = () => {
      const w = window.innerWidth;
      const match = sorted.find((bp) => w >= bp.minWidth);
      setColumns(match?.columns ?? defaultColumns);
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, [breakpoints, defaultColumns]);

  return columns;
}

function useAppScrollElement(): HTMLElement | null {
  const [el, setEl] = useState<HTMLElement | null>(null);

  // useLayoutEffect (au lieu de useEffect + setTimeout) : s'exécute avant le
  // paint du navigateur. Si l'AppShell est déjà monté (cas normal en SPA),
  // le nœud existe dès le premier passage et on évite un re-render différé
  // supplémentaire qui contribuait au flicker au moment de la bascule
  // grid simple -> grid virtualisée.
  useLayoutEffect(() => {
    const find = () => {
      const node =
        document.getElementById("pk-main-scroll") ??
        document.querySelector<HTMLElement>(".pk-studio-workspace-scroll");
      if (node) {
        setEl(node);
        return true;
      }
      return false;
    };

    if (find()) return;

    // Fallback : si le scroll container n'est pas encore dans le DOM
    // (premier montage très précoce), on retente une fois au tick suivant.
    const t = window.setTimeout(find, 0);
    return () => window.clearTimeout(t);
  }, []);

  return el;
}

type VirtualizedGridProps<T> = {
  items: T[];
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  estimateRowHeight?: number;
  className?: string;
  rowClassName?: string;
  columnBreakpoints?: { minWidth: number; columns: number }[];
  /** Seuil minimal pour activer la virtualisation */
  virtualizeThreshold?: number;
};

const DEFAULT_BREAKPOINTS = [
  { minWidth: 1280, columns: 4 },
  { minWidth: 768, columns: 3 },
  { minWidth: 0, columns: 2 },
];

/**
 * Grille virtualisée par lignes — garde ~15–25 cartes DOM au scroll.
 */
export function VirtualizedGrid<T>({
  items,
  getKey,
  renderItem,
  estimateRowHeight = 340,
  className,
  rowClassName = "pk-virtual-grid-row grid gap-3 xl:gap-4",
  columnBreakpoints = DEFAULT_BREAKPOINTS,
  virtualizeThreshold = 24,
}: VirtualizedGridProps<T>) {
  const columns = useColumnCount(columnBreakpoints);
  const scrollElement = useAppScrollElement();
  const rowCount = Math.ceil(items.length / columns);

  const getScrollElement = useCallback(() => scrollElement, [scrollElement]);

  const shouldVirtualize = Boolean(scrollElement) && items.length >= virtualizeThreshold;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement,
    estimateSize: () => estimateRowHeight,
    overscan: 2,
    enabled: shouldVirtualize,
  });

  const virtualRows = virtualizer.getVirtualItems();

  // Fusion des anciennes conditions "items.length < threshold" et
  // "!scrollElement" en une seule vérification : tant que le virtualizer
  // n'a pas encore de lignes virtuelles calculées (première mesure du
  // ResizeObserver pas encore faite), on reste sur le rendu complet.
  // Ça évite de rendre un état intermédiaire vide/incomplet pendant la
  // bascule grid simple -> grid virtualisée, qui causait le flicker
  // ("les cartes apparaissent puis disparaissent").
  const isVirtualizerReady = shouldVirtualize && virtualRows.length > 0;

  if (!isVirtualizerReady) {
    return (
      <div className={className ?? "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 xl:gap-4"}>
        {items.map((item, index) => (
          <div key={getKey(item, index)}>{renderItem(item, index)}</div>
        ))}
      </div>
    );
  }

  return (
    <div className={className} style={{ height: virtualizer.getTotalSize(), position: "relative", width: "100%" }}>
      {virtualRows.map((virtualRow) => {
        const startIndex = virtualRow.index * columns;
        const rowItems = items.slice(startIndex, startIndex + columns);
        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className={rowClassName}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {rowItems.map((item, colIdx) => {
              const index = startIndex + colIdx;
              return <div key={getKey(item, index)}>{renderItem(item, index)}</div>;
            })}
          </div>
        );
      })}
    </div>
  );
}
