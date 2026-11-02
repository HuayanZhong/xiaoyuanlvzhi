import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../app/utils/api";
import {
  listNotifications,
  loadNotificationSnapshot,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../../app/utils/notification-api";

const request = vi.hoisted(() => vi.fn());

vi.mock("~/composables/useApi", () => ({
  useApi: () => ({ request }),
}));

describe("notification api", () => {
  it("lists notifications and the unread count", async () => {
    const list = { items: [], unreadCount: 3 };
    request.mockResolvedValue(list);

    await expect(listNotifications()).resolves.toBe(list);
    expect(request).toHaveBeenCalledWith("notifications");
  });

  it("marks one notification as read", async () => {
    request.mockResolvedValue(null);

    await expect(markNotificationRead(12)).resolves.toBeNull();
    expect(request).toHaveBeenCalledWith("notifications/12/read", {
      method: "POST",
      expectData: false,
    });
  });

  it("marks all notifications as read", async () => {
    request.mockResolvedValue(null);

    await expect(markAllNotificationsRead()).resolves.toBeNull();
    expect(request).toHaveBeenCalledWith("notifications/read-all", {
      method: "POST",
      expectData: false,
    });
  });

  it("builds a snapshot with a readable error on failure", async () => {
    request.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );

    await expect(loadNotificationSnapshot()).resolves.toEqual({
      items: [],
      unreadCount: 0,
      errorMessage: "无法连接后端服务，请稍后重试",
    });
  });

  it("builds a snapshot from a successful response", async () => {
    const items = [
      {
        id: 1,
        title: "领养申请已通过",
        summary: "请按时领取",
        businessType: "ADOPTION",
        businessId: "12",
        readAt: null,
        createdAt: "2026-11-01T09:00:00",
      },
    ];
    request.mockResolvedValue({ items, unreadCount: 1 });

    await expect(loadNotificationSnapshot()).resolves.toEqual({
      items,
      unreadCount: 1,
      errorMessage: "",
    });
  });
});
