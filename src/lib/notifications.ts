import { supabase } from "@/lib/supabaseClient";

export type UserNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationListResult = {
  items: UserNotification[];
  unreadCount: number;
};

function parseList(data: unknown): NotificationListResult | null {
  const row = data as { ok?: boolean; items?: unknown; unread_count?: number } | null;
  if (!row?.ok || !Array.isArray(row.items)) return null;
  const items = row.items
    .map((raw) => {
      const n = raw as Record<string, unknown>;
      if (typeof n.id !== "string") return null;
      return {
        id: n.id,
        kind: typeof n.kind === "string" ? n.kind : "info",
        title: typeof n.title === "string" ? n.title : "",
        body: typeof n.body === "string" ? n.body : "",
        href: typeof n.href === "string" ? n.href : null,
        read_at: typeof n.read_at === "string" ? n.read_at : null,
        created_at: typeof n.created_at === "string" ? n.created_at : new Date().toISOString(),
      } satisfies UserNotification;
    })
    .filter((n): n is UserNotification => n !== null);
  return { items, unreadCount: typeof row.unread_count === "number" ? row.unread_count : 0 };
}

export async function fetchNotifications(limit = 20): Promise<NotificationListResult | null> {
  try {
    const { data, error } = await supabase.rpc("list_user_notifications", { p_limit: limit });
    if (error) return null;
    return parseList(data);
  } catch {
    return null;
  }
}

export async function markNotificationRead(id: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("mark_notification_read", { p_id: id });
    if (error) return false;
    return Boolean((data as { ok?: boolean } | null)?.ok);
  } catch {
    return false;
  }
}

export async function markAllNotificationsRead(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("mark_all_notifications_read");
    if (error) return false;
    return Boolean((data as { ok?: boolean } | null)?.ok);
  } catch {
    return false;
  }
}

/** Idempotent welcome row so the bell is never empty on first login. */
export async function ensureWelcomeNotification(locale: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("ensure_welcome_notification", {
      p_locale: locale === "fr" ? "fr" : "en",
    });
    if (error) return false;
    return Boolean((data as { ok?: boolean } | null)?.ok);
  } catch {
    return false;
  }
}
