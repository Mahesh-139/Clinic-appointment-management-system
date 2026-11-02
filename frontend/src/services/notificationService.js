import api from "./api";

export async function getNotifications() {
  const { data } = await api.get("/notifications/me");
  return data;
}

export async function markNotificationRead(notificationId) {
  const { data } = await api.patch(`/notifications/${notificationId}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch("/notifications/mark-all-read");
  return data;
}
