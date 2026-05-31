import axiosInstance from "@/lib/axios";

export function getNotificationsApi() {
  return axiosInstance.get("/notifications");
}

export function getUnreadNotificationsCountApi() {
  return axiosInstance.get("/notifications/unread-count");
}

export function markNotificationAsReadApi(notificationId: number) {
  return axiosInstance.put(`/notifications/${notificationId}/read`);
}

export function markAllNotificationsAsReadApi() {
  return axiosInstance.put("/notifications/read-all");
}
