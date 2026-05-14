import { Link, Navigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { getBlogPostBySlug } from "@/content/blog";
import { useLocaleStore } from "@/stores/localeStore";

export default function BlogPost() {
  const { slug } = useParams();
  const locale = useLocaleStore((s) => s.locale);
  const post = slug ? getBlogPostBySlug(slug) : null;

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div className="min-h-screen bg-[#f8f7ff] text-[#1a1a2e]">
      <Navbar variant="marketing" />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="text-sm text-[#6b7280]">
          <Link className="font-semibold text-[#6d28d9] hover:underline" to="/blog">
            {locale === "fr" ? "Blog" : "Blog"}
          </Link>
          <span className="px-2">/</span>
          <span>{post.title}</span>
        </div>

        <article className="mt-8">
          <header>
            <div className="text-xs font-semibold text-[#6b7280]">{post.publishedAt}</div>
            <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight">{post.title}</h1>
            <p className="mt-3 text-balance text-sm text-[#6b7280]">{post.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {post.keywords.map((k) => (
                <span key={k} className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1 text-xs font-semibold text-[#6b7280]">
                  {k}
                </span>
              ))}
            </div>
          </header>

          <div className="prose prose-sm mt-10 max-w-none text-[#1a1a2e]">
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

        <footer className="mt-14 border-t border-[#e5e7eb] pt-8 text-sm text-[#6b7280]">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/pricing" className="hover:text-[#1a1a2e]">
              {locale === "fr" ? "Tarifs" : "Pricing"}
            </Link>
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

