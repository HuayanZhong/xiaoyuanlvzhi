import { flushPromises } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "~/utils/api";
import { getStudentProfile, type StudentProfile } from "~/utils/profile-api";
import HomePage from "../../../app/pages/index.vue";

vi.mock("~/utils/profile-api", () => ({
  getStudentProfile: vi.fn(),
}));

const profileMock = vi.mocked(getStudentProfile);

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
  it("shows the student name, points and active plant count", async () => {
    profileMock.mockResolvedValue(profile());
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("你好，张三");
    expect(wrapper.text()).toContain("120");
    expect(wrapper.text()).toContain("2");
  });

  it("explains an empty plant count instead of showing a bare zero", async () => {
    profileMock.mockResolvedValue(profile({ activeAdoptionCount: 0 }));
    const wrapper = await mountSuspended(HomePage);
    await flushPromises();

    expect(wrapper.text()).toContain("暂无在养绿植");
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
});
