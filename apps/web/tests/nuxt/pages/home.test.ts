import { flushPromises } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { clearNuxtData } from "#app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import { loadNotificationSnapshot } from "~/utils/notification-api";
import { getStudentProfile, type StudentProfile } from "~/utils/profile-api";
import HomePage from "../../../app/pages/index.vue";

vi.mock("~/utils/profile-api", () => ({
  getStudentProfile: vi.fn(),
}));

vi.mock("~/utils/notification-api", () => ({
  loadNotificationSnapshot: vi.fn(),
}));

const profileMock = vi.mocked(getStudentProfile);
const notificationMock = vi.mocked(loadNotificationSnapshot);

function profile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    id: 2,
    email: "student@qq.com",
    role: "STUDENT",
    status: "ACTIVE",
    fullName: "张三",
    studentNumber: "20260001",
    department: "计算机学院",
    className: "软件工程 1 班",
    phone: "13800138000",
    pointsBalance: 120,
    activeAdoptionCount: 2,
    createdAt: "2026-10-01T09:00:00",
    updatedAt: "2026-10-01T09:00:00",
    ...overrides,
  };
}

describe("home page", () => {
  beforeEach(() => {
    notificationMock.mockReset();
    notificationMock.mockResolvedValue({
      items: [],
      unreadCount: 0,
      errorMessage: "",
    });
    clearNuxtData("notifications");
  });

  it("shows the student name, points and active plant count", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("你好，张三");
    expect(wrapper.text()).toContain("120");
    expect(wrapper.text()).toContain("2");
    expect(wrapper.get(".home-page__record").attributes("href")).toBe(
      "/my-plants",
    );
    expect(wrapper.get(".home-page__points-link").attributes("href")).toBe(
      "/points",
    );
  });

  it("explains an empty plant count instead of showing a bare zero", async () => {
    profileMock.mockResolvedValue(profile({ activeAdoptionCount: 0 }));
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("暂无在养绿植");
    expect(wrapper.get(".home-page__browse").attributes("href")).toBe(
      "/plants",
    );
  });

  it("falls back to the student number when the name is empty", async () => {
    profileMock.mockResolvedValue(profile({ fullName: null }));
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("你好，20260001");
  });

  it("shows a retryable error and recovers on retry", async () => {
    profileMock.mockRejectedValueOnce(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    profileMock.mockResolvedValueOnce(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("无法连接后端服务");

    await wrapper
      .findAll("button")
      .find((item) => item.text() === "重试")!
      .trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("你好，张三");
  });

  it("shows the unread notification count and links to notifications", async () => {
    profileMock.mockResolvedValue(profile());
    notificationMock.mockResolvedValue({
      items: [],
      unreadCount: 3,
      errorMessage: "",
    });
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("3 条未读");
    expect(wrapper.get(".home-page__message").attributes("href")).toBe(
      "/notifications",
    );
  });

  it("keeps the home summary when notifications fail", async () => {
    profileMock.mockResolvedValue(profile());
    notificationMock.mockResolvedValue({
      items: [],
      unreadCount: 0,
      errorMessage: "无法连接后端服务，请稍后重试",
    });
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("你好，张三");
    expect(wrapper.text()).toContain("消息暂时不可用");
  });

  it("explains when there are no unread notifications", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("暂无未读");
  });
});
