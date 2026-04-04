"use client";

import { Bell, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getMyUnreadNotificationCount,
  listMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
  type NotificationItem,
} from "@/lib/actions/notifications";

function formatTimestamp(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function AccountNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    const [items, unread] = await Promise.all([
      listMyNotifications(),
      getMyUnreadNotificationCount(),
    ]);
    setNotifications(items);
    setUnreadCount(unread);
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const openNotification = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markMyNotificationRead(notification.id);
      setNotifications((current) =>
        current?.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        ) ?? current
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
            <p className="mt-1 text-sm text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "All caught up"}
            </p>
          </div>
          <button
            type="button"
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            disabled={markingAll || unreadCount === 0}
            onClick={async () => {
              setMarkingAll(true);
              const ok = await markAllMyNotificationsRead();
              if (ok) {
                setNotifications((current) => current?.map((item) => ({ ...item, isRead: true })) ?? current);
                setUnreadCount(0);
              }
              setMarkingAll(false);
            }}
          >
            {markingAll ? "Marking..." : "Mark All Read"}
          </button>
        </div>
      </div>

      {notifications === null ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Bell className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-3 text-sm text-gray-600">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => void openNotification(notification)}
              className={`w-full rounded-lg border p-4 text-left transition hover:shadow-sm ${
                notification.isRead ? "border-gray-200 bg-white" : "border-green-200 bg-green-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{notification.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  <p className="mt-2 text-xs text-gray-500">{formatTimestamp(notification.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.isRead && <span className="h-2.5 w-2.5 rounded-full bg-green-600" />}
                  {notification.link && <ExternalLink className="h-4 w-4 text-gray-400" />}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
