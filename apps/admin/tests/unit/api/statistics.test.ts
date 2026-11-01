import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStatistics } from "@/api/statistics";
import { http } from "@/lib/http";

vi.mock("@/lib/http", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const get = vi.mocked(http.get);

function jsonResponse(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as never;
}

describe("statistics api", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("loads statistics without a range", async () => {
    const data = {
      from: "2026-10-02",
      to: "2026-10-31",
      adoptionTrend: [],
      pointGrantTrend: [],
    };
    get.mockReturnValue(jsonResponse({ success: true, data, error: null }));

    await expect(getStatistics()).resolves.toEqual(data);
    expect(get).toHaveBeenCalledWith("admin/statistics", {});
  });

  it("passes the selected range as search params", async () => {
    const data = {
      from: "2026-10-01",
      to: "2026-10-31",
      adoptionTrend: [],
      pointGrantTrend: [],
    };
    get.mockReturnValue(jsonResponse({ success: true, data, error: null }));

    await expect(
      getStatistics({ from: "2026-10-01", to: "2026-10-31" }),
    ).resolves.toEqual(data);
    expect(get).toHaveBeenCalledWith("admin/statistics", {
      searchParams: { from: "2026-10-01", to: "2026-10-31" },
    });
  });

  it("rejects a failed envelope", async () => {
    get.mockReturnValue(
      jsonResponse({
        success: false,
        data: null,
        error: { code: "UPSTREAM_UNAVAILABLE", message: "服务暂不可用" },
      }),
    );

    await expect(getStatistics()).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      message: "服务暂不可用",
    });
  });
});
