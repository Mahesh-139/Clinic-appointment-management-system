import React, { useEffect, useState } from "react";
import Card from "../../components/Card.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/notificationService.js";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let isMounted = true;
    getNotifications()
      .then((data) => {
        if (!isMounted) return;
        setNotifications(data || []);
        setStatus((data || []).length ? "success" : "empty");
      })
      .catch(() => isMounted && setStatus("empty"));
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleMarkRead(id) {
    await markNotificationRead(id);
    setNotifications((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true, is_read: true } : n))
    );
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((list) =>
      list.map((n) => ({ ...n, isRead: true, is_read: true }))
    );
  }

  const hasUnread = notifications.some((n) => !(n.is_read ?? n.isRead));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-medium text-clinic-700 hover:text-clinic-800 bg-clinic-50 hover:bg-clinic-100 border border-clinic-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {status === "loading" && <LoadingState />}
        {status === "empty" && (
          <EmptyState title="You're all caught up" description="No new notifications." />
        )}
        {status === "success" &&
          notifications.map((n) => {
            const isRead = n.is_read ?? n.isRead;
            const dateStr = n.created_at || n.createdAt;
            const formattedDate = dateStr
              ? new Date(dateStr).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—";

            return (
              <Card
                key={n.id}
                className={`flex items-start justify-between transition-opacity ${
                  isRead ? "opacity-60 bg-slate-50/50" : "border-l-4 border-l-clinic-600 shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>
                      {n.title}
                    </p>
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-clinic-600 inline-block"></span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <p className="mt-2 text-xs text-slate-400">{formattedDate}</p>
                </div>
                {!isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="text-xs font-medium text-clinic-700 hover:underline shrink-0 ml-4"
                  >
                    Mark read
                  </button>
                )}
              </Card>
            );
          })}
      </div>
    </div>
  );
}
