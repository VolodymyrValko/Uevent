import { create } from 'zustand';
import { Notification } from '../types';
import { notificationsService } from '../services';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;
  fetchAll: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchUnreadCount: async () => {
    try {
      const count = await notificationsService.getUnreadCount();
      set({ unreadCount: count });
    } catch {

    }
  },

  fetchAll: async () => {
    try {
      const result = await notificationsService.getAll();
      set({ notifications: result.items, unreadCount: result.items.filter((n) => !n.isRead).length });
    } catch {

    }
  },

  markRead: async (id) => {
    await notificationsService.markRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await notificationsService.markAllRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  remove: async (id) => {
    await notificationsService.delete(id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
