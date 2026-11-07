import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCurrentAccount,
  loginWithEmail,
  logoutStudent,
  type StudentAccount,
} from "~/utils/auth-api";
import { resetAuthForTests, useAuth } from "../../../app/composables/useAuth";
import { ApiError } from "../../../app/utils/api";

vi.mock("~/utils/auth-api", () => ({
  loginWithEmail: vi.fn(),
  registerStudent: vi.fn(),
  getCurrentAccount: vi.fn(),
  logoutStudent: vi.fn(),
}));

const loginMock = vi.mocked(loginWithEmail);
const logoutMock = vi.mocked(logoutStudent);
const meMock = vi.mocked(getCurrentAccount);

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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe("useAuth", () => {
  beforeEach(() => {
    resetAuthForTests();
    window.localStorage.clear();
  });

  it("becomes anonymous when the HttpOnly session is absent", async () => {
    meMock.mockRejectedValue(new ApiError("UNAUTHORIZED", "未登录", 401));
    const auth = useAuth();

    await auth.restore();

    expect(meMock).toHaveBeenCalledTimes(1);
    expect(auth.status.value).toBe("anonymous");
  });

  it("restores an ACTIVE STUDENT session", async () => {
    meMock.mockResolvedValue(student());
    const auth = useAuth();

    await auth.restore();

    expect(auth.status.value).toBe("authenticated");
    expect(auth.account.value?.email).toBe("student@qq.com");
  });

  it("clears the session when restoration returns 401", async () => {
    meMock.mockRejectedValue(new ApiError("UNAUTHORIZED", "登录已过期", 401));
    const auth = useAuth();

    await auth.restore();

    expect(auth.status.value).toBe("anonymous");
  });

  it("keeps the Cookie and exposes a retryable error on network failure", async () => {
    meMock.mockRejectedValue(new ApiError("NETWORK_ERROR", "网络错误"));
    const auth = useAuth();

    await auth.restore();

    expect(auth.status.value).toBe("error");
  });

  it("deduplicates concurrent restore calls", async () => {
    const pending = deferred<StudentAccount>();
    meMock.mockReturnValue(pending.promise);
    const auth = useAuth();

    const first = auth.restore();
    const second = auth.restore();
    pending.resolve(student());
    await Promise.all([first, second]);

    expect(meMock).toHaveBeenCalledTimes(1);
    expect(auth.status.value).toBe("authenticated");
  });

  it("stores the account after a student login", async () => {
    loginMock.mockResolvedValue({
      expiresAt: "2026-11-08T09:00:00",
      account: student(),
    });
    const auth = useAuth();

    await auth.login("student@qq.com", "password123");

    expect(auth.status.value).toBe("authenticated");
  });

  it("rejects a non-student login without creating a session", async () => {
    loginMock.mockResolvedValue({
      expiresAt: "2026-11-08T09:00:00",
      account: student({ role: "ADMIN", email: "admin@campus.local" }),
    });
    const auth = useAuth();

    await expect(auth.login("admin", "123456")).rejects.toMatchObject({
      code: "NOT_STUDENT",
    });

    expect(auth.status.value).toBe("anonymous");
  });

  it("rejects a non-active student login", async () => {
    loginMock.mockResolvedValue({
      expiresAt: "2026-11-08T09:00:00",
      account: student({ status: "DISABLED" }),
    });
    const auth = useAuth();

    await expect(
      auth.login("student@qq.com", "password123"),
    ).rejects.toMatchObject({ code: "ACCOUNT_DISABLED" });
  });

  it("ignores a late /auth/me success after logout", async () => {
    const pending = deferred<StudentAccount>();
    meMock.mockReturnValue(pending.promise);
    logoutMock.mockResolvedValue({ revokeFailed: false });
    const auth = useAuth();

    const restoring = auth.restore();
    await auth.logout();
    pending.resolve(student());
    await restoring;

    expect(auth.status.value).toBe("anonymous");
    expect(auth.account.value).toBeNull();
  });

  it("reports revoke failure when logout cannot reach the server", async () => {
    logoutMock.mockRejectedValue(new ApiError("NETWORK_ERROR", "网络错误"));
    const auth = useAuth();

    const result = await auth.logout();

    expect(result.revokeFailed).toBe(true);
    expect(auth.status.value).toBe("anonymous");
  });

  it("treats a 401 logout as already revoked", async () => {
    logoutMock.mockRejectedValue(new ApiError("UNAUTHORIZED", "已失效", 401));
    const auth = useAuth();

    const result = await auth.logout();

    expect(result.revokeFailed).toBe(false);
    expect(auth.status.value).toBe("anonymous");
  });
});
