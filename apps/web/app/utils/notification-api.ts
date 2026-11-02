import { useApi } from "~/composables/useApi";
import { resolveRequestError } from "./auth-errors";

/** 一条站内通知；`businessId` 指向对应业务记录。 */
export type NotificationItem = {
  id: number;
  title: string;
  summary: string | null;
  businessType: string;
  businessId: string | null;
  readAt: string | null;
  createdAt: string;
};

/** 通知列表与未读数，三个入口共用同一响应。 */
export type NotificationList = {
  items: NotificationItem[];
  unreadCount: number;
};

/** 当前学生的全部通知，服务端按创建时间倒序返回。 */
export function listNotifications() {
  return useApi().request<NotificationList>("notifications");
}

/** 标记单条通知已读；只能操作当前账号自己的通知。 */
export function markNotificationRead(id: number | string) {
  return useApi().request<null>(`notifications/${id}/read`, {
    method: "POST",
    expectData: false,
  });
}

/** 把当前账号的全部未读通知标记为已读。 */
export function markAllNotificationsRead() {
  return useApi().request<null>("notifications/read-all", {
    method: "POST",
    expectData: false,
  });
}

/** 页面统一的容错结果：失败时保留空列表和可读原因，未读数不冒充 0。 */
export type NotificationSnapshot = {
  items: NotificationItem[];
  unreadCount: number;
  errorMessage: string;
};

export async function loadNotificationSnapshot(): Promise<NotificationSnapshot> {
  try {
    const list = await listNotifications();

    return {
      items: list.items,
      unreadCount: list.unreadCount,
      errorMessage: "",
    };
  } catch (error) {
    return {
      items: [],
      unreadCount: 0,
      errorMessage: resolveRequestError(error),
    };
  }
}
