import { Link } from "react-router-dom";
import type { BlogBlock } from "@/content/blog";
import { getH2SectionIcon } from "@/lib/blogMeta";
import { cn } from "@/lib/utils";
import { Lightbulb, ListChecks } from "lucide-react";

import type { AppLocale } from "@/i18n/config";
type Props = {
  blocks: BlogBlock[];
  locale: AppLocale;
};

export function BlogBlockRenderer({ blocks, locale }: Props) {
  const isFr = locale === "fr";

  return (
    <div className="pk-blog-prose mt-10 max-w-none space-y-6">
      {blocks.map((b, idx) => {
        if (b.type === "p") {
          return (
            <p key={idx} className="text-base leading-relaxed text-white/78">
              {b.text}
            </p>
          );
        }
        if (b.type === "h2") {
          const Icon = getH2SectionIcon(b.text);
          return (
            <h2
              key={idx}
              className="pk-blog-h2 mt-10 flex items-start gap-3 border-t border-white/[0.08] pt-8 text-xl font-bold tracking-tight text-white first:mt-0 first:border-t-0 first:pt-0"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-400/25">
                <Icon className="h-4 w-4 text-violet-200" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">{b.text}</span>
            </h2>
          );
        }
        if (b.type === "h3") {
          return (
            <h3 key={idx} className="text-lg font-semibold text-white/95">
              {b.text}
            </h3>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={idx} className="space-y-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              {b.items.map((it) => (
                <li key={it} className="flex gap-2.5 text-sm leading-relaxed text-white/75">
                  <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/80" aria-hidden />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === "callout") {
          return (
            <div
              key={idx}
              className={cn(
                "rounded-2xl border p-5",
                b.variant === "tip"
                  ? "border-amber-400/25 bg-amber-500/[0.08]"
                  : b.variant === "cta"
                    ? "border-violet-400/30 bg-violet-500/[0.1]"
                    : "border-cyan-400/20 bg-cyan-500/[0.06]",
              )}
            >
              <div className="flex gap-3">
                <Lightbulb className="h-5 w-5 shrink-0 text-amber-200/90" aria-hidden />
                <div>
                  {b.title ? <div className="text-sm font-bold text-white">{b.title}</div> : null}
                  <p className={cn("text-sm leading-relaxed text-white/75", b.title && "mt-1")}>{b.text}</p>
                </div>
              </div>
            </div>
          );
        }
        if (b.type === "links") {
          return (
            <div key={idx} className="flex flex-wrap gap-2">
              {b.items.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-500/20"
                >
                  {isFr ? link.labelFr : link.labelEn}
                </Link>
              ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
