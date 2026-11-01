import { flushPromises } from "@vue/test-utils";
import { mountSuspended, mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  registerStudent,
  sendRegistrationCode,
  type StudentAccount,
} from "~/utils/auth-api";
import { ApiError } from "~/utils/api";
import { resetAuthForTests } from "~/composables/useAuth";
import { getToken } from "~/utils/token";
import RegisterPage from "../../../app/pages/register.vue";

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

const registerMock = vi.mocked(registerStudent);
const sendMock = vi.mocked(sendRegistrationCode);

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
    studentNumber: "00260001",
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

async function fillValidForm(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
) {
  await wrapper.get("#register-email").setValue("student@qq.com");
  await wrapper.get("#register-code").setValue("123456");
  await wrapper.get("#register-password").setValue("password123");
  await wrapper.get("#register-confirm-password").setValue("password123");
  await wrapper.get("#register-full-name").setValue("张三");
  await wrapper.get("#register-student-number").setValue("00260001");
  await wrapper.get("#register-department").setValue("计算机学院");
  await wrapper.get("#register-class-name").setValue("软件工程 1 班");
  await wrapper.get("#register-phone").setValue("13800138000");
}

async function submit(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  await wrapper.get("form").trigger("submit");
  await flushPromises();
}

function sendButton(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
  return wrapper.get(".ui-code button");
}

describe("register page", () => {
  it("rejects mismatched password confirmation without calling the API", async () => {
    const wrapper = await mountSuspended(RegisterPage);
    await fillValidForm(wrapper);
    await wrapper.get("#register-confirm-password").setValue("different");

    await submit(wrapper);

    expect(wrapper.text()).toContain("两次输入的密码不一致");
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("requires a QQ email before sending the code", async () => {
    const wrapper = await mountSuspended(RegisterPage);
    await wrapper.get("#register-email").setValue("student@example.com");

    await sendButton(wrapper).trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("注册邮箱必须是 QQ 邮箱");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("starts the countdown after sending a code", async () => {
    sendMock.mockResolvedValue({
      sent: true,
      expiresInSeconds: 300,
      resendAfterSeconds: 60,
    });
    const wrapper = await mountSuspended(RegisterPage);
    await wrapper.get("#register-email").setValue("student@qq.com");

    await sendButton(wrapper).trigger("click");
    await flushPromises();

    expect(sendMock).toHaveBeenCalledWith("student@qq.com");
    expect(wrapper.text()).toContain("60 秒后重发");
    expect(wrapper.text()).toContain("验证码已发送，5 分钟内有效");
    expect(sendButton(wrapper).attributes("disabled")).toBeDefined();
  });

  it("restarts the countdown when the server rejects an early resend", async () => {
    sendMock.mockRejectedValue(
      new ApiError("CODE_RESEND_TOO_SOON", "请稍后再获取验证码", 429),
    );
    const wrapper = await mountSuspended(RegisterPage);
    await wrapper.get("#register-email").setValue("student@qq.com");
    await wrapper.get("#register-code").setValue("123456");

    await sendButton(wrapper).trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("请稍后再获取验证码");
    expect(wrapper.text()).toContain("60 秒后重发");
  });

  it("links an already-registered email to login with the email prefilled", async () => {
    sendMock.mockRejectedValue(
      new ApiError(
        "EMAIL_ALREADY_REGISTERED",
        "这个邮箱已经注册，请直接登录",
        409,
      ),
    );
    const wrapper = await mountSuspended(RegisterPage);
    await wrapper.get("#register-email").setValue("student@qq.com");

    await sendButton(wrapper).trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("这个邮箱已经注册，请直接登录");
    expect(wrapper.text()).toContain("使用该邮箱去登录");
    expect(
      wrapper
        .findAll("a")
        .some((link) => link.attributes("href")?.includes("/login")),
    ).toBe(true);
    expect(
      wrapper
        .findAll("a")
        .some((link) =>
          decodeURIComponent(link.attributes("href") ?? "").includes(
            "email=student@qq.com",
          ),
        ),
    ).toBe(true);
  });

  it("registers with the full profile and enters the home page", async () => {
    registerMock.mockResolvedValue(session());
    const wrapper = await mountSuspended(RegisterPage);
    await fillValidForm(wrapper);

    await submit(wrapper);

    expect(registerMock).toHaveBeenCalledWith({
      email: "student@qq.com",
      verificationCode: "123456",
      password: "password123",
      fullName: "张三",
      studentNumber: "00260001",
      department: "计算机学院",
      className: "软件工程 1 班",
      phone: "13800138000",
    });
    expect(getToken()).toBe("issued-token");
    expect(navigateToMock).toHaveBeenCalledWith("/");
  });

  it("keeps the form values and maps duplicate student numbers to the field", async () => {
    registerMock.mockRejectedValue(
      new ApiError("STUDENT_NUMBER_ALREADY_USED", "这个学号已经注册", 409),
    );
    const wrapper = await mountSuspended(RegisterPage);
    await fillValidForm(wrapper);

    await submit(wrapper);

    expect(wrapper.text()).toContain("这个学号已经注册");
    expect(
      (wrapper.get("#register-student-number").element as HTMLInputElement)
        .value,
    ).toBe("00260001");
    expect(getToken()).toBeNull();
  });
});
