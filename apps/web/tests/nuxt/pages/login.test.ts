import { flushPromises } from "@vue/test-utils";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loginWithEmail, type StudentAccount } from "~/utils/auth-api";
import { ApiError } from "~/utils/api";
import { resetAuthForTests } from "~/composables/useAuth";
import { getToken } from "~/utils/token";
import LoginPage from "../../../app/pages/login.vue";

vi.mock("~/utils/auth-api", () => ({
  loginWithEmail: vi.fn(),
  registerStudent: vi.fn(),
  getCurrentAccount: vi.fn(),
  logoutStudent: vi.fn(),
  sendRegistrationCode: vi.fn(),
}));

const { navigateToMock } = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
}));

mockNuxtImport("navigateTo", () => navigateToMock);

const loginMock = vi.mocked(loginWithEmail);

beforeEach(() => {
  window.localStorage.clear();
  resetAuthForTests();
});

function student(overrides: Partial<StudentAccount> = {}): StudentAccount {
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
    ...overrides,
  };
}

function session(overrides: Partial<StudentAccount> = {}) {
  return {
    tokenType: "Bearer",
    accessToken: "issued-token",
    expiresAt: "2026-11-08T09:00:00",
    account: student(overrides),
  };
}

async function submit(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  await wrapper.get("form").trigger("submit");
  await flushPromises();
}

describe("login page", () => {
  it("shows inline errors and does not call the API for empty fields", async () => {
    const wrapper = await mountSuspended(LoginPage);

    await submit(wrapper);

    expect(wrapper.text()).toContain("请输入邮箱");
    expect(wrapper.text()).toContain("请输入密码");
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid email before submitting", async () => {
    const wrapper = await mountSuspended(LoginPage);
    await wrapper.get("#login-email").setValue("not-an-email");
    await wrapper.get("#login-password").setValue("password123");

    await submit(wrapper);

    expect(wrapper.text()).toContain("请输入正确的邮箱地址");
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("logs in, stores the token and returns to the requested path", async () => {
    loginMock.mockResolvedValue(session());
    const wrapper = await mountSuspended(LoginPage, {
      route: "/login?returnTo=%2Fme",
    });
    await wrapper.get("#login-email").setValue(" student@qq.com ");
    await wrapper.get("#login-password").setValue("password123");

    await submit(wrapper);

    expect(loginMock).toHaveBeenCalledWith("student@qq.com", "password123");
    expect(getToken()).toBe("issued-token");
    expect(navigateToMock).toHaveBeenCalledWith("/me");
  });

  it("shows credential errors without treating them as session expiry", async () => {
    loginMock.mockRejectedValue(
      new ApiError("INVALID_CREDENTIALS", "邮箱或密码错误", 401),
    );
    const wrapper = await mountSuspended(LoginPage);
    await wrapper.get("#login-email").setValue("student@qq.com");
    await wrapper.get("#login-password").setValue("wrong-password");

    await submit(wrapper);

    expect(wrapper.text()).toContain("邮箱或密码错误");
    expect(wrapper.text()).not.toContain("登录已过期");
    expect(getToken()).toBeNull();
  });

  it("disables the button while the request is pending", async () => {
    let resolve!: (value: ReturnType<typeof session>) => void;
    loginMock.mockReturnValue(
      new Promise((res) => {
        resolve = res;
      }),
    );
    const wrapper = await mountSuspended(LoginPage);
    await wrapper.get("#login-email").setValue("student@qq.com");
    await wrapper.get("#login-password").setValue("password123");

    await wrapper.get("form").trigger("submit");
    await flushPromises();

    const button = wrapper.get('button[type="submit"]');
    expect(button.attributes("disabled")).toBeDefined();
    await wrapper.get("form").trigger("submit");

    expect(loginMock).toHaveBeenCalledTimes(1);

    resolve(session());
    await flushPromises();
  });

  it("links to registration and explains the password reset policy", async () => {
    const wrapper = await mountSuspended(LoginPage);

    expect(wrapper.text()).toContain("忘记密码请联系管理员重置");
    expect(wrapper.text()).toContain("立即注册");
    expect(
      wrapper
        .findAll("a")
        .some((link) => link.attributes("href") === "/register"),
    ).toBe(true);
  });
});
