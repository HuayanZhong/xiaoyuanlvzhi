import { mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import NotFoundPage from "../../../app/pages/[...slug].vue";

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
    }),
    clearAuth: vi.fn(),
    resetAuthForTests: vi.fn(),
  };
});

describe("not-found page", () => {
  it("sends anonymous visitors to login", async () => {
    authState.authenticated = false;
    const wrapper = await mountSuspended(NotFoundPage);

    expect(wrapper.text()).toContain("页面不存在");
    const link = wrapper.get("a");
    expect(link.text()).toBe("前往登录");
    expect(link.attributes("href")).toBe("/login");
  });

  it("sends authenticated students back home", async () => {
    authState.authenticated = true;
    const wrapper = await mountSuspended(NotFoundPage);

    const link = wrapper.get("a");
    expect(link.text()).toBe("返回首页");
    expect(link.attributes("href")).toBe("/");
  });
});
