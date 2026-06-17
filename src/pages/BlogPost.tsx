import { useMemo } from "react";

import { Link, Navigate, useParams } from "react-router-dom";

import { Calendar, Clock } from "lucide-react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";

import { Navbar } from "@/components/Navbar";

import { LandingFooter } from "@/components/landing/LandingFooter";

import { BlogBlockRenderer } from "@/components/blog/BlogBlockRenderer";

import { BlogListenSampler } from "@/components/blog/BlogListenSampler";

import { BlogPostCard } from "@/components/blog/BlogPostCard";

import { BlogAuthorCard } from "@/components/blog/BlogAuthorCard";

import { BLOG_POSTS, getBlogPostBySlug } from "@/content/blog";

import { blogCategoryLabel, getBlogCategory } from "@/content/blog/categories";

import { getBlogVisual } from "@/lib/blogMeta";

import { enrichBlogPost, getRelatedBlogPosts } from "@/lib/blogEngine";

import { localizedPath } from "@/i18n/config";

import { formatDate, formatReadingTime } from "@/i18n/format";

import { useT } from "@/i18n";

import { useAuthStore } from "@/stores/authStore";

import { buildSignupUrl } from "@/lib/growthLinks";



export default function BlogPost() {

  const { slug } = useParams();

  const { locale, m } = useT();

  const user = useAuthStore((s) => s.user);

  const rawPost = slug ? getBlogPostBySlug(slug) : null;



  const enriched = useMemo(() => (rawPost ? enrichBlogPost(rawPost) : null), [rawPost]);

  const visual = useMemo(() => (enriched ? getBlogVisual(enriched.slug, enriched) : null), [enriched]);



  const related = useMemo(() => {

    if (!enriched) return [];

    return getRelatedBlogPosts(enriched, BLOG_POSTS, 4);

  }, [enriched]);



  if (!rawPost || !enriched || !visual) return <Navigate to="/blog" replace />;



  const post = rawPost;

  const ctaHref = user ? "/dashboard" : buildSignupUrl("blog");



  return (

    <MarketingPageShell>

      <Navbar variant="marketing" />

      <main className="mx-auto max-w-4xl px-4 pb-16 pt-6">

        <nav className="text-sm text-white/50">

          <Link className="font-semibold text-violet-300 hover:underline" to="/blog">

            Blog

          </Link>

          <span className="px-2">/</span>

          <Link className="text-white/55 hover:text-white" to={`/blog/category/${getBlogCategory(enriched.categoryId).slug}`}>

            {blogCategoryLabel(enriched.categoryId, locale)}

          </Link>

          <span className="px-2">/</span>

          <span className="text-white/70">{post.title}</span>

        </nav>



        <header className="relative mt-6 overflow-hidden rounded-3xl border border-white/10">

          <img src={enriched.ogImageUrl} alt="" className="h-56 w-full object-cover sm:h-72" />

          <div className={`absolute inset-0 bg-gradient-to-t ${visual.accent} via-black/40 to-black/20`} />

          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">

            <div className="flex flex-wrap items-center gap-2">

              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 ring-1 ring-white/15">

                {blogCategoryLabel(enriched.categoryId, locale)}

              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] text-white/70">

                <Calendar className="h-3 w-3" />

                {formatDate(locale, post.publishedAt)}

              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] text-white/70">

                <Clock className="h-3 w-3" />

                {formatReadingTime(locale, enriched.readingMinutes)}

              </span>

            </div>

            <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">{post.title}</h1>

            <p className="mt-3 max-w-2xl text-balance text-base leading-relaxed text-white/75">{post.description}</p>

          </div>

        </header>



        <div className="mt-6">

          <BlogAuthorCard authorId={enriched.authorId} locale={locale} compact />

        </div>



        <article className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">

          <div className="flex flex-wrap gap-2">

            {enriched.tags.map((t) => (

              <Link

                key={t}

                to={`/blog/tag/${t}`}

                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/55 hover:border-cyan-400/25 hover:text-cyan-100"

              >

                #{t}

              </Link>

            ))}

          </div>



          <BlogListenSampler locale={locale} genreMatchers={visual.genreMatchers} className="mt-8" />



          <BlogBlockRenderer blocks={post.blocks} locale={locale} />



          <div className="mt-12 rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/15 to-transparent p-6">

            <h2 className="text-lg font-bold">{m.blog.tryTitle}</h2>

            <p className="mt-2 text-sm leading-relaxed text-white/70">{m.blog.tryArticleDesc}</p>

            <div className="mt-5 flex flex-wrap gap-3">

              <Link

                to={ctaHref}

                className="inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"

              >

                {user ? m.blog.openStudio : m.blog.startFree}

              </Link>

              <Link

                to="/community"

                className="inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/5"

              >

                {m.blog.listenCommunity}

              </Link>

            </div>

          </div>

        </article>



        <div className="mt-8">

          <BlogAuthorCard authorId={enriched.authorId} locale={locale} />

        </div>



        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="text-sm font-semibold text-white/90">{m.blog.relatedPages}</div>

          <div className="mt-3 flex flex-wrap gap-2">

            <Link

              to={localizedPath(locale, "/music-ai-generator", "/generateur-music-ai")}

              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-violet-200 hover:bg-white/[0.08]"

            >

              Music AI Generator

            </Link>

            <Link

              to="/ai-beat-generator"

              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-violet-200 hover:bg-white/[0.08]"

            >

              {m.blog.aiBeatGenerator}

            </Link>

            <Link

              to={localizedPath(locale, "/suno-alternatives", "/alternatives-suno")}

              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-violet-200 hover:bg-white/[0.08]"

            >

              {m.blog.sunoAlternatives}

            </Link>

            <Link

              to="/community"

              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-violet-200 hover:bg-white/[0.08]"

            >

              {m.blog.community}

            </Link>

          </div>

        </section>



        {related.length ? (

          <section className="mt-10">

            <h2 className="text-lg font-semibold text-white/90">{m.blog.relatedArticles}</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">

              {related.map((p) => (

                <BlogPostCard key={p.slug} post={p} locale={locale} enriched={p} />

              ))}

            </div>

          </section>

        ) : null}

      </main>

      <LandingFooter locale={locale} user={user} />

    </MarketingPageShell>

  );

}

