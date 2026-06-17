import { create } from "zustand";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotification,
} from "@/lib/notifications";

type NotificationState = {
  items: UserNotification[];
  unreadCount: number;
  loading: boolean;
  open: boolean;
  refresh: () => Promise<void>;
  setOpen: (open: boolean) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,
  open: false,

  refresh: async () => {
    set({ loading: true });
    const result = await fetchNotifications(25);
    if (result) {
      set({ items: result.items, unreadCount: result.unreadCount, loading: false });
    } else {
      set({ loading: false });
    }
  },

  setOpen: (open) => {
    set({ open });
    if (open) void get().refresh();
  },

  markRead: async (id) => {
    const ok = await markNotificationRead(id);
    if (!ok) return;
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n)),
      unreadCount: Math.max(0, s.unreadCount - (s.items.find((n) => n.id === id && !n.read_at) ? 1 : 0)),
    }));
  },

  markAllRead: async () => {
    const ok = await markAllNotificationsRead();
    if (!ok) return;
    const now = new Date().toISOString();
    set((s) => ({
      items: s.items.map((n) => ({ ...n, read_at: n.read_at ?? now })),
      unreadCount: 0,
    }));
  },
}));
