import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BLOG_POSTS } from "@/content/blog";
import { useLocaleStore } from "@/stores/localeStore";

export default function Blog() {
  const locale = useLocaleStore((s) => s.locale);

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-[#1a1a2e]">
      <Navbar variant="marketing" />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="max-w-3xl">
          <h1 className="text-balance text-3xl font-bold tracking-tight">{locale === "fr" ? "Blog" : "Blog"}</h1>
          <p className="mt-3 text-balance text-sm text-[#6b7280]">
            {locale === "fr"
              ? "Guides et stratégies pour générer de meilleurs beats et de la musique avec l’IA."
              : "Guides and tactics to get better beats and music from AI."}
          </p>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-2" aria-label="Blog posts">
          {BLOG_POSTS.slice()
            .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
            .map((p) => (
              <article key={p.slug} className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
                <div className="text-xs font-semibold text-[#6b7280]">{p.publishedAt}</div>
                <h2 className="mt-2 text-balance text-lg font-semibold">
                  <Link className="hover:text-[#6d28d9]" to={`/blog/${p.slug}`}>
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-[#6b7280]">{p.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.keywords.slice(0, 4).map((k) => (
                    <span key={k} className="rounded-full border border-[#e5e7eb] bg-[#f8f7ff] px-3 py-1 text-xs font-semibold text-[#6b7280]">
                      {k}
                    </span>
                  ))}
                </div>
                <div className="mt-5">
                  <Link className="text-sm font-semibold text-[#6d28d9] hover:underline" to={`/blog/${p.slug}`}>
                    {locale === "fr" ? "Lire l’article" : "Read article"}
                  </Link>
                </div>
              </article>
            ))}
        </section>

        <footer className="mt-14 border-t border-[#e5e7eb] pt-8 text-sm text-[#6b7280]">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/legal#privacy" className="hover:text-[#1a1a2e]">
              {locale === "fr" ? "Confidentialité" : "Privacy"}
            </Link>
            <Link to="/legal#terms" className="hover:text-[#1a1a2e]">
              {locale === "fr" ? "Conditions" : "Terms"}
            </Link>
            <Link to="/legal#contact" className="hover:text-[#1a1a2e]">
              {locale === "fr" ? "Support" : "Support"}
            </Link>
            <a className="hover:text-[#1a1a2e]" href="mailto:info.producermarket@gmail.com">
              info.producermarket@gmail.com
            </a>
          </div>
          <div className="mt-4">© 2026 ProducerHit</div>
        </footer>
      </main>
    </div>
  );
}

