import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { BookOpen, Sparkles } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { BlogFilters } from "@/components/blog/BlogFilters";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { BLOG_POSTS } from "@/content/blog";
import { getBlogCategoryBySlug, blogCategoryLabel, blogCategoryDescription } from "@/content/blog/categories";
import { searchBlogPosts } from "@/lib/blogEngine";
import { localizedPath } from "@/i18n/config";
import { interpolate, useT } from "@/i18n";
import { useAuthStore } from "@/stores/authStore";

export default function Blog() {
  const { locale, m } = useT();
  const user = useAuthStore((s) => s.user);
  const { categorySlug, tagSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const category = categorySlug ? getBlogCategoryBySlug(categorySlug) : null;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const result = useMemo(
    () =>
      searchBlogPosts(BLOG_POSTS, {
        q: query || searchParams.get("q") || undefined,
        categoryId: category?.id,
        tag: tagSlug,
        page,
        uiLocale: locale,
      }),
    [category?.id, locale, page, query, searchParams, tagSlug],
  );

  const onQueryChange = (q: string) => {
    setQuery(q);
    const next = new URLSearchParams(searchParams);
    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const basePath = categorySlug
    ? `/blog/category/${categorySlug}`
    : tagSlug
      ? `/blog/tag/${tagSlug}`
      : "/blog";

  const headerTitle = category
    ? blogCategoryLabel(category.id, locale)
    : tagSlug
      ? `#${tagSlug}`
      : m.blog.heroTitle;

  const headerDesc = category
    ? blogCategoryDescription(category.id, locale)
    : tagSlug
      ? interpolate(m.blog.tagDesc, { tag: tagSlug })
      : m.blog.heroDesc;

  const pageLabel =
    result.totalPages > 1
      ? ` · ${interpolate(m.blog.pageOf, { page: result.page, total: result.totalPages })}`
      : "";

  return (
    <MarketingPageShell>
      <Navbar variant="marketing" />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-transparent to-cyan-500/10 p-8 sm:p-10">
          <div className="relative z-[1] max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet-200">
              <BookOpen className="h-3.5 w-3.5" />
              ProducerHit Blog
            </div>
            <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">{headerTitle}</h1>
            <p className="mt-4 text-balance text-base leading-relaxed text-white/70">{headerDesc}</p>
            <p className="mt-3 text-sm text-white/45">
              {result.total} {m.blog.articles}
              {pageLabel}
            </p>
          </div>
        </header>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Quick links">
          <Link
            to={localizedPath(locale, "/music-ai-generator", "/generateur-music-ai")}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold hover:border-violet-400/30 hover:bg-white/[0.08]"
          >
            <Sparkles className="mb-2 h-4 w-4 text-violet-300" />
            Music AI Generator
          </Link>
          <Link
            to="/ai-sleep-music-generator"
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold hover:border-violet-400/30 hover:bg-white/[0.08]"
          >
            {m.blog.sleepMusicAi}
          </Link>
          <Link
            to="/ai-beat-generator"
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold hover:border-violet-400/30 hover:bg-white/[0.08]"
          >
            {m.blog.aiBeatGenerator}
          </Link>
          <Link to="/rss.xml" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold hover:border-violet-400/30 hover:bg-white/[0.08]">
            RSS
          </Link>
        </section>

        <section className="mt-8">
          <BlogFilters
            locale={locale}
            activeCategory={category?.id}
            activeTag={tagSlug}
            query={query}
            onQueryChange={onQueryChange}
          />
        </section>

        {result.posts.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/50">{m.blog.noResults}</p>
        ) : (
          <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Blog posts">
            {result.posts.map((p) => (
              <BlogPostCard key={p.slug} post={p} locale={locale} enriched={p} />
            ))}
          </section>
        )}

        <BlogPagination locale={locale} page={result.page} totalPages={result.totalPages} basePath={basePath} />

        <footer className="mt-14 border-t border-white/10 pt-8 text-sm text-white/50">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/legal#privacy" className="hover:text-white">
              {m.common.privacy}
            </Link>
            <Link to="/legal#terms" className="hover:text-white">
              {m.common.terms}
            </Link>
            <Link to="/legal#contact" className="hover:text-white">
              {m.common.support}
            </Link>
          </div>
          <div className="mt-4">© 2026 ProducerHit</div>
        </footer>
      </main>
      <LandingFooter locale={locale} user={user} />
    </MarketingPageShell>
  );
}
