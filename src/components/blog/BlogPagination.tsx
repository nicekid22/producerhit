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

        <Link to={linkFor(page - 1)} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/5">

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

              className={`min-w-[2.5rem] rounded-xl px-3 py-2 text-center text-sm font-semibold ${

                p === page ? "bg-violet-600 text-white" : "border border-white/10 text-white/60 hover:bg-white/5"

              }`}

              aria-current={p === page ? "page" : undefined}

            >

              {p}

            </Link>

          </span>

        );

      })}

      {page < totalPages ? (

        <Link to={linkFor(page + 1)} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/5">

          {b.next} →

        </Link>

      ) : null}

    </nav>

  );

}

