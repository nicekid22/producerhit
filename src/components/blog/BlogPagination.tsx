import { Link, useSearchParams } from "react-router-dom";

import type { AppLocale } from "@/i18n/config";

import { getMessages } from "@/i18n/locales";



type Props = {

  locale: AppLocale;

  page: number;

  totalPages: number;

  basePath: string;

};



export function BlogPagination({ locale, page, totalPages, basePath }: Props) {

  const [searchParams] = useSearchParams();

  const b = getMessages(locale).blog;



  if (totalPages <= 1) return null;



  const linkFor = (p: number) => {

    const params = new URLSearchParams(searchParams);

    if (p <= 1) params.delete("page");

    else params.set("page", String(p));

    const q = params.toString();

    return q ? `${basePath}?${q}` : basePath;

  };



  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(

    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,

  );



  return (

    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label={b.paginationAria}>

      {page > 1 ? (

        <Link to={linkFor(page - 1)} className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-sm font-semibold text-white/70 backdrop-blur-sm transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white/90">

          ← {b.previous}

        </Link>

      ) : null}

      {pages.map((p, i) => {

        const prev = pages[i - 1];

        const showEllipsis = prev !== undefined && p - prev > 1;

        return (

          <span key={p} className="flex items-center gap-2">

            {showEllipsis ? <span className="text-white/30">…</span> : null}

            <Link

              to={linkFor(p)}

              className={`min-w-[2.5rem] rounded-xl px-3 py-2 text-center text-sm font-semibold backdrop-blur-sm transition-all duration-200 ${

                p === page

                  ? "bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.35),0_4px_12px_rgba(236,72,153,0.25)]"

                  : "border border-white/[0.08] bg-white/[0.035] text-white/60 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white/90"

              }`}

              aria-current={p === page ? "page" : undefined}

            >

              {p}

            </Link>

          </span>

        );

      })}

      {page < totalPages ? (

        <Link to={linkFor(page + 1)} className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-sm font-semibold text-white/70 backdrop-blur-sm transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white/90">

          {b.next} →

        </Link>

      ) : null}

    </nav>

  );

}
