import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { PrismFilterPill } from "@/components/prism/PrismFilterPill";
import type { CommunityVibeCategory } from "@/lib/communityHub";
import { communityVibePath } from "@/lib/communitySeo";
import type { AppLocale } from "@/i18n/config";
import { buildCommunityHubUiCopy } from "@/i18n/communityHubUiCatalog";
import { useMemo } from "react";

type Props = {
  locale: AppLocale;
  categories: Array<{ category: CommunityVibeCategory; count: number }>;
  activeVibeId: string | null;
  query: string;
  sort: "new" | "top" | "random";
  onVibeChange: (id: string | null) => void;
  onQueryChange: (q: string) => void;
  onSortChange: (sort: "new" | "top" | "random") => void;
};

export function CommunityVibeNav({
  locale,
  categories,
  activeVibeId,
  query,
  sort,
  onVibeChange,
  onQueryChange,
  onSortChange,
}: Props) {
  const copy = useMemo(() => buildCommunityHubUiCopy(locale), [locale]);

  return (
    <div className="pk-hub-nav sticky top-0 z-20 space-y-3 rounded-2xl border border-white/10 bg-[#06060c]/90 px-4 py-3 backdrop-blur-xl">
      <div className="pk-prism-input-shell">
        <Search />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={copy.searchPlaceholder}
        />
      </div>

      <div className="pk-hub-nav__vibes flex gap-2 overflow-x-auto pb-0.5">
        <Link
          to="/community"
          onClick={() => onVibeChange(null)}
          className={["pk-hub-vibe-tile", !activeVibeId ? "pk-hub-vibe-tile--active" : ""].join(" ")}
        >
          <span className="pk-hub-vibe-tile__title">{copy.allVibes}</span>
        </Link>
        {categories.map(({ category, count }) => {
          const active = activeVibeId === category.id;
          return (
            <Link
              key={category.id}
              to={communityVibePath(category.id)}
              onClick={() => onVibeChange(category.id)}
              className={["pk-hub-vibe-tile", active ? "pk-hub-vibe-tile--active" : ""].join(" ")}
              data-vibe={category.id}
            >
              <span className="pk-hub-vibe-tile__title">{copy.categoryTitle(category)}</span>
              <span className="pk-hub-vibe-tile__sub">{copy.categorySubtitle(category)}</span>
              <span className="pk-hub-vibe-tile__count">{count}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">{copy.sort}</span>
        <PrismFilterPill active={sort === "new"} onClick={() => onSortChange("new")}>
          {copy.sortNew}
        </PrismFilterPill>
        <PrismFilterPill active={sort === "top"} onClick={() => onSortChange("top")}>
          Top
        </PrismFilterPill>
        <PrismFilterPill active={sort === "random"} onClick={() => onSortChange("random")}>
          {copy.sortRandom}
        </PrismFilterPill>
      </div>
    </div>
  );
}
