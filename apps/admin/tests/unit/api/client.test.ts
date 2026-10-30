import { HTTPError, NetworkError, TimeoutError } from "@repo/http-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, request, requestVoid } from "@/api/client";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const get = vi.mocked(http.get);
const post = vi.mocked(http.post);
const put = vi.mocked(http.put);

function jsonResponse(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as never;
}

function jsonFailure(error: unknown) {
  return { json: vi.fn().mockRejectedValue(error) } as never;
}

function httpError(status: number, data?: unknown) {
  const response = new Response(null, { status });
  const requestInit = new Request("http://localhost/api/v1/test");
  const error = new HTTPError(response, requestInit, {} as never);
  error.data = data;
  return error;
}

describe("api client", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
  });

  it("returns the envelope data", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: { id: 1 }, error: null }),
    );

    await expect(request<{ id: number }>("things")).resolves.toEqual({
      id: 1,
    });
    expect(get).toHaveBeenCalledWith("things", {});
  });

  it("sends POST and PUT with json options", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: "created", error: null }),
    );
    put.mockReturnValue(
      jsonResponse({ success: true, data: "updated", error: null }),
    );

    await request("things", { method: "POST", json: { name: "a" } });
    await request("things/1", { method: "PUT", json: { name: "b" } });

    expect(post).toHaveBeenCalledWith("things", { json: { name: "a" } });
    expect(put).toHaveBeenCalledWith("things/1", { json: { name: "b" } });
  });

  it("rejects a failed envelope", async () => {
    get.mockReturnValue(
      jsonResponse({
        success: false,
        data: null,
        error: { code: "PLANT_SPECIES_EXISTS", message: "这个品种名称已存在" },
      }),
    );

    await expect(request("things")).rejects.toMatchObject({
      code: "PLANT_SPECIES_EXISTS",
      message: "这个品种名称已存在",
    });
  });

  it("keeps the envelope error on an HTTP failure", async () => {
    post.mockReturnValue(
      jsonFailure(
        httpError(409, {
          success: false,
          data: null,
          error: { code: "PLANT_CODE_EXISTS", message: "单株编号已存在" },
        }),
      ),
    );

    await expect(
      request("things", { method: "POST", json: {} }),
    ).rejects.toMatchObject({
      code: "PLANT_CODE_EXISTS",
      message: "单株编号已存在",
      status: 409,
    });
  });

  it("falls back for an empty HTTP error body", async () => {
    get.mockReturnValue(jsonFailure(httpError(403)));

    await expect(request("things")).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "没有执行此操作的权限",
      status: 403,
    });
  });

  it("falls back for an empty 5xx body", async () => {
    get.mockReturnValue(jsonFailure(httpError(503)));

    await expect(request("things")).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      message: "后端服务暂不可用，请稍后重试",
      status: 503,
    });
  });

  it("maps a timeout", async () => {
    get.mockReturnValue(
      jsonFailure(
        new TimeoutError(new Request("http://localhost/api/v1/test")),
      ),
    );

    await expect(request("things")).rejects.toMatchObject({
      code: "REQUEST_TIMEOUT",
      message: "请求超时，请稍后重试",
    });
  });

  it("maps a network failure", async () => {
    get.mockReturnValue(
      jsonFailure(
        new NetworkError(new Request("http://localhost/api/v1/test")),
      ),
    );

    const error = await request("things").catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: "NETWORK_ERROR",
      message: "无法连接后端服务，请稍后重试",
    });
  });

  it("accepts a successful void envelope with null data", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: null, error: null }),
    );

    await expect(
      requestVoid("things/1/logout", { method: "POST" }),
    ).resolves.toBeUndefined();
  });

  it("rejects a failed void envelope", async () => {
    post.mockReturnValue(
      jsonResponse({
        success: false,
        data: null,
        error: { code: "INTERNAL_ERROR", message: "服务暂时不可用" },
      }),
    );

    await expect(
      requestVoid("things", { method: "POST" }),
    ).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      message: "服务暂时不可用",
    });
  });
});
