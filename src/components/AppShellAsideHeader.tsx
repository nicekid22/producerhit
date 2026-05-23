import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/landing/BrandLogo";

export function AppShellAsideHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  stats,
  avatarInitials,
  children,
}: {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  stats?: { label: string; value: string | number }[];
  avatarInitials?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-white/10 px-4 pb-3 pt-4">
        <BrandLogo compact />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-start gap-3">
          {avatarInitials ? (
            <div className="pk-prism-aside-avatar shrink-0" aria-hidden>
              {avatarInitials.slice(0, 2).toUpperCase()}
            </div>
          ) : Icon ? (
            <div className="pk-prism-aside-icon shrink-0">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? <div className="pk-prism-eyebrow">{eyebrow}</div> : null}
            <div className="mt-1 text-base font-semibold tracking-tight text-white">{title}</div>
            {subtitle ? <div className="mt-1.5 text-sm leading-relaxed text-pk-muted">{subtitle}</div> : null}
          </div>
        </div>

        {stats?.length ? (
          <div className="mt-5 grid grid-cols-2 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="pk-prism-aside-stat">
                <div className="pk-prism-aside-stat__value">{s.value}</div>
                <div className="pk-prism-aside-stat__label">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}

        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </div>
  );
}
