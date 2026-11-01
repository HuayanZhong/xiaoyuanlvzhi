import { flushPromises, type DOMWrapper } from "@vue/test-utils";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import { logoutStudent } from "~/utils/auth-api";
import { ApiError } from "~/utils/api";
import { getStudentProfile, type StudentProfile } from "~/utils/profile-api";
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
}));

const { navigateToMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
}));

mockNuxtImport("navigateTo", () => navigateToMock);

const profileMock = vi.mocked(getStudentProfile);
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

describe("me page", () => {
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

    expect(wrapper.findAll(".ui-ledger")).toHaveLength(2);
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
});
