import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { clearNuxtData } from "#app";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import {
  loadNotificationSnapshot,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
  type NotificationSnapshot,
} from "~/utils/notification-api";
import { clearNotificationCache } from "~/utils/notification-cache";
import { listParticipations } from "~/utils/task-api";
import NotificationsPage from "../../../app/pages/notifications.vue";

vi.mock("~/utils/notification-api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~/utils/notification-api")>();

  return {
    ...actual,
    loadNotificationSnapshot: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
  };
});

vi.mock("~/utils/notification-cache", () => ({
  clearNotificationCache: vi.fn(),
}));

vi.mock("~/utils/task-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/task-api")>();

  return { ...actual, listParticipations: vi.fn() };
});

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }));

mockNuxtImport("navigateTo", () => navigateToMock);

const snapshotMock = vi.mocked(loadNotificationSnapshot);
const readMock = vi.mocked(markNotificationRead);
const readAllMock = vi.mocked(markAllNotificationsRead);
const cacheMock = vi.mocked(clearNotificationCache);
const participationsMock = vi.mocked(listParticipations);
const mounted: Array<{ unmount: () => void }> = [];

function notice(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 1,
    title: "领养申请已通过",
    summary: "请按时到学生活动中心领取",
    businessType: "ADOPTION",
    businessId: "12",
    readAt: null,
    createdAt: "2026-11-01T09:00:00",
    ...overrides,
  };
}

function snapshot(overrides: Partial<NotificationSnapshot> = {}) {
  return {
    items: [] as NotificationItem[],
    unreadCount: 0,
    errorMessage: "",
    ...overrides,
  };
}

async function mountPage() {
  const wrapper = await mountSuspended(NotificationsPage, {
    route: "/notifications",
  });
  mounted.push(wrapper);

  return wrapper;
}

async function clickItem(
  wrapper: Awaited<ReturnType<typeof mountPage>>,
  index = 0,
) {
  await wrapper.findAll(".notices-page__item")[index]!.trigger("click");
  await flushPromises();
}

describe("notifications page", () => {
  beforeEach(() => {
    snapshotMock.mockReset();
    readMock.mockReset();
    readAllMock.mockReset();
    cacheMock.mockReset();
    participationsMock.mockReset();
    navigateToMock.mockReset();
    readMock.mockResolvedValue(null);
    readAllMock.mockResolvedValue(null);
    participationsMock.mockResolvedValue([]);
    clearNuxtData("notifications");
  });

  afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
      wrapper.unmount();
    }
  });

  it("lists notifications with the unread count", async () => {
    snapshotMock.mockResolvedValue(
      snapshot({ items: [notice()], unreadCount: 1 }),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("1 条未读");
    expect(wrapper.text()).toContain("领养申请");
    expect(wrapper.text()).toContain("领养申请已通过");
    expect(wrapper.text()).toContain("未读");
  });

  it("shows an empty state without notifications", async () => {
    snapshotMock.mockResolvedValue(snapshot());
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("暂无通知");
    expect(
      wrapper
        .findAll("button")
        .find((item) => item.text() === "全部标记已读")!
        .attributes("disabled"),
    ).toBeDefined();
  });

  it("shows a retryable error", async () => {
    snapshotMock.mockResolvedValue(
      snapshot({ errorMessage: "无法连接后端服务，请稍后重试" }),
    );
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("无法连接后端服务");

    snapshotMock.mockResolvedValue(
      snapshot({ items: [notice()], unreadCount: 1 }),
    );
    await wrapper
      .findAll("button")
      .find((item) => item.text() === "重试")!
      .trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("领养申请已通过");
  });

  it("marks an unread notice as read before opening it", async () => {
    snapshotMock
      .mockResolvedValueOnce(snapshot({ items: [notice()], unreadCount: 1 }))
      .mockResolvedValueOnce(
        snapshot({
          items: [notice({ readAt: "2026-11-02T09:00:00" })],
          unreadCount: 0,
        }),
      );
    const wrapper = await mountPage();
    await flushPromises();

    await clickItem(wrapper);

    expect(readMock).toHaveBeenCalledWith(1);
    expect(cacheMock).toHaveBeenCalled();
    expect(navigateToMock).toHaveBeenCalledWith("/adoptions/12");
    expect(wrapper.text()).toContain("暂无未读");
    expect(wrapper.text()).toContain("已读");
  });

  it("stays on the list when marking read fails", async () => {
    snapshotMock.mockResolvedValue(
      snapshot({ items: [notice()], unreadCount: 1 }),
    );
    readMock.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    const wrapper = await mountPage();
    await flushPromises();

    await clickItem(wrapper);

    expect(wrapper.text()).toContain("无法连接后端服务");
    expect(navigateToMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("未读");
    expect(cacheMock).not.toHaveBeenCalled();
  });

  it("opens an already read notice without another request", async () => {
    snapshotMock.mockResolvedValue(
      snapshot({
        items: [notice({ readAt: "2026-11-02T09:00:00" })],
        unreadCount: 0,
      }),
    );
    const wrapper = await mountPage();
    await flushPromises();

    await clickItem(wrapper);

    expect(readMock).not.toHaveBeenCalled();
    expect(navigateToMock).toHaveBeenCalledWith("/adoptions/12");
  });

  it("marks all notifications as read", async () => {
    snapshotMock
      .mockResolvedValueOnce(
        snapshot({
          items: [notice(), notice({ id: 2, title: "养护打卡已通过" })],
          unreadCount: 2,
        }),
      )
      .mockResolvedValueOnce(
        snapshot({
          items: [
            notice({ readAt: "2026-11-02T09:00:00" }),
            notice({
              id: 2,
              title: "养护打卡已通过",
              readAt: "2026-11-02T09:00:00",
            }),
          ],
          unreadCount: 0,
        }),
      );
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper
      .findAll("button")
      .find((item) => item.text() === "全部标记已读")!
      .trigger("click");
    await flushPromises();

    expect(readAllMock).toHaveBeenCalled();
    expect(cacheMock).toHaveBeenCalled();
    expect(wrapper.text()).toContain("暂无未读");
    expect(
      wrapper.findAll(".ui-status-chip").map((chip) => chip.text()),
    ).toEqual(["已读", "已读"]);
  });

  it("resolves a task notice to its task detail", async () => {
    snapshotMock.mockResolvedValue(
      snapshot({
        items: [notice({ businessType: "TASK", businessId: "34" })],
        unreadCount: 1,
      }),
    );
    participationsMock.mockResolvedValue([
      {
        id: 34,
        taskId: 7,
        taskTitle: "垃圾分类宣传",
        studentId: 2,
        studentEmail: "student@qq.com",
        status: "PENDING_REVIEW",
        joinedAt: "2026-11-01T09:00:00",
        submissions: [],
      },
    ]);
    const wrapper = await mountPage();
    await flushPromises();

    await clickItem(wrapper);

    expect(participationsMock).toHaveBeenCalled();
    expect(navigateToMock).toHaveBeenCalledWith("/tasks/7");
  });

  it("falls back to the task list when the participation is missing", async () => {
    snapshotMock.mockResolvedValue(
      snapshot({
        items: [notice({ businessType: "TASK", businessId: "34" })],
        unreadCount: 1,
      }),
    );
    const wrapper = await mountPage();
    await flushPromises();

    await clickItem(wrapper);

    expect(navigateToMock).toHaveBeenCalledWith("/tasks");
  });

  it("only marks an unknown business type as read", async () => {
    snapshotMock
      .mockResolvedValueOnce(
        snapshot({
          items: [notice({ businessType: "UNKNOWN", businessId: "9" })],
          unreadCount: 1,
        }),
      )
      .mockResolvedValueOnce(
        snapshot({
          items: [
            notice({
              businessType: "UNKNOWN",
              businessId: "9",
              readAt: "2026-11-02T09:00:00",
            }),
          ],
          unreadCount: 0,
        }),
      );
    const wrapper = await mountPage();
    await flushPromises();

    await clickItem(wrapper);

    expect(readMock).toHaveBeenCalledWith(1);
    expect(navigateToMock).not.toHaveBeenCalled();
  });
});
