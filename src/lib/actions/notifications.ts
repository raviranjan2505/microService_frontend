import axiosInstance from "@/lib/axiosInstance";

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  recipientKind: string;
  recipientValue: string;
  actorUserId: number | null;
  actorRole: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  isRead: boolean;
};

export async function listMyNotifications(limit = 50): Promise<NotificationItem[]> {
  try {
    const res = await axiosInstance.get("/v1/notification", { params: { limit } });
    return Array.isArray(res.data?.data) ? (res.data.data as NotificationItem[]) : [];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function getMyUnreadNotificationCount(): Promise<number> {
  try {
    const res = await axiosInstance.get("/v1/notification/unread-count");
    return Number(res.data?.data?.unread ?? 0);
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return 0;
  }
}

export async function markMyNotificationRead(notificationId: number) {
  try {
    const res = await axiosInstance.patch(`/v1/notification/${notificationId}/read`);
    return !!res.data?.success;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

export async function markAllMyNotificationsRead() {
  try {
    const res = await axiosInstance.patch("/v1/notification/read-all");
    return !!res.data?.success;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
}
