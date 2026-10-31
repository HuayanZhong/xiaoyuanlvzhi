import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDashboard, getStatistics } from "@/api/dashboard";
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

describe("dashboard api", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("loads the dashboard without query parameters", async () => {
    const data = {
      pendingAdoptions: 1,
      recentItems: [],
    };
    get.mockReturnValue(jsonResponse({ success: true, data, error: null }));

    await expect(getDashboard()).resolves.toEqual(data);
    expect(get).toHaveBeenCalledWith("admin/dashboard", {});
  });

  it("loads statistics without a date range", async () => {
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

  it("rejects a failed envelope", async () => {
    get.mockReturnValue(
      jsonResponse({
        success: false,
        data: null,
        error: { code: "UPSTREAM_UNAVAILABLE", message: "服务暂不可用" },
      }),
    );

    await expect(getDashboard()).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      message: "服务暂不可用",
    });
  });
});
