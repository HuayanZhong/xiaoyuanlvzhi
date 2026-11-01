import { describe, expect, it } from "vitest";
import {
  canCancelOrder,
  canRedeem,
  orderStatusMeta,
} from "../../../app/utils/reward-status";

const reward = { pointsCost: 50, remainingStock: 12 };

describe("reward status", () => {
  it("labels every order status", () => {
    expect(orderStatusMeta("WAITING_PICKUP").label).toBe("待领取");
    expect(orderStatusMeta("CLAIMED").label).toBe("已领取");
    expect(orderStatusMeta("CANCELLED").label).toBe("已取消");
    expect(orderStatusMeta("EXPIRED").label).toBe("已超时");
  });

  it("keeps unknown statuses read-only", () => {
    const meta = orderStatusMeta("REFUNDING");

    expect(meta.label).toBe("状态未知");
    expect(meta.tone).toBe("neutral");
  });

  it("only allows cancelling waiting orders", () => {
    expect(canCancelOrder("WAITING_PICKUP")).toBe(true);
    expect(canCancelOrder("CLAIMED")).toBe(false);
    expect(canCancelOrder("CANCELLED")).toBe(false);
    expect(canCancelOrder("EXPIRED")).toBe(false);
  });

  it("allows redeeming when balance and stock are enough", () => {
    expect(canRedeem(reward, 382)).toEqual({
      allowed: true,
      reason: null,
      label: "",
    });
  });

  it("blocks redeeming when the balance is short", () => {
    expect(canRedeem(reward, 20)).toEqual({
      allowed: false,
      reason: "insufficient-points",
      label: "积分不足",
    });
  });

  it("blocks redeeming when stock is gone", () => {
    expect(canRedeem({ pointsCost: 50, remainingStock: 0 }, 382)).toEqual({
      allowed: false,
      reason: "out-of-stock",
      label: "库存不足",
    });
  });

  it("blocks redeeming when the balance is unavailable", () => {
    expect(canRedeem(reward, null)).toEqual({
      allowed: false,
      reason: "balance-unavailable",
      label: "暂时无法核对积分",
    });
  });
});
