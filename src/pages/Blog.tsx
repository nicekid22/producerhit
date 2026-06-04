import { Link } from "react-router-dom";
import { BookOpen, Sparkles } from "lucide-react";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { BLOG_POSTS } from "@/content/blog";
import { useLocaleStore } from "@/stores/localeStore";
import { useAuthStore } from "@/stores/authStore";

export default function Blog() {
  const locale = useLocaleStore((s) => s.locale);
  const user = useAuthStore((s) => s.user);
  const isFr = locale === "fr";

  const sorted = BLOG_POSTS.slice().sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

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
            <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
              {isFr ? "Guides producteur & SEO musique IA" : "Producer guides & AI music SEO"}
            </h1>
            <p className="mt-4 text-balance text-base leading-relaxed text-white/70">
              {isFr
                ? "Prompts copy/paste, workflows seed, comparatifs Suno/Udio, et musique sleep/study — avec extraits audio de la communauté."
                : "Copy/paste prompts, seed workflows, Suno/Udio comparisons, and sleep/study music — with community audio previews."}
            </p>
          </div>
        </header>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Quick links">
          <Link
            to={isFr ? "/generateur-music-ai" : "/music-ai-generator"}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold hover:border-violet-400/30 hover:bg-white/[0.08]"
          >
            <Sparkles className="mb-2 h-4 w-4 text-violet-300" />
            Music AI Generator
          </Link>
          <Link
            to="/ai-sleep-music-generator"
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold hover:border-violet-400/30 hover:bg-white/[0.08]"
          >
            {isFr ? "Musique sommeil IA" : "Sleep music AI"}
          </Link>
          <Link
            to="/ai-beat-generator"
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold hover:border-violet-400/30 hover:bg-white/[0.08]"
          >
            AI Beat Generator
          </Link>
          <Link to="/rss.xml" className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold hover:border-violet-400/30 hover:bg-white/[0.08]">
            RSS
          </Link>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2" aria-label="Blog posts">
          {sorted.map((p) => (
            <BlogPostCard key={p.slug} post={p} locale={locale} />
          ))}
        </section>

        <footer className="mt-14 border-t border-white/10 pt-8 text-sm text-white/50">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/legal#privacy" className="hover:text-white">
              {isFr ? "Confidentialité" : "Privacy"}
            </Link>
            <Link to="/legal#terms" className="hover:text-white">
              {isFr ? "Conditions" : "Terms"}
            </Link>
            <Link to="/legal#contact" className="hover:text-white">
              {isFr ? "Support" : "Support"}
            </Link>
            <a className="hover:text-white" href="mailto:info.producermarket@gmail.com">
              info.producermarket@gmail.com
            </a>
          </div>
          <div className="mt-4">© 2026 ProducerHit</div>
        </footer>
      </main>
      <LandingFooter locale={locale} user={user} />
    </MarketingPageShell>
  );
}
