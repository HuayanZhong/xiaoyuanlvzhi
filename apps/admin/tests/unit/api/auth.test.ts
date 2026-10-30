import { HTTPError, NetworkError, TimeoutError } from "@repo/http-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { login, logout, me } from "@/api/auth";
import { ApiError } from "@/api/client";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const post = vi.mocked(http.post);
const get = vi.mocked(http.get);

const account = {
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

const authResult = {
  tokenType: "Bearer",
  accessToken: "spring-token",
  expiresAt: "2026-11-06T00:00:00",
  account,
};

function jsonResponse(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as never;
}

function jsonFailure(error: unknown) {
  return { json: vi.fn().mockRejectedValue(error) } as never;
}

function httpError(status: number, data?: unknown) {
  const response = new Response(null, { status });
  const request = new Request("http://localhost/api/v1/auth/login");
  const error = new HTTPError(response, request, {} as never);
  error.data = data;
  return error;
}

describe("auth api", () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
  });

  it("logs in with the Spring email field", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: authResult, error: null }),
    );

    const result = await login("admin", "123456");

    expect(post).toHaveBeenCalledWith("auth/login", {
      json: { email: "admin", password: "123456" },
    });
    expect(result).toEqual(authResult);
  });

  it("rejects a failed response envelope", async () => {
    post.mockReturnValue(
      jsonResponse({
        success: false,
        data: null,
        error: { code: "INVALID_CREDENTIALS", message: "邮箱或密码错误" },
      }),
    );

    await expect(login("admin", "wrong")).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "邮箱或密码错误",
    });
  });

  it("maps an HTTP 401 to an auth error", async () => {
    post.mockReturnValue(
      jsonFailure(
        httpError(401, {
          success: false,
          data: null,
          error: { code: "INVALID_CREDENTIALS", message: "邮箱或密码错误" },
        }),
      ),
    );

    await expect(login("admin", "wrong")).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "邮箱或密码错误",
      status: 401,
    });
  });

  it("maps a disabled account response", async () => {
    post.mockReturnValue(
      jsonFailure(
        httpError(403, {
          success: false,
          data: null,
          error: {
            code: "ACCOUNT_DISABLED",
            message: "账号暂不可用，请联系管理员",
          },
        }),
      ),
    );

    await expect(login("admin", "123456")).rejects.toMatchObject({
      code: "ACCOUNT_DISABLED",
      message: "账号暂不可用，请联系管理员",
      status: 403,
    });
  });

  it("falls back to a Chinese message for an empty 5xx body", async () => {
    post.mockReturnValue(jsonFailure(httpError(500)));

    await expect(login("admin", "123456")).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      message: "后端服务暂不可用，请稍后重试",
      status: 500,
    });
  });

  it("loads the current account", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: account, error: null }),
    );

    await expect(me()).resolves.toEqual(account);
  });

  it("rejects an expired token on /me", async () => {
    get.mockReturnValue(
      jsonFailure(
        httpError(401, {
          success: false,
          data: null,
          error: { code: "UNAUTHORIZED", message: "请先登录或重新登录" },
        }),
      ),
    );

    await expect(me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
  });

  it("accepts a successful logout envelope with null data", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: null, error: null }),
    );

    await expect(logout()).resolves.toBeUndefined();
  });

  it("rejects a failed logout envelope", async () => {
    post.mockReturnValue(
      jsonResponse({
        success: false,
        data: null,
        error: { code: "INTERNAL_ERROR", message: "服务暂时不可用" },
      }),
    );

    await expect(logout()).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
    });
  });

  it("maps a network failure", async () => {
    post.mockReturnValue(
      jsonFailure(
        new NetworkError(new Request("http://localhost/api/v1/auth/login")),
      ),
    );

    const error = await login("admin", "123456").catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: "NETWORK_ERROR",
      message: "无法连接后端服务，请稍后重试",
    });
  });

  it("maps a timeout", async () => {
    post.mockReturnValue(
      jsonFailure(
        new TimeoutError(new Request("http://localhost/api/v1/auth/login")),
      ),
    );

    await expect(login("admin", "123456")).rejects.toMatchObject({
      code: "REQUEST_TIMEOUT",
      message: "请求超时，请稍后重试",
    });
  });
});
