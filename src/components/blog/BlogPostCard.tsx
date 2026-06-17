import { Link } from "react-router-dom";

import type { BlogPost, EnrichedBlogPost } from "@/content/blog/types";

import { blogCategoryLabel } from "@/content/blog/categories";

import { getBlogVisual } from "@/lib/blogMeta";

import { enrichBlogPost } from "@/lib/blogEngine";

import { formatReadingTime } from "@/i18n/format";

import { getMessages } from "@/i18n/locales";

import { Clock, User } from "lucide-react";

import type { AppLocale } from "@/i18n/config";



type Props = {

  post: BlogPost;

  locale: AppLocale;

  enriched?: EnrichedBlogPost;

};



export function BlogPostCard({ post, locale, enriched: enrichedProp }: Props) {

  const b = getMessages(locale).blog;

  const enriched = enrichedProp ?? enrichBlogPost(post);

  const visual = getBlogVisual(post.slug, enriched);

  const Icon = visual.icon;



  return (

    <article className="pk-blog-card group overflow-hidden rounded-2xl border border-pk-border bg-pk-panel/60 backdrop-blur-xl transition-colors hover:border-violet-400/30">

      <Link to={`/blog/${post.slug}`} className="block">

        <div className="relative aspect-[2/1] overflow-hidden">

          <img

            src={enriched.ogImageUrl}

            alt=""

            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"

            loading="lazy"

          />

          <div className={`absolute inset-0 bg-gradient-to-t ${visual.accent} to-black/55`} />

          <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-black/45 ring-1 ring-white/15 backdrop-blur-sm">

            <Icon className="h-5 w-5 text-white" aria-hidden />

          </div>

          <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80">

            {blogCategoryLabel(enriched.categoryId, locale)}

          </span>

        </div>

        <div className="p-5">

          <div className="flex flex-wrap items-center gap-2 text-xs text-pk-muted">

            <span>{post.publishedAt}</span>

            <span className="inline-flex items-center gap-1">

              <Clock className="h-3 w-3" />

              {formatReadingTime(locale, enriched.readingMinutes)}

            </span>

            <span className="inline-flex items-center gap-1">

              <User className="h-3 w-3" />

              {b.editorial}

            </span>

          </div>

          <h2 className="mt-2 text-balance text-lg font-semibold text-white group-hover:text-violet-200">{post.title}</h2>

          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-pk-muted">{post.description}</p>

          <div className="mt-4 flex flex-wrap gap-1.5">

            {enriched.tags.slice(0, 4).map((t) => (

              <span key={t} className="rounded-full border border-pk-border bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-pk-muted">

                #{t}

              </span>

            ))}

          </div>

          <span className="mt-4 inline-block text-sm font-semibold text-pk-accent">{b.readArticle}</span>

        </div>

      </Link>

    </article>

  );

}

