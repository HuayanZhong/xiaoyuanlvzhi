import { describe, expect, it } from "vitest";
import {
  isKnownOrderStatus,
  isOrderOverdue,
  orderDisplayStatus,
  orderDisplayStatusColor,
  orderDisplayStatusLabel,
  orderStatusColor,
  orderStatusLabel,
  rewardStatusColor,
  rewardStatusLabel,
  stockDetail,
  stockSummary,
} from "@/pages/rewards/labels";
import { makeOrder, makeReward } from "./fixtures";

const NOW = new Date("2026-10-30T12:00:00");

describe("reward labels", () => {
  it("renders Chinese reward status and stock summaries", () => {
    const reward = makeReward();

    expect(rewardStatusLabel(true)).toBe("上架");
    expect(rewardStatusLabel(false)).toBe("下架");
    expect(rewardStatusColor(true)).toBe("green");
    expect(rewardStatusColor(false)).toBe("default");
    expect(stockSummary(reward)).toBe("剩余 12 / 总 20");
    expect(stockDetail(reward)).toBe("已预留 3 · 已领取 5");
  });

  it("falls back to the raw order status when unknown", () => {
    expect(orderStatusLabel("CLAIMED")).toBe("已领取");
    expect(orderStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(orderStatusColor("WAITING_PICKUP")).toBe("gold");
    expect(orderStatusColor("UNKNOWN")).toBe("default");
    expect(isKnownOrderStatus("EXPIRED")).toBe(true);
    expect(isKnownOrderStatus("UNKNOWN")).toBe(false);
  });
});

describe("order overdue display", () => {
  it("marks a waiting order past its deadline as overdue", () => {
    const order = makeOrder({ pickupDeadline: "2026-10-29T10:00:00" });

    expect(isOrderOverdue(order, NOW)).toBe(true);
    expect(orderDisplayStatus(order, NOW)).toBe("OVERDUE");
    expect(orderDisplayStatusLabel(order, NOW)).toBe("已超时");
    expect(orderDisplayStatusColor(order, NOW)).toBe("red");
  });

  it("keeps a waiting order before its deadline as waiting", () => {
    const order = makeOrder({ pickupDeadline: "2026-11-05T10:00:00" });

    expect(isOrderOverdue(order, NOW)).toBe(false);
    expect(orderDisplayStatus(order, NOW)).toBe("WAITING_PICKUP");
    expect(orderDisplayStatusLabel(order, NOW)).toBe("待领取");
    expect(orderDisplayStatusColor(order, NOW)).toBe("gold");
  });

  it("does not mark processed orders as overdue", () => {
    const order = makeOrder({
      status: "CLAIMED",
      pickupDeadline: "2026-10-29T10:00:00",
    });

    expect(isOrderOverdue(order, NOW)).toBe(false);
    expect(orderDisplayStatusLabel(order, NOW)).toBe("已领取");
  });

  it("ignores an invalid deadline", () => {
    const order = makeOrder({ pickupDeadline: "not-a-date" });

    expect(isOrderOverdue(order, NOW)).toBe(false);
  });
});
