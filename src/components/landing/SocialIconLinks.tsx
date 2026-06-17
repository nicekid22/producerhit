import { Instagram } from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import { PRODUCERHIT_SOCIALS } from "@/lib/socialLinks";
import { cn } from "@/lib/utils";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z" />
    </svg>
  );
}

type Props = {
  locale: AppLocale;
  size?: "sm" | "md";
  variant?: "default" | "footer";
  showHandles?: boolean;
  className?: string;
};

export function SocialIconLinks({ locale, size = "md", variant = "default", showHandles = false, className }: Props) {
  const isFr = locale === "fr";

  if (variant === "footer") {
    return (
      <div className={cn("pk-footer-social", className)}>
        {PRODUCERHIT_SOCIALS.map((s) => {
          const Icon = s.platform === "instagram" ? Instagram : TikTokIcon;
          return (
            <a
              key={s.platform}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "pk-footer-social__link",
                s.platform === "instagram" ? "pk-footer-social__link--ig" : "pk-footer-social__link--tt",
              )}
              aria-label={`${isFr ? s.labelFr : s.labelEn} ${s.handle}`}
              title={s.handle}
            >
              <Icon className="pk-footer-social__icon" />
            </a>
          );
        })}
      </div>
    );
  }

  const btn =
    size === "sm"
      ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/75 transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
      : "inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-white/80 transition-colors hover:border-[var(--prism-cyan)]/35 hover:bg-white/[0.08] hover:text-white";

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {PRODUCERHIT_SOCIALS.map((s) => {
        const Icon = s.platform === "instagram" ? Instagram : TikTokIcon;
        const iconCls = size === "sm" ? "h-4 w-4" : "h-5 w-5";
        return (
          <div key={s.platform} className="flex items-center gap-2">
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className={btn}
              aria-label={`${isFr ? s.labelFr : s.labelEn} ${s.handle}`}
            >
              <Icon className={iconCls} />
            </a>
            {showHandles ? (
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-white/65 transition-colors hover:text-[var(--prism-cyan)]"
              >
                {s.handle}
              </a>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
