import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BLOG_POSTS } from "@/content/blog";
import { useLocaleStore } from "@/stores/localeStore";

export default function Blog() {
  const locale = useLocaleStore((s) => s.locale);

  return (
    <div className="min-h-screen bg-pk-bg text-pk-text">
      <Navbar variant="marketing" />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="max-w-3xl">
          <h1 className="text-balance text-3xl font-bold tracking-tight">{locale === "fr" ? "Blog" : "Blog"}</h1>
          <p className="mt-3 text-balance text-sm text-pk-muted">
            {locale === "fr"
              ? "Guides et stratégies pour générer de meilleurs beats et de la musique avec l’IA."
              : "Guides and tactics to get better beats and music from AI."}
          </p>
        </header>

        <section className="mt-8 grid gap-3 rounded-2xl border border-pk-border bg-pk-panel/70 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl md:grid-cols-4" aria-label="Quick links">
          <Link to="/ai-beat-generator" className="rounded-2xl border border-pk-border bg-white/5 px-4 py-4 text-sm font-semibold hover:bg-white/10">
            {locale === "fr" ? "AI Beat Generator" : "AI Beat Generator"}
          </Link>
          <Link to="/ai-music-generator" className="rounded-2xl border border-pk-border bg-white/5 px-4 py-4 text-sm font-semibold hover:bg-white/10">
            {locale === "fr" ? "AI Music Generator" : "AI Music Generator"}
          </Link>
          <Link to="/type-beat-generator-ai" className="rounded-2xl border border-pk-border bg-white/5 px-4 py-4 text-sm font-semibold hover:bg-white/10">
            {locale === "fr" ? "Type Beat Generator" : "Type Beat Generator"}
          </Link>
          <Link to="/rss.xml" className="rounded-2xl border border-pk-border bg-white/5 px-4 py-4 text-sm font-semibold hover:bg-white/10">
            {locale === "fr" ? "RSS (nouveaux posts)" : "RSS (new posts)"}
          </Link>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2" aria-label="Blog posts">
          {BLOG_POSTS.slice()
            .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
            .map((p) => (
              <article key={p.slug} className="rounded-2xl border border-pk-border bg-pk-panel/60 p-6 backdrop-blur-xl">
                <div className="text-xs font-semibold text-pk-muted">{p.publishedAt}</div>
                <h2 className="mt-2 text-balance text-lg font-semibold">
                  <Link className="hover:text-pk-accent" to={`/blog/${p.slug}`}>
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-pk-muted">{p.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.keywords.slice(0, 4).map((k) => (
                    <span key={k} className="rounded-full border border-pk-border bg-white/5 px-3 py-1 text-xs font-semibold text-pk-muted">
                      {k}
                    </span>
                  ))}
                </div>
                <div className="mt-5">
                  <Link className="text-sm font-semibold text-pk-accent hover:underline" to={`/blog/${p.slug}`}>
                    {locale === "fr" ? "Lire l’article" : "Read article"}
                  </Link>
                </div>
              </article>
            ))}
        </section>

        <footer className="mt-14 border-t border-pk-border pt-8 text-sm text-pk-muted">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
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
