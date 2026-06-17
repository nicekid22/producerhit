import { Link } from "react-router-dom";

import { Search, X } from "lucide-react";

import { BLOG_CATEGORIES, blogCategoryLabel } from "@/content/blog/categories";

import { getAllBlogTags } from "@/lib/blogEngine";

import { BLOG_POSTS } from "@/content/blog";

import type { BlogCategoryId } from "@/content/blog/types";

import type { AppLocale } from "@/i18n/config";

import { getMessages } from "@/i18n/locales";



type Props = {

  locale: AppLocale;

  activeCategory?: BlogCategoryId;

  activeTag?: string;

  query: string;

  onQueryChange: (q: string) => void;

};



export function BlogFilters({ locale, activeCategory, activeTag, query, onQueryChange }: Props) {

  const b = getMessages(locale).blog;

  const tags = getAllBlogTags(BLOG_POSTS).slice(0, 16);



  return (

    <div className="space-y-5">

      <form

        className="relative"

        onSubmit={(e) => e.preventDefault()}

        role="search"

        aria-label={b.searchAria}

      >

        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />

        <input

          type="search"

          value={query}

          onChange={(e) => onQueryChange(e.target.value)}

          placeholder={b.searchPlaceholder}

          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-10 text-sm text-white placeholder:text-white/35 focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20"

        />

        {query ? (

          <button

            type="button"

            onClick={() => onQueryChange("")}

            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/45 hover:text-white"

            aria-label={b.clear}

          >

            <X className="h-4 w-4" />

          </button>

        ) : null}

      </form>



      <div>

        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">{b.categories}</p>

        <div className="mt-2 flex flex-wrap gap-2">

          <Link

            to="/blog"

            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${

              !activeCategory && !activeTag ? "bg-violet-600 text-white" : "border border-white/10 text-white/60 hover:text-white"

            }`}

          >

            {b.all}

          </Link>

          {BLOG_CATEGORIES.map((cat) => (

            <Link

              key={cat.id}

              to={`/blog/category/${cat.slug}`}

              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${

                activeCategory === cat.id

                  ? "bg-violet-600 text-white"

                  : "border border-white/10 text-white/60 hover:border-violet-400/30 hover:text-white"

              }`}

            >

              {blogCategoryLabel(cat.id, locale)}

            </Link>

          ))}

        </div>

      </div>



      <div>

        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">Tags</p>

        <div className="mt-2 flex flex-wrap gap-2">

          {tags.map((t) => (

            <Link

              key={t.slug}

              to={`/blog/tag/${t.slug}`}

              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${

                activeTag === t.slug

                  ? "bg-cyan-600/80 text-white"

                  : "border border-white/10 text-white/50 hover:border-cyan-400/25 hover:text-cyan-100"

              }`}

            >

              #{t.slug}

              <span className="ml-1 text-white/40">({t.count})</span>

            </Link>

          ))}

        </div>

      </div>

    </div>

  );

}

