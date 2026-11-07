import { flushPromises } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import App from "../../app/app.vue";

const { authState } = vi.hoisted(() => ({
  authState: { authenticated: false },
}));

vi.mock("~/composables/useAuth", async () => {
  const { computed, ref } = await import("vue");

  return {
    useAuth: () => ({
      status: ref(authState.authenticated ? "authenticated" : "anonymous"),
      account: ref(null),
      isAuthenticated: computed(() => authState.authenticated),
      restore: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      clear: vi.fn(),
    }),
    clearAuth: vi.fn(),
    resetAuthForTests: vi.fn(),
  };
});

vi.mock("~/utils/profile-api", () => ({
  getStudentProfile: vi.fn().mockResolvedValue({
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
  }),
}));

describe("App", () => {
  it("renders the auth layout for public authentication pages", async () => {
    authState.authenticated = false;
    const wrapper = await mountSuspended(App, { route: "/login" });
    await flushPromises();

    expect(wrapper.find(".auth-layout").exists()).toBe(true);
    expect(wrapper.find(".app-shell").exists()).toBe(false);
    expect(wrapper.text()).toContain("登录");
  });

  it("renders the default shell and home page for a student", async () => {
    authState.authenticated = true;
    const wrapper = await mountSuspended(App, { route: "/" });
    await flushPromises();

    expect(wrapper.find(".app-shell").exists()).toBe(true);
    expect(wrapper.find(".app-header").exists()).toBe(true);
    expect(wrapper.find(".ui-bottom-nav").exists()).toBe(false);
    expect(wrapper.text()).toContain("你好，张三");
  });
});
