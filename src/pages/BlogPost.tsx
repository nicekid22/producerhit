import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { BlogBlockRenderer } from "@/components/blog/BlogBlockRenderer";
import { BlogListenSampler } from "@/components/blog/BlogListenSampler";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { BLOG_POSTS, getBlogPostBySlug } from "@/content/blog";
import { getBlogVisual } from "@/lib/blogMeta";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";
import { buildSignupUrl } from "@/lib/growthLinks";

export default function BlogPost() {
  const { slug } = useParams();
  const locale = useLocaleStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const post = slug ? getBlogPostBySlug(slug) : null;
  const isFr = locale === "fr";

  const visual = useMemo(() => (post ? getBlogVisual(post.slug) : null), [post]);

  const related = useMemo(() => {
    if (!post) return [];
    const kw = new Set(post.keywords.map((k) => k.toLowerCase()));
    return BLOG_POSTS.map((p) => {
      if (p.slug === post.slug) return { p, score: -1 };
      const score = p.keywords.reduce((acc, k) => acc + (kw.has(k.toLowerCase()) ? 1 : 0), 0);
      return { p, score };
    })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.p);
  }, [post]);

  if (!post || !visual) return <Navigate to="/blog" replace />;

  const Icon = visual.icon;
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
          <span className="text-white/70">{post.title}</span>
        </nav>

        <header className="relative mt-6 overflow-hidden rounded-3xl border border-white/10">
          <img src={visual.heroImage} alt="" className="h-56 w-full object-cover sm:h-72" />
          <div className={`absolute inset-0 bg-gradient-to-t ${visual.accent} via-black/40 to-black/20`} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 ring-1 ring-white/15">
                <Icon className="h-3.5 w-3.5" />
                {visual.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] text-white/70">
                <Calendar className="h-3 w-3" />
                {post.publishedAt}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] text-white/70">
                <Clock className="h-3 w-3" />
                {visual.readingMinutes} min
              </span>
            </div>
            <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">{post.title}</h1>
            <p className="mt-3 max-w-2xl text-balance text-base leading-relaxed text-white/75">{post.description}</p>
          </div>
        </header>

        <article className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            {post.keywords.map((k) => (
              <span
                key={k}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/55"
              >
                {k}
              </span>
            ))}
          </div>

          <BlogListenSampler locale={locale} genreMatchers={visual.genreMatchers} className="mt-8" />

          <BlogBlockRenderer blocks={post.blocks} locale={locale} />

          <div className="mt-12 rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/15 to-transparent p-6">
            <h2 className="text-lg font-bold">{isFr ? "Essaie sur ProducerHit" : "Try on ProducerHit"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              {isFr
                ? "Applique les prompts de l’article — génération courte, Versions=2, export MP3."
                : "Apply the prompts from this article — short generations, Versions=2, MP3 export."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={ctaHref}
                className="inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                {user ? (isFr ? "Ouvrir le studio" : "Open studio") : isFr ? "Commencer gratuitement" : "Start free"}
              </Link>
              <Link
                to="/community"
                className="inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/5"
              >
                {isFr ? "Écouter la communauté" : "Listen to community"}
              </Link>
            </div>
          </div>
        </article>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-sm font-semibold text-white/90">{isFr ? "Pages liées" : "Related pages"}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to={isFr ? "/generateur-music-ai" : "/music-ai-generator"}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-violet-200 hover:bg-white/[0.08]"
            >
              Music AI Generator
            </Link>
            <Link
              to="/ai-beat-generator"
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-violet-200 hover:bg-white/[0.08]"
            >
              {isFr ? "Générateur beats IA" : "AI Beat Generator"}
            </Link>
            <Link
              to={isFr ? "/alternatives-suno" : "/suno-alternatives"}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-violet-200 hover:bg-white/[0.08]"
            >
              {isFr ? "Alternatives Suno" : "Suno Alternatives"}
            </Link>
            <Link
              to="/community"
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-violet-200 hover:bg-white/[0.08]"
            >
              {isFr ? "Communauté" : "Community"}
            </Link>
          </div>
        </section>

        {related.length ? (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-white/90">{isFr ? "Articles liés" : "Related articles"}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {related.map((p) => (
                <BlogPostCard key={p.slug} post={p} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <LandingFooter locale={locale} user={user} />
    </MarketingPageShell>
  );
}
