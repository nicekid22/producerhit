import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BLOG_POSTS, getBlogPostBySlug } from "@/content/blog";
import { useLocaleStore } from "@/stores/localeStore";

export default function BlogPost() {
  const { slug } = useParams();
  const locale = useLocaleStore((s) => s.locale);
  const post = slug ? getBlogPostBySlug(slug) : null;

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

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div className="min-h-screen bg-pk-bg text-pk-text">
      <Navbar variant="marketing" />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-sm text-pk-muted">
          <Link className="font-semibold text-pk-accent hover:underline" to="/blog">
            {locale === "fr" ? "Blog" : "Blog"}
          </Link>
          <span className="px-2">/</span>
          <span>{post.title}</span>
        </div>

        <article className="mt-8 rounded-2xl border border-pk-border bg-pk-panel/70 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
          <header>
            <div className="text-xs font-semibold text-pk-muted">{post.publishedAt}</div>
            <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight">{post.title}</h1>
            <p className="mt-3 text-balance text-sm text-pk-muted">{post.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {post.keywords.map((k) => (
                <span key={k} className="rounded-full border border-pk-border bg-white/5 px-3 py-1 text-xs font-semibold text-pk-muted">
                  {k}
                </span>
              ))}
            </div>
          </header>

          <div className="prose prose-invert prose-sm mt-10 max-w-none">
            {post.blocks.map((b, idx) => {
              if (b.type === "p") return <p key={idx}>{b.text}</p>;
              if (b.type === "h2") return <h2 key={idx}>{b.text}</h2>;
              if (b.type === "h3") return <h3 key={idx}>{b.text}</h3>;
              if (b.type === "ul")
                return (
                  <ul key={idx}>
                    {b.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                );
              return null;
            })}
          </div>
        </article>

        <section className="mt-8 rounded-2xl border border-pk-border bg-pk-panel/60 p-6 backdrop-blur-xl">
          <div className="text-sm font-semibold">{locale === "fr" ? "Aller plus loin" : "Next steps"}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/ai-beat-generator" className="rounded-full border border-pk-border bg-white/5 px-4 py-2 text-xs font-semibold text-pk-accent hover:bg-white/10">
              {locale === "fr" ? "Générateur de beats IA" : "AI Beat Generator"}
            </Link>
            <Link to="/ai-music-generator" className="rounded-full border border-pk-border bg-white/5 px-4 py-2 text-xs font-semibold text-pk-accent hover:bg-white/10">
              {locale === "fr" ? "Générateur de musique IA" : "AI Music Generator"}
            </Link>
            <Link to="/community" className="rounded-full border border-pk-border bg-white/5 px-4 py-2 text-xs font-semibold text-pk-accent hover:bg-white/10">
              {locale === "fr" ? "Écouter la communauté" : "Listen to Community"}
            </Link>
          </div>
        </section>

        {related.length ? (
          <section className="mt-8">
            <div className="text-sm font-semibold">{locale === "fr" ? "Articles liés" : "Related articles"}</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="rounded-2xl border border-pk-border bg-pk-panel/60 p-5 backdrop-blur-xl hover:border-pk-accent/30"
                >
                  <div className="text-xs font-semibold text-pk-muted">{p.publishedAt}</div>
                  <div className="mt-2 text-sm font-semibold">{p.title}</div>
                  <div className="mt-2 text-sm text-pk-muted">{p.description}</div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <footer className="mt-14 border-t border-pk-border pt-8 text-sm text-pk-muted">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/pricing" className="hover:text-pk-text">
              {locale === "fr" ? "Tarifs" : "Pricing"}
            </Link>
            <Link to="/legal#privacy" className="hover:text-pk-text">
              {locale === "fr" ? "Confidentialité" : "Privacy"}
            </Link>
            <Link to="/legal#terms" className="hover:text-pk-text">
              {locale === "fr" ? "Conditions" : "Terms"}
            </Link>
            <Link to="/legal#contact" className="hover:text-pk-text">
              {locale === "fr" ? "Support" : "Support"}
            </Link>
            <a className="hover:text-pk-text" href="mailto:info.producermarket@gmail.com">
              info.producermarket@gmail.com
            </a>
          </div>
          <div className="mt-4">© 2026 ProducerHit</div>
        </footer>
      </main>
    </div>
  );
}
