import { HTTPError } from "@repo/http-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adjustPoints,
  listPointLedger,
  listPointRules,
  updatePointRule,
} from "@/api/points";
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

function httpError(status: number, code: string, message: string) {
  const response = new Response(null, { status });
  const request = new Request("http://localhost/api/v1/test");
  const error = new HTTPError(response, request, {} as never);
  error.data = { success: false, data: null, error: { code, message } };
  return error;
}

const rule = {
  id: 1,
  sourceType: "CARE_CHECKIN",
  points: 10,
  frequencyLimit: 1,
  frequencyPeriod: "DAILY",
  enabled: true,
  effectiveFrom: "2026-10-30T09:00:00",
  updatedAt: "2026-10-30T09:00:00",
};

const ledger = {
  id: 3,
  accountId: 2,
  studentEmail: "student@qq.com",
  deltaPoints: 10,
  balanceAfter: 120,
  sourceType: "CARE_CHECKIN",
  sourceId: "11",
  reason: "养护打卡审核通过",
  actorEmail: "admin@qq.com",
  createdAt: "2026-10-30T10:00:00",
};

describe("points api", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
  });

  it("lists rules", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: [rule], error: null }),
    );

    await expect(listPointRules()).resolves.toEqual([rule]);
    expect(get).toHaveBeenCalledWith("admin/points/rules", {});
  });

  it("updates a rule through the source path", async () => {
    put.mockReturnValue(
      jsonResponse({ success: true, data: rule, error: null }),
    );

    await updatePointRule("CARE_CHECKIN", {
      points: 10,
      frequencyLimit: 1,
      frequencyPeriod: "DAILY",
      enabled: true,
    });

    expect(put).toHaveBeenCalledWith("admin/points/rules/CARE_CHECKIN", {
      json: {
        points: 10,
        frequencyLimit: 1,
        frequencyPeriod: "DAILY",
        enabled: true,
      },
    });
  });

  it("lists the full ledger", async () => {
    get.mockReturnValue(
      jsonResponse({ success: true, data: [ledger], error: null }),
    );

    await expect(listPointLedger()).resolves.toEqual([ledger]);
    expect(get).toHaveBeenCalledWith("admin/points/ledger", {});
  });

  it("adjusts points with an idempotency key", async () => {
    post.mockReturnValue(
      jsonResponse({ success: true, data: ledger, error: null }),
    );

    await adjustPoints({
      accountId: 2,
      deltaPoints: 10,
      reason: "活动补发积分",
      requestId: "req-1",
    });

    expect(post).toHaveBeenCalledWith("admin/points/adjustments", {
      json: {
        accountId: 2,
        deltaPoints: 10,
        reason: "活动补发积分",
        requestId: "req-1",
      },
    });
  });

  it("preserves the business error code and status", async () => {
    post.mockReturnValue(
      jsonFailure(httpError(409, "POINTS_INSUFFICIENT", "积分余额不足")),
    );

    await expect(
      adjustPoints({
        accountId: 2,
        deltaPoints: -100,
        reason: "活动扣减积分",
        requestId: "req-2",
      }),
    ).rejects.toMatchObject({
      code: "POINTS_INSUFFICIENT",
      status: 409,
      message: "积分余额不足",
    });
  });
});
