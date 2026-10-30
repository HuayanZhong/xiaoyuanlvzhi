import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthApiError,
  login as loginRequest,
  logout as logoutRequest,
  me as meRequest,
  type AdminAccount,
  type AuthResult,
} from "@/api/auth";
import { emitUnauthorized } from "@/lib/auth-events";
import { clearToken, getToken, setToken } from "@/lib/token";
import { useAuthStore } from "@/stores/auth";

vi.mock("@/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/auth")>();

  return {
    ...actual,
    login: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
  };
});

const account: AdminAccount = {
  id: 1,
  email: "admin@campus.local",
  role: "ADMIN",
  status: "ACTIVE",
  fullName: "管理员",
  studentNumber: null,
  department: null,
  className: null,
  phone: null,
};

const authResult: AuthResult = {
  tokenType: "Bearer",
  accessToken: "spring-token",
  expiresAt: "2026-11-06T00:00:00",
  account,
};

describe("auth store", () => {
  beforeEach(() => {
    clearToken();
    localStorage.clear();
    useAuthStore.setState({ status: "checking", account: null });
    vi.mocked(loginRequest).mockReset();
    vi.mocked(meRequest).mockReset();
    vi.mocked(logoutRequest).mockReset();
  });

  it("starts anonymous when no token exists", async () => {
    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe("anonymous");
    expect(meRequest).not.toHaveBeenCalled();
  });

  it("restores an admin session from a stored token", async () => {
    setToken("spring-token");
    vi.mocked(meRequest).mockResolvedValue(account);

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().account).toEqual(account);
  });

  it("clears an expired token on 401", async () => {
    setToken("expired-token");
    vi.mocked(meRequest).mockRejectedValue(
      new AuthApiError("UNAUTHORIZED", "请先登录或重新登录", 401),
    );

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe("anonymous");
    expect(getToken()).toBeNull();
  });

  it("keeps the token and reports an error when the backend is down", async () => {
    setToken("spring-token");
    vi.mocked(meRequest).mockRejectedValue(
      new AuthApiError("NETWORK_ERROR", "无法连接后端服务"),
    );

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe("error");
    expect(getToken()).toBe("spring-token");
  });

  it("clears a non-admin session from /me", async () => {
    setToken("student-token");
    vi.mocked(meRequest).mockResolvedValue({
      ...account,
      role: "STUDENT",
    });

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe("anonymous");
    expect(getToken()).toBeNull();
  });

  it("logs in an admin and persists the token", async () => {
    vi.mocked(loginRequest).mockResolvedValue(authResult);

    await useAuthStore.getState().login("admin", "123456");

    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().account).toEqual(account);
    expect(getToken()).toBe("spring-token");
  });

  it("rejects a non-admin login and revokes its token", async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      ...authResult,
      accessToken: "student-token",
      account: { ...account, role: "STUDENT" },
    });
    vi.mocked(logoutRequest).mockResolvedValue(undefined);

    await expect(
      useAuthStore.getState().login("student@qq.com", "123456"),
    ).rejects.toMatchObject({
      code: "NOT_ADMIN",
      message: "仅管理员账号可登录管理后台",
    });

    expect(logoutRequest).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().status).toBe("anonymous");
    expect(getToken()).toBeNull();
  });

  it("clears the session on logout", async () => {
    setToken("spring-token");
    useAuthStore.setState({ status: "authenticated", account });
    vi.mocked(logoutRequest).mockResolvedValue(undefined);

    const result = await useAuthStore.getState().logout();

    expect(result.revokeFailed).toBe(false);
    expect(useAuthStore.getState().status).toBe("anonymous");
    expect(getToken()).toBeNull();
  });

  it("clears locally and warns when logout cannot reach the server", async () => {
    setToken("spring-token");
    useAuthStore.setState({ status: "authenticated", account });
    vi.mocked(logoutRequest).mockRejectedValue(
      new AuthApiError("NETWORK_ERROR", "无法连接后端服务"),
    );

    const result = await useAuthStore.getState().logout();

    expect(result.revokeFailed).toBe(true);
    expect(useAuthStore.getState().status).toBe("anonymous");
    expect(getToken()).toBeNull();
  });

  it("treats a 401 on logout as already revoked", async () => {
    setToken("spring-token");
    useAuthStore.setState({ status: "authenticated", account });
    vi.mocked(logoutRequest).mockRejectedValue(
      new AuthApiError("UNAUTHORIZED", "请先登录", 401),
    );

    const result = await useAuthStore.getState().logout();

    expect(result.revokeFailed).toBe(false);
    expect(getToken()).toBeNull();
  });

  it("clears the session when the HTTP layer reports 401", () => {
    setToken("spring-token");
    useAuthStore.setState({ status: "authenticated", account });

    emitUnauthorized();

    expect(useAuthStore.getState().status).toBe("anonymous");
    expect(useAuthStore.getState().account).toBeNull();
    expect(getToken()).toBeNull();
  });
});
