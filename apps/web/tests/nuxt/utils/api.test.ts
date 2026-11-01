import type { KyInstance } from "@repo/http-client";
import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "../../../app/utils/api";

type RequestOptions = {
  method?: string;
  headers?: Headers;
  retry?: number;
  throwHttpErrors?: boolean;
  json?: unknown;
  body?: BodyInit | null;
};

type Handler = (path: string, options: RequestOptions) => Promise<Response>;

function fakeClient(handler: Handler) {
  return vi.fn(handler) as unknown as KyInstance;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const success = (data: unknown) =>
  jsonResponse({ success: true, data, error: null });

const failure = (status: number, code: string, message = "请求失败") =>
  jsonResponse(
    { success: false, data: null, error: { code, message } },
    status,
  );

describe("web API adapter", () => {
  it("unwraps a successful Spring envelope", async () => {
    const api = createApiClient({
      baseUrl: "/api/v1/",
      client: fakeClient(async () => success({ id: 7 })),
    });

    await expect(api.request<{ id: number }>("auth/me")).resolves.toEqual({
      id: 7,
    });
  });

  it("resolves relative paths under the configured base URL", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        success({ status: "ok" }),
    );

    const api = createApiClient({
      baseUrl: "/api/v1/",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await api.request("auth/me");

    const request = fetchMock.mock.calls[0]?.[0];
    const url = request instanceof Request ? request.url : String(request);
    expect(url).toContain("/api/v1/auth/me");
  });

  it("rejects absolute and leading-slash paths", async () => {
    const api = createApiClient({
      baseUrl: "/api/v1/",
      client: fakeClient(async () => success({})),
    });

    await expect(api.request("/auth/me")).rejects.toMatchObject({
      code: "INVALID_REQUEST_PATH",
    });
    await expect(
      api.request("https://example.test/auth/me"),
    ).rejects.toMatchObject({ code: "INVALID_REQUEST_PATH" });
  });

  it("attaches the current bearer token", async () => {
    let seen: RequestOptions | undefined;
    const api = createApiClient({
      baseUrl: "/api/v1/",
      getToken: () => "student-token",
      client: fakeClient(async (_path, options) => {
        seen = options;
        return success({});
      }),
    });

    await api.request("profile");

    expect(seen?.headers?.get("Authorization")).toBe("Bearer student-token");
  });

  it("does not attach a token when anonymous", async () => {
    let seen: RequestOptions | undefined;
    const api = createApiClient({
      baseUrl: "/api/v1/",
      getToken: () => null,
      client: fakeClient(async (_path, options) => {
        seen = options;
        return success({});
      }),
    });

    await api.request("profile");

    expect(seen?.headers?.get("Authorization")).toBeNull();
  });

  it("keeps business codes and status on a 409", async () => {
    const api = createApiClient({
      baseUrl: "/api/v1/",
      client: fakeClient(async () =>
        failure(409, "STUDENT_NUMBER_ALREADY_USED", "这个学号已经注册"),
      ),
    });

    await expect(
      api.request("auth/register", { method: "POST" }),
    ).rejects.toMatchObject({
      code: "STUDENT_NUMBER_ALREADY_USED",
      message: "这个学号已经注册",
      status: 409,
    });
  });

  it("emits unauthorized for business 401 responses", async () => {
    const onUnauthorized = vi.fn();
    const api = createApiClient({
      baseUrl: "/api/v1/",
      onUnauthorized,
      client: fakeClient(async () => failure(401, "UNAUTHORIZED")),
    });

    await expect(api.request("profile")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("does not report login 401 as a session expiry", async () => {
    const onUnauthorized = vi.fn();
    const api = createApiClient({
      baseUrl: "/api/v1/",
      onUnauthorized,
      client: fakeClient(async () =>
        failure(401, "INVALID_CREDENTIALS", "邮箱或密码错误"),
      ),
    });

    await expect(
      api.request("auth/login", { method: "POST", body: {} }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("does not clear the session on 403", async () => {
    const onUnauthorized = vi.fn();
    const api = createApiClient({
      baseUrl: "/api/v1/",
      onUnauthorized,
      client: fakeClient(async () => failure(403, "FORBIDDEN")),
    });

    await expect(api.request("profile")).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("maps network failures", async () => {
    const api = createApiClient({
      baseUrl: "/api/v1/",
      client: fakeClient(async () => {
        throw new TypeError("Failed to fetch");
      }),
    });

    await expect(api.request("profile")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "无法连接后端服务，请稍后重试",
    });
  });

  it("maps timeouts", async () => {
    const api = createApiClient({
      baseUrl: "/api/v1/",
      client: fakeClient(async () => {
        throw Object.assign(new Error("timed out"), { name: "TimeoutError" });
      }),
    });

    await expect(api.request("profile")).rejects.toMatchObject({
      code: "REQUEST_TIMEOUT",
      message: "请求超时，请稍后重试",
    });
  });

  it("disables automatic retries for authentication POSTs", async () => {
    const retries: Array<number | undefined> = [];
    const api = createApiClient({
      baseUrl: "/api/v1/",
      client: fakeClient(async (_path, options) => {
        retries.push(options.retry);
        return success({});
      }),
    });

    await api.request("auth/login", { method: "POST", body: {} });
    await api.request("profile");

    expect(retries).toEqual([0, undefined]);
  });

  it("accepts a null payload for void operations", async () => {
    const api = createApiClient({
      baseUrl: "/api/v1/",
      client: fakeClient(async () => success(null)),
    });

    await expect(
      api.request("auth/logout", { method: "POST", expectData: false }),
    ).resolves.toBeNull();
  });

  it("rejects a successful envelope without data when data is expected", async () => {
    const api = createApiClient({
      baseUrl: "/api/v1/",
      client: fakeClient(async () => success(null)),
    });

    await expect(api.request("profile")).rejects.toMatchObject({
      code: "EMPTY_RESPONSE",
    });
  });

  it("maps an envelope-less 5xx to an upstream error", async () => {
    const api = createApiClient({
      baseUrl: "/api/v1/",
      client: fakeClient(
        async () =>
          new Response("upstream down", {
            status: 503,
            headers: { "content-type": "text/plain" },
          }),
      ),
    });

    await expect(api.request("profile")).rejects.toMatchObject({
      code: "UPSTREAM_ERROR",
      status: 503,
    });
  });
});

describe("web API form uploads", () => {
  it("posts form data without setting content type", async () => {
    let seenPath: string | undefined;
    let seen: RequestOptions | undefined;
    const api = createApiClient({
      baseUrl: "/api/v1/",
      getToken: () => "student-token",
      client: fakeClient(async (path, options) => {
        seenPath = path;
        seen = options;
        return success({ id: 12, url: "/api/v1/files/12" });
      }),
    });
    const form = new FormData();
    form.append("file", new Blob(["image"], { type: "image/png" }), "a.png");

    await expect(api.requestForm("files", form)).resolves.toEqual({
      id: 12,
      url: "/api/v1/files/12",
    });
    expect(seenPath).toBe("files");
    expect(seen?.method).toBe("POST");
    expect(seen?.body).toBe(form);
    expect(seen?.headers?.get("Authorization")).toBe("Bearer student-token");
    expect(seen?.headers?.has("Content-Type")).toBe(false);
    expect(seen?.retry).toBe(0);
  });

  it("emits unauthorized for a 401 upload", async () => {
    const onUnauthorized = vi.fn();
    const api = createApiClient({
      baseUrl: "/api/v1/",
      onUnauthorized,
      client: fakeClient(async () => failure(401, "UNAUTHORIZED")),
    });

    await expect(
      api.requestForm("files", new FormData()),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED", status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("keeps the server message for an invalid file", async () => {
    const api = createApiClient({
      baseUrl: "/api/v1/",
      client: fakeClient(async () =>
        failure(400, "UNSUPPORTED_FILE_TYPE", "只支持 JPG、PNG 或 WebP 图片"),
      ),
    });

    await expect(
      api.requestForm("files", new FormData()),
    ).rejects.toMatchObject({
      code: "UNSUPPORTED_FILE_TYPE",
      message: "只支持 JPG、PNG 或 WebP 图片",
      status: 400,
    });
  });
});

describe("web API binary reads", () => {
  it("loads a file with the bearer token and returns the blob", async () => {
    let seen: RequestOptions | undefined;
    const api = createApiClient({
      baseUrl: "/api/v1/",
      getToken: () => "student-token",
      client: fakeClient(async (_path, options) => {
        seen = options;
        return new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "content-type": "image/png" },
        });
      }),
    });

    const blob = await api.requestBlob("files/9");

    expect(seen?.headers?.get("Authorization")).toBe("Bearer student-token");
    expect(blob.type).toBe("image/png");
    expect(blob.size).toBe(3);
  });

  it("emits a single unauthorized event for a 401 image request", async () => {
    const onUnauthorized = vi.fn();
    const api = createApiClient({
      baseUrl: "/api/v1/",
      onUnauthorized,
      client: fakeClient(async () => failure(401, "UNAUTHORIZED")),
    });

    await expect(api.requestBlob("files/9")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("keeps the session on a missing file", async () => {
    const onUnauthorized = vi.fn();
    const api = createApiClient({
      baseUrl: "/api/v1/",
      onUnauthorized,
      client: fakeClient(async () => failure(404, "FILE_NOT_FOUND")),
    });

    await expect(api.requestBlob("files/9")).rejects.toMatchObject({
      status: 404,
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("rejects paths that escape the configured base URL", async () => {
    const api = createApiClient({
      baseUrl: "/api/v1/",
      client: fakeClient(async () => new Response("", { status: 200 })),
    });

    await expect(api.requestBlob("/files/9")).rejects.toMatchObject({
      code: "INVALID_REQUEST_PATH",
    });
  });
});
