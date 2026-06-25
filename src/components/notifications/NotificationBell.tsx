import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/config";
import { SIDEBAR_ICON_CLASS, SIDEBAR_ICON_PROPS } from "@/lib/sidebarIcons";

type Props = {
  locale: AppLocale;
  className?: string;
};

type PanelRect = {
  top: number;
  left: number;
  width: number;
};

function computePanelRect(trigger: HTMLElement): PanelRect {
  const rect = trigger.getBoundingClientRect();
  const gap = 10;
  const width = Math.min(360, window.innerWidth * 0.92);
  const padding = 12;
  const panelHeightEstimate = 420;

  if (window.innerWidth < 768) {
    const topAbove = rect.top - panelHeightEstimate - 6;
    const top =
      topAbove >= padding
        ? topAbove
        : Math.min(rect.bottom + 6, window.innerHeight - panelHeightEstimate - padding);
    const left = Math.max(padding, Math.min(rect.right - width, window.innerWidth - width - padding));
    return { top, left, width };
  }

  const left = rect.right + gap;
  const maxTop = Math.max(padding, window.innerHeight - panelHeightEstimate - padding);
  const idealTop = rect.top + rect.height / 2 - panelHeightEstimate / 2;
  const top = Math.min(Math.max(padding, idealTop), maxTop);

  if (left + width > window.innerWidth - padding) {
    return {
      top: Math.min(rect.bottom + 6, window.innerHeight - panelHeightEstimate - padding),
      left: Math.max(padding, rect.right - width),
      width,
    };
  }

  return { top, left, width };
}

export function NotificationBell({ locale, className }: Props) {
  const triggerId = useId();
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const open = useNotificationStore((s) => s.open);
  const activeTriggerId = useNotificationStore((s) => s.activeTriggerId);
  const setOpen = useNotificationStore((s) => s.setOpen);
  const refresh = useNotificationStore((s) => s.refresh);
  const isFr = locale === "fr";
  const isPanelOwner = open && activeTriggerId === triggerId;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelRect, setPanelRect] = useState<PanelRect | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), 120_000);
    return () => window.clearInterval(timer);
  }, [refresh, user?.id]);

  useLayoutEffect(() => {
    if (!isPanelOwner || !triggerRef.current) {
      setPanelRect(null);
      return;
    }

    const update = () => {
      if (!triggerRef.current) return;
      setPanelRect(computePanelRect(triggerRef.current));
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
  }, [isPanelOwner]);

  useEffect(() => {
    if (!isPanelOwner) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
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
  }, [isPanelOwner, setOpen]);

  if (!user) return null;

  const panel =
    isPanelOwner && panelRect
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[1190] bg-black/40"
              aria-label={isFr ? "Fermer" : "Close"}
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              className="pk-notification-panel fixed z-[1200] overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]/95 shadow-2xl backdrop-blur-xl"
              style={{
                top: panelRect.top,
                left: panelRect.left,
                width: panelRect.width,
              }}
            >
              <NotificationPanelBody locale={locale} onClose={() => setOpen(false)} />
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        className={cn("pk-sidebar-ctrl-btn pk-notification-bell", isPanelOwner && "pk-sidebar-ctrl-btn--open")}
        aria-label={isFr ? "Notifications" : "Notifications"}
        aria-expanded={isPanelOwner}
        onClick={() => {
          if (isPanelOwner) setOpen(false);
          else setOpen(true, triggerId);
        }}
      >
        <Bell className={SIDEBAR_ICON_CLASS} {...SIDEBAR_ICON_PROPS} />
        {unreadCount > 0 ? (
          <span className="pk-notification-bell__badge absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
      {panel}
    </div>
  );
}

function NotificationPanelBody({ locale, onClose }: { locale: AppLocale; onClose: () => void }) {
  const navigate = useNavigate();
  const items = useNotificationStore((s) => s.items);
  const loading = useNotificationStore((s) => s.loading);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const isFr = locale === "fr";

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-sm font-semibold text-white">{isFr ? "Notifications" : "Notifications"}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            title={isFr ? "Tout marquer lu" : "Mark all read"}
            onClick={() => void markAllRead()}
          >
            <CheckCheck className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="max-h-[min(60vh,420px)] overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-white/50">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-white/50">
              {isFr ? "Aucune notification pour l'instant." : "No notifications yet."}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/35">
              {isFr
                ? "Parrainages, bonus et alertes studio apparaîtront ici."
                : "Referrals, bonuses, and studio alerts will show up here."}
            </p>
            <button
              type="button"
              className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
              onClick={() => {
                onClose();
                navigate("/dashboard");
              }}
            >
              {isFr ? "Ouvrir le studio" : "Open studio"}
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={cn(
                    "pk-notification-item w-full px-4 py-3 text-left transition hover:bg-white/5",
                    !n.read_at && "pk-notification-item--unread",
                  )}
                  onClick={() => {
                    void markRead(n.id);
                    if (n.href) {
                      onClose();
                      navigate(n.href);
                    }
                  }}
                >
                  <div className="text-sm font-semibold text-white">{n.title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-white/65">{n.body}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
