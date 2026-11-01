import { describe, expect, it, vi } from "vitest";
import {
  cancelOrder,
  getOrder,
  listOrders,
  listRewards,
  redeemReward,
} from "../../../app/utils/reward-api";

const request = vi.hoisted(() => vi.fn());

vi.mock("~/composables/useApi", () => ({
  useApi: () => ({ request }),
}));

describe("reward api", () => {
  it("lists rewards", async () => {
    request.mockResolvedValue([]);

    await listRewards();

    expect(request).toHaveBeenCalledWith("rewards");
  });

  it("redeems a reward without a request body", async () => {
    const order = { id: 9, orderNo: "RDM-1A2B3C4D" };
    request.mockResolvedValue(order);

    await expect(redeemReward(4)).resolves.toBe(order);
    expect(request).toHaveBeenCalledWith("rewards/4/redeem", {
      method: "POST",
    });
  });

  it("lists my orders", async () => {
    request.mockResolvedValue([]);

    await listOrders();

    expect(request).toHaveBeenCalledWith("rewards/orders");
  });

  it("loads one order", async () => {
    const order = { id: 9 };
    request.mockResolvedValue(order);

    await expect(getOrder(9)).resolves.toBe(order);
    expect(request).toHaveBeenCalledWith("rewards/orders/9");
  });

  it("cancels an order without a request body", async () => {
    const order = { id: 9, status: "CANCELLED" };
    request.mockResolvedValue(order);

    await expect(cancelOrder(9)).resolves.toBe(order);
    expect(request).toHaveBeenCalledWith("rewards/orders/9/cancel", {
      method: "POST",
    });
  });
});
