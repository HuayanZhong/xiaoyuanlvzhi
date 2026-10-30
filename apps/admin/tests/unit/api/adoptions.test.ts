import { HTTPError, NetworkError } from "@repo/http-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/client";
import {
  approveAdoption,
  confirmHandover,
  decideCancel,
  decideReturn,
  getAdoption,
  listAdoptions,
  rejectAdoption,
} from "@/api/adoptions";
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

function jsonResponse(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as never;
}

function jsonFailure(error: unknown) {
  return { json: vi.fn().mockRejectedValue(error) } as never;
}

function httpError(status: number, code: string, message: string) {
  const response = new Response(null, { status });
  const request = new Request("http://localhost/api/v1/test");
  const error = new HTTPError(response, request, {} as never);
  error.data = { success: false, data: null, error: { code, message } };
  return error;
}

function httpErrorWithoutData(status: number) {
  const response = new Response(null, { status });
  const request = new Request("http://localhost/api/v1/test");
  return new HTTPError(response, request, {} as never);
}

const view = {
  id: 7,
  applicationNo: "ADP-7",
  status: "PENDING_REVIEW",
};

describe("adoptions api", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it("lists and fetches adoption applications", async () => {
    get
      .mockReturnValueOnce(
        jsonResponse({ success: true, data: [view], error: null }),
      )
      .mockReturnValueOnce(
        jsonResponse({ success: true, data: view, error: null }),
      );

    await expect(listAdoptions()).resolves.toEqual([view]);
    await expect(getAdoption(7)).resolves.toEqual(view);

    expect(get).toHaveBeenNthCalledWith(1, "admin/adoptions", {});
    expect(get).toHaveBeenNthCalledWith(2, "admin/adoptions/7", {});
  });

  it("approves an application with a plant", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: view, error: null }),
    );

    await approveAdoption(7, 10);

    expect(post).toHaveBeenCalledWith("admin/adoptions/7/approve", {
      json: { plantId: 10 },
    });
  });

  it("rejects an application with a reason", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: view, error: null }),
    );

    await rejectAdoption(7, "养护条件暂不满足");

    expect(post).toHaveBeenCalledWith("admin/adoptions/7/reject", {
      json: { reason: "养护条件暂不满足" },
    });
  });

  it("confirms handover without a body", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: view, error: null }),
    );

    await confirmHandover(7);

    expect(post).toHaveBeenCalledWith("admin/adoptions/7/handover", {});
  });

  it("decides cancel requests with and without a reason", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: view, error: null }),
    );

    await decideCancel(7, true);
    await decideCancel(7, false, "尚未完成交接");

    expect(post).toHaveBeenNthCalledWith(
      1,
      "admin/adoptions/7/cancel-decision",
      {
        json: { approved: true },
      },
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      "admin/adoptions/7/cancel-decision",
      {
        json: { approved: false, reason: "尚未完成交接" },
      },
    );
  });

  it("decides return requests with a result or a reason", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: view, error: null }),
    );

    await decideReturn(7, true, "AVAILABLE");
    await decideReturn(7, true, "MAINTENANCE");
    await decideReturn(7, false, undefined, "植株状态与描述不符");

    expect(post).toHaveBeenNthCalledWith(
      1,
      "admin/adoptions/7/return-decision",
      {
        json: { approved: true, returnResult: "AVAILABLE" },
      },
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      "admin/adoptions/7/return-decision",
      {
        json: { approved: true, returnResult: "MAINTENANCE" },
      },
    );
    expect(post).toHaveBeenNthCalledWith(
      3,
      "admin/adoptions/7/return-decision",
      {
        json: { approved: false, reason: "植株状态与描述不符" },
      },
    );
  });

  it("preserves the status conflict business code", async () => {
    post.mockReturnValue(
      jsonFailure(
        httpError(
          409,
          "ADOPTION_STATUS_INVALID",
          "申请状态已变化，请刷新后重试",
        ),
      ),
    );

    const error = await approveAdoption(7, 10).catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: "ADOPTION_STATUS_INVALID",
      message: "申请状态已变化，请刷新后重试",
      status: 409,
    });
  });

  it("falls back for an empty 5xx body", async () => {
    get.mockReturnValue(jsonFailure(httpErrorWithoutData(503)));

    await expect(listAdoptions()).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      message: "后端服务暂不可用，请稍后重试",
      status: 503,
    });
  });

  it("maps a network failure", async () => {
    get.mockReturnValue(
      jsonFailure(
        new NetworkError(new Request("http://localhost/api/v1/test")),
      ),
    );

    await expect(listAdoptions()).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "无法连接后端服务，请稍后重试",
    });
  });
});
