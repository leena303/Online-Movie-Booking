import {
  getNotificationsApi,
  getUnreadNotificationsCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
} from "@/lib/api/notifications";

export type NotificationItem = {
  id: number;
  user_id: number;
  booking_id: number | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

function toArray<T>(res: { data: unknown }): T[] {
  const raw = (res.data as Record<string, unknown>)?.data ?? res.data;
  return Array.isArray(raw) ? (raw as T[]) : [];
}

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await getNotificationsApi();
    return toArray<NotificationItem>(res);
  },

  async getUnreadCount(): Promise<number> {
    const res = await getUnreadNotificationsCountApi();
    const raw = res.data as { data?: { count?: number } };
    return Number(raw?.data?.count || 0);
  },

  async markAsRead(notificationId: number) {
    const res = await markNotificationAsReadApi(notificationId);
    return res.data;
  },

  async markAllAsRead() {
    const res = await markAllNotificationsAsReadApi();
    return res.data;
  },
};
