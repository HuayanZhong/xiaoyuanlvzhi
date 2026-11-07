import type { $Fetch } from "nitropack";
import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "../../../app/utils/api";

type RawResult = {
  status: number;
  ok: boolean;
  _data: unknown;
};

function rawResult(body: unknown, status = 200): RawResult {
  return {
    status,
    ok: status >= 200 && status < 300,
    _data: body,
  };
}

function success(data: unknown) {
  return {
    success: true,
    data,
    error: null,
  };
}

function failure(status: number, code: string, message = "请求失败") {
  return rawResult(
    {
      success: false,
      data: null,
      error: { code, message },
    },
    status,
  );
}

function fakeFetch(
  handler: (path: string, options: Record<string, unknown>) => unknown,
) {
  const raw = vi.fn(
    async (path: string, options: Record<string, unknown> = {}) =>
      await handler(path, options),
  );

  return { raw } as unknown as $Fetch;
}

describe("Nuxt API adapter", () => {
  it("unwraps a successful Spring envelope through $fetch.raw", async () => {
    const api = createApiClient({
      fetch: fakeFetch(() => rawResult(success({ id: 7 }))),
    });

    await expect(api.request<{ id: number }>("auth/me")).resolves.toEqual({
      id: 7,
    });
  });

  it("keeps paths relative to the Nitro API prefix", async () => {
    const raw = vi.fn(async () => rawResult(success({ status: "ok" })));
    const api = createApiClient({
      fetch: { raw } as unknown as $Fetch,
    });

    await api.request("profile");

    expect(raw).toHaveBeenCalledWith(
      "/profile",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("rejects absolute and leading-slash paths", async () => {
    const api = createApiClient({
      fetch: fakeFetch(() => rawResult(success({}))),
    });

    await expect(api.request("/profile")).rejects.toMatchObject({
      code: "INVALID_REQUEST_PATH",
    });
    await expect(
      api.request("https://example.test/profile"),
    ).rejects.toMatchObject({
      code: "INVALID_REQUEST_PATH",
    });
  });

  it("keeps business codes and status on a 409", async () => {
    const api = createApiClient({
      fetch: fakeFetch(() =>
        failure(409, "STUDENT_NUMBER_ALREADY_USED", "这个学号已经注册"),
      ),
    });

    await expect(
      api.request("auth/register", { method: "POST", body: {} }),
    ).rejects.toMatchObject({
      code: "STUDENT_NUMBER_ALREADY_USED",
      status: 409,
    });
  });

  it("emits unauthorized for protected 401 responses only", async () => {
    const onUnauthorized = vi.fn();
    const api = createApiClient({
      fetch: fakeFetch(() => failure(401, "UNAUTHORIZED")),
      onUnauthorized,
    });

    await expect(api.request("profile")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      api.request("auth/login", { method: "POST", body: {} }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("maps transport and timeout failures", async () => {
    const networkApi = createApiClient({
      fetch: fakeFetch(() => {
        throw new TypeError("Failed to fetch");
      }),
    });
    const timeoutApi = createApiClient({
      fetch: fakeFetch(() => {
        throw Object.assign(new Error("timed out"), { name: "TimeoutError" });
      }),
    });

    await expect(networkApi.request("profile")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
    await expect(timeoutApi.request("profile")).rejects.toMatchObject({
      code: "REQUEST_TIMEOUT",
    });
  });

  it("accepts a null payload for void operations", async () => {
    const api = createApiClient({
      fetch: fakeFetch(() => rawResult(success(null))),
    });

    await expect(
      api.request("auth/logout", { method: "POST", expectData: false }),
    ).resolves.toBeNull();
  });

  it("rejects an empty successful response when data is expected", async () => {
    const api = createApiClient({
      fetch: fakeFetch(() => rawResult(success(null))),
    });

    await expect(api.request("profile")).rejects.toMatchObject({
      code: "EMPTY_RESPONSE",
    });
  });
});

describe("Nuxt API forms and files", () => {
  it("forwards multipart form data without a JSON wrapper", async () => {
    const raw = vi.fn(async () =>
      rawResult(success({ id: 12, url: "/api/v1/files/12" })),
    );
    const api = createApiClient({
      fetch: { raw } as unknown as $Fetch,
    });
    const form = new FormData();
    form.append("file", new Blob(["image"], { type: "image/png" }), "a.png");

    await expect(api.requestForm("files", form)).resolves.toEqual({
      id: 12,
      url: "/api/v1/files/12",
    });
    expect(raw).toHaveBeenCalledWith(
      "/files",
      expect.objectContaining({
        method: "POST",
        body: form,
      }),
    );
  });

  it("returns a same-origin blob response", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], {
      type: "image/png",
    });
    const api = createApiClient({
      fetch: fakeFetch(() => rawResult(blob)),
    });

    await expect(api.requestBlob("files/9")).resolves.toBe(blob);
  });

  it("emits unauthorized for a protected file response", async () => {
    const onUnauthorized = vi.fn();
    const api = createApiClient({
      fetch: fakeFetch(() =>
        rawResult(
          {
            success: false,
            data: null,
            error: { code: "UNAUTHORIZED", message: "失败" },
          },
          401,
        ),
      ),
      onUnauthorized,
    });

    await expect(api.requestBlob("files/9")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
