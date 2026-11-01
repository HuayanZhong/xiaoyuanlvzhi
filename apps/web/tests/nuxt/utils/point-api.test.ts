import { describe, expect, it, vi } from "vitest";
import {
  getPointsBalance,
  listPointLedger,
} from "../../../app/utils/point-api";

const request = vi.hoisted(() => vi.fn());

vi.mock("~/composables/useApi", () => ({
  useApi: () => ({ request }),
}));

describe("point api", () => {
  it("reads the points balance", async () => {
    request.mockResolvedValue(382);

    await expect(getPointsBalance()).resolves.toBe(382);
    expect(request).toHaveBeenCalledWith("points/balance");
  });

  it("lists the points ledger", async () => {
    const entries = [{ id: 1, deltaPoints: 10, balanceAfter: 392 }];
    request.mockResolvedValue(entries);

    await expect(listPointLedger()).resolves.toBe(entries);
    expect(request).toHaveBeenCalledWith("points/ledger");
  });
});
