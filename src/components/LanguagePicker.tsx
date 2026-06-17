import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LOCALE_LABELS,
  LOCALE_SHORT,
  UI_LOCALES,
  type AppLocale,
} from "@/i18n/config";
import { SIDEBAR_ICON_CLASS, SIDEBAR_ICON_PROPS } from "@/lib/sidebarIcons";
import { useLocaleStore } from "@/stores/localeStore";
import { useVisualThemeStore } from "@/stores/visualThemeStore";

type Props = {
  variant?: "nav" | "sidebar" | "mobile" | "icon";
  className?: string;
  onChange?: () => void;
};

type MenuRect = {
  top: number;
  left: number;
  minWidth: number;
};

function computeSidebarMenuRect(trigger: HTMLElement, menuHeight: number): MenuRect {
  const rect = trigger.getBoundingClientRect();
  const gap = 10;
  const minWidth = 176;
  const left = rect.right + gap;
  const padding = 12;
  const maxTop = Math.max(padding, window.innerHeight - menuHeight - padding);
  const idealTop = rect.top + rect.height / 2 - menuHeight / 2;
  const top = Math.min(Math.max(padding, idealTop), maxTop);
  return { top, left, minWidth };
}

function estimateMenuHeight(): number {
  return UI_LOCALES.length * 38 + 20;
}

function computeNavMenuRect(trigger: HTMLElement, variant: "nav" | "mobile"): MenuRect {
  const rect = trigger.getBoundingClientRect();
  if (variant === "mobile") {
    return { top: rect.bottom + 6, left: rect.left, minWidth: rect.width };
  }
  return { top: rect.bottom + 6, left: Math.max(12, rect.right - 176), minWidth: 176 };
}

export function LanguagePicker({ variant = "nav", className = "", onChange }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const theme = useVisualThemeStore((s) => s.theme);
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isSidebarLike = variant === "sidebar" || variant === "icon";
  const useFixedMenu = isSidebarLike || variant === "nav" || variant === "mobile";

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuRect(null);
      return;
    }

    const update = () => {
      if (!triggerRef.current) return;
      const menuHeight = menuRef.current?.offsetHeight ?? estimateMenuHeight();
      if (isSidebarLike) {
        setMenuRect(computeSidebarMenuRect(triggerRef.current, menuHeight));
        return;
      }
      setMenuRect(computeNavMenuRect(triggerRef.current, variant === "mobile" ? "mobile" : "nav"));
    };

    update();
    const raf = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, isSidebarLike, variant, locale]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (next: AppLocale) => {
    setLocale(next);
    setOpen(false);
    onChange?.();
  };

  const resolvedMenuRect = (() => {
    if (!open || !useFixedMenu || !triggerRef.current) return null;
    const menuHeight = menuRef.current?.offsetHeight ?? estimateMenuHeight();
    if (menuRect) return menuRect;
    if (isSidebarLike) {
      return computeSidebarMenuRect(triggerRef.current, menuHeight);
    }
    return computeNavMenuRect(triggerRef.current, variant === "mobile" ? "mobile" : "nav");
  })();

  const menuList = (
    <ul
      ref={menuRef}
      role="listbox"
      aria-label="Language"
      className="pk-language-menu"
      style={
        resolvedMenuRect
          ? {
              position: "fixed",
              top: resolvedMenuRect.top,
              left: resolvedMenuRect.left,
              minWidth: resolvedMenuRect.minWidth,
              maxHeight: Math.min(window.innerHeight - resolvedMenuRect.top - 12, 320),
              zIndex: 1200,
            }
          : undefined
      }
    >
      {UI_LOCALES.map((code) => (
        <li key={code} role="option" aria-selected={locale === code}>
          <button
            type="button"
            className={cn("pk-language-menu__item", locale === code && "pk-language-menu__item--active")}
            onClick={() => pick(code)}
          >
            <span className="pk-language-menu__name">{LOCALE_LABELS[code]}</span>
            <span className="pk-language-menu__code">{LOCALE_SHORT[code]}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  const menu =
    open && useFixedMenu && resolvedMenuRect
      ? createPortal(menuList, document.body)
      : open
        ? menuList
        : null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "pk-language-btn",
          `pk-language-btn--${variant}`,
          (variant === "nav" || variant === "icon") && "pk-header-chrome__pill",
          variant === "icon" && "pk-header-chrome__pill--icon",
          theme === "warm-glass" && "pk-language-btn--warm",
          theme === "cloud" && "pk-language-btn--cloud",
          open && "pk-language-btn--open",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={LOCALE_LABELS[locale]}
        title={LOCALE_LABELS[locale]}
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next && triggerRef.current) {
              const menuHeight = estimateMenuHeight();
              setMenuRect(
                isSidebarLike
                  ? computeSidebarMenuRect(triggerRef.current, menuHeight)
                  : computeNavMenuRect(triggerRef.current, variant === "mobile" ? "mobile" : "nav"),
              );
            } else if (!next) {
              setMenuRect(null);
            }
            return next;
          });
        }}
      >
        <Globe className={cn(SIDEBAR_ICON_CLASS, "pk-language-btn__icon")} {...SIDEBAR_ICON_PROPS} aria-hidden />
        {isSidebarLike ? (
          <span className="pk-language-btn__code" aria-hidden>
            {LOCALE_SHORT[locale]}
          </span>
        ) : (
          <span className="pk-language-btn__label">{LOCALE_SHORT[locale]}</span>
        )}
      </button>

      {menu}
    </div>
  );
}
