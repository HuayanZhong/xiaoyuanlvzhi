import { flushPromises, type DOMWrapper } from "@vue/test-utils";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { clearNuxtData } from "#app";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { logoutStudent } from "~/utils/auth-api";
import { ApiError } from "~/utils/api";
import { loadNotificationSnapshot } from "~/utils/notification-api";
import { clearHomeProfileCache } from "~/utils/profile-cache";
import {
  getStudentProfile,
  updateStudentProfile,
  type StudentProfile,
} from "~/utils/profile-api";
import MePage from "../../../app/pages/me.vue";

vi.mock("~/utils/auth-api", () => ({
  loginWithEmail: vi.fn(),
  registerStudent: vi.fn(),
  getCurrentAccount: vi.fn(),
  logoutStudent: vi.fn(),
  sendRegistrationCode: vi.fn(),
}));

vi.mock("~/utils/profile-api", () => ({
  getStudentProfile: vi.fn(),
  updateStudentProfile: vi.fn(),
}));

vi.mock("~/utils/notification-api", () => ({
  loadNotificationSnapshot: vi.fn(),
}));

vi.mock("~/utils/profile-cache", () => ({
  clearHomeProfileCache: vi.fn(),
}));

const { navigateToMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
}));

mockNuxtImport("navigateTo", () => navigateToMock);

const profileMock = vi.mocked(getStudentProfile);
const updateMock = vi.mocked(updateStudentProfile);
const notificationMock = vi.mocked(loadNotificationSnapshot);
const cacheMock = vi.mocked(clearHomeProfileCache);
const logoutMock = vi.mocked(logoutStudent);

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

async function openConfirm(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
) {
  const button = wrapper
    .findAll("button")
    .find((item: DOMWrapper<Element>) => item.text() === "退出登录");

  await button!.trigger("click");
  await flushPromises();
}

async function confirmLogout(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
) {
  const button = wrapper
    .findAll("button")
    .find((item: DOMWrapper<Element>) => item.text() === "退出");

  await button!.trigger("click");
  await flushPromises();
}

async function openEdit(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  const button = wrapper
    .findAll("button")
    .find((item: DOMWrapper<Element>) => item.text() === "修改手机号与班级");

  await button!.trigger("click");
  await flushPromises();
}

async function fillEdit(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
  phone: string,
  className: string,
) {
  await wrapper.get("#profile-phone").setValue(phone);
  await wrapper.get("#profile-class").setValue(className);
}

async function submitEdit(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  await wrapper.get(".me-page__edit").trigger("submit");
  await flushPromises();
}

describe("me page", () => {
  beforeEach(() => {
    updateMock.mockReset();
    notificationMock.mockReset();
    cacheMock.mockReset();
    notificationMock.mockResolvedValue({
      items: [],
      unreadCount: 0,
      errorMessage: "",
    });
    clearNuxtData();
  });

  it("shows the full profile", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(MePage);
    await flushPromises();

    for (const value of [
      "张三",
      "20260001",
      "计算机学院",
      "软件工程 1 班",
      "13800138000",
      "student@qq.com",
      "120",
    ]) {
      expect(wrapper.text()).toContain(value);
    }

    expect(wrapper.findAll(".ui-ledger")).toHaveLength(3);
    expect(wrapper.get(".me-page__care-link").attributes("href")).toBe(
      "/my-plants",
    );
    expect(
      wrapper.findAll("a").map((item) => item.attributes("href")),
    ).toContain("/points");
  });

  it("uses a placeholder for empty optional fields", async () => {
    profileMock.mockResolvedValue(profile({ className: null, phone: null }));
    const wrapper = await mountSuspended(MePage);
    await flushPromises();

    expect(wrapper.text()).toContain("未填写");
  });

  it("logs out after confirmation and returns to the login page", async () => {
    profileMock.mockResolvedValue(profile());
    logoutMock.mockResolvedValue(null);
    const wrapper = await mountSuspended(MePage);
    await flushPromises();

    await openConfirm(wrapper);
    expect(wrapper.text()).toContain("退出后需要重新登录才能查看个人资料");

    await confirmLogout(wrapper);

    expect(logoutMock).toHaveBeenCalled();
    expect(navigateToMock).toHaveBeenCalledWith("/login");
  });

  it("warns when the server token could not be revoked", async () => {
    profileMock.mockResolvedValue(profile());
    logoutMock.mockRejectedValue(
      new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试"),
    );
    const wrapper = await mountSuspended(MePage);
    await flushPromises();

    await openConfirm(wrapper);
    await confirmLogout(wrapper);

    expect(navigateToMock).toHaveBeenCalledWith({
      path: "/login",
      query: { notice: "revoke-failed" },
    });
  });

  it("links to notifications with the unread count and to feedback", async () => {
    profileMock.mockResolvedValue(profile());
    notificationMock.mockResolvedValue({
      items: [],
      unreadCount: 2,
      errorMessage: "",
    });
    const wrapper = await mountSuspended(MePage);
    await flushPromises();

    const links = wrapper.findAll("a").map((item) => item.attributes("href"));

    expect(links).toContain("/notifications");
    expect(links).toContain("/feedback");
    expect(wrapper.text()).toContain("2 条未读");
  });

  it("keeps the profile visible when notifications fail", async () => {
    profileMock.mockResolvedValue(profile());
    notificationMock.mockResolvedValue({
      items: [],
      unreadCount: 0,
      errorMessage: "无法连接后端服务，请稍后重试",
    });
    const wrapper = await mountSuspended(MePage);
    await flushPromises();

    expect(wrapper.text()).toContain("张三");
    expect(wrapper.text()).toContain("暂时不可用");
  });

  it("updates the phone and class and clears profile caches", async () => {
    profileMock.mockResolvedValue(profile());
    updateMock.mockResolvedValue(
      profile({ phone: "13900139000", className: "软件工程 2 班" }),
    );
    const wrapper = await mountSuspended(MePage);
    await flushPromises();

    await openEdit(wrapper);
    await fillEdit(wrapper, "13900139000", "软件工程 2 班");
    await submitEdit(wrapper);

    expect(updateMock).toHaveBeenCalledWith({
      phone: "13900139000",
      className: "软件工程 2 班",
    });
    expect(wrapper.text()).toContain("13900139000");
    expect(wrapper.text()).toContain("软件工程 2 班");
    expect(wrapper.text()).toContain("资料已更新");
    expect(cacheMock).toHaveBeenCalled();
  });

  it("keeps the edit form when the phone is already used", async () => {
    profileMock.mockResolvedValue(profile());
    updateMock.mockRejectedValue(
      new ApiError("PHONE_ALREADY_USED", "该手机号已关联其他账号", 409),
    );
    const wrapper = await mountSuspended(MePage);
    await flushPromises();

    await openEdit(wrapper);
    await fillEdit(wrapper, "13900139000", "软件工程 1 班");
    await submitEdit(wrapper);

    expect(wrapper.text()).toContain("该手机号已关联其他账号");
    expect(wrapper.find(".me-page__edit").exists()).toBe(true);
    expect(cacheMock).not.toHaveBeenCalled();
  });

  it("clears the class when it is submitted empty", async () => {
    profileMock.mockResolvedValue(profile());
    updateMock.mockResolvedValue(profile({ className: null }));
    const wrapper = await mountSuspended(MePage);
    await flushPromises();

    await openEdit(wrapper);
    await fillEdit(wrapper, "13800138000", "");
    await submitEdit(wrapper);

    expect(updateMock).toHaveBeenCalledWith({
      phone: "13800138000",
      className: "",
    });
    expect(wrapper.text()).toContain("未填写");
  });

  it("rejects an empty phone before sending the request", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(MePage);
    await flushPromises();

    await openEdit(wrapper);
    await fillEdit(wrapper, "", "软件工程 1 班");
    await submitEdit(wrapper);

    expect(updateMock).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("请填写手机号");
  });
});
