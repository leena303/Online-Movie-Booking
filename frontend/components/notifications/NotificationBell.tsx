"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { NotificationItem, notificationService } from "@/services/notification";

type Props = {
  token?: string | null;
};

function formatTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell({ token }: Props) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  async function fetchNotifications() {
    if (!token) return;

    try {
      setLoading(true);
      const [items, count] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);

      setNotifications(items);
      setUnreadCount(count);
    } catch (error) {
      console.error("Fetch notifications error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    const timer = window.setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [token]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((prev) => !prev);

    if (!open) {
      await fetchNotifications();
    }
  }

  async function handleNotificationClick(item: NotificationItem) {
    try {
      if (!item.is_read) {
        await notificationService.markAsRead(item.id);
      }

      setOpen(false);
      await fetchNotifications();
      router.push("/profile/bookings");
    } catch (error) {
      console.error("Mark notification read error:", error);
    }
  }

  async function handleReadAll() {
    try {
      await notificationService.markAllAsRead();
      await fetchNotifications();
    } catch (error) {
      console.error("Mark all read error:", error);
    }
  }

  if (!token) return null;

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        type="button"
        className="btn btn-light position-relative rounded-circle"
        onClick={handleOpen}
        aria-label="Thông báo"
        style={{ width: 42, height: 42 }}
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="position-absolute end-0 mt-2 bg-white border rounded-4 shadow overflow-hidden"
          style={{
            width: 340,
            zIndex: 1050,
          }}
        >
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
            <strong>Thông báo</strong>

            <button
              type="button"
              className="btn btn-sm btn-link text-decoration-none"
              onClick={handleReadAll}
              disabled={unreadCount === 0}
            >
              Đã đọc tất cả
            </button>
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {loading ? (
              <div className="p-3 text-muted small">Đang tải thông báo...</div>
            ) : notifications.length === 0 ? (
              <div className="p-3 text-muted small">Chưa có thông báo nào.</div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`w-100 text-start border-0 border-bottom px-3 py-3 ${
                    item.is_read ? "bg-white" : "bg-light"
                  }`}
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className="d-flex justify-content-between gap-2">
                    <strong className="small">{item.title}</strong>
                    {!item.is_read && (
                      <span className="badge bg-danger rounded-pill">Mới</span>
                    )}
                  </div>

                  <div className="small text-muted mt-1">{item.message}</div>

                  <div className="small text-secondary mt-2">
                    {formatTime(item.created_at)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
