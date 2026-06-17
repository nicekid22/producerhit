import { Link } from "react-router-dom";

import { getBlogAuthor, blogAuthorBio, blogAuthorRole } from "@/content/blog/authors";

import type { BlogAuthorId } from "@/content/blog/types";

import type { AppLocale } from "@/i18n/config";

import { getMessages } from "@/i18n/locales";



type Props = {

  authorId: BlogAuthorId;

  locale: AppLocale;

  compact?: boolean;

};



export function BlogAuthorCard({ authorId, locale, compact }: Props) {

  const author = getBlogAuthor(authorId);

  const b = getMessages(locale).blog;



  if (compact) {

    return (

      <div className="flex items-center gap-3">

        <img src={author.avatarUrl} alt="" className="h-9 w-9 rounded-full ring-1 ring-white/15" />

        <div>

          <p className="text-sm font-semibold text-white">{author.name}</p>

          <p className="text-xs text-white/45">{blogAuthorRole(author, locale)}</p>

        </div>

      </div>

    );

  }



  return (

    <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">{b.author}</p>

      <div className="mt-3 flex gap-4">

        <img src={author.avatarUrl} alt="" className="h-14 w-14 rounded-2xl ring-1 ring-white/15" />

        <div>

          <p className="font-bold text-white">{author.name}</p>

          <p className="text-xs font-semibold text-violet-300/90">{blogAuthorRole(author, locale)}</p>

          <p className="mt-2 text-sm leading-relaxed text-white/55">{blogAuthorBio(author, locale)}</p>

          <Link to="/blog" className="mt-3 inline-block text-xs font-semibold text-cyan-300 hover:underline">

            {b.moreArticles}

          </Link>

        </div>

      </div>

    </aside>

  );

}

