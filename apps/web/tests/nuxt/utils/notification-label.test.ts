import { describe, expect, it } from "vitest";
import {
  notificationTarget,
  notificationTypeLabel,
} from "../../../app/utils/notification-label";

describe("notification labels", () => {
  it("labels known business types", () => {
    expect(notificationTypeLabel("ADOPTION")).toBe("领养申请");
    expect(notificationTypeLabel("CARE")).toBe("养护打卡");
    expect(notificationTypeLabel("TASK")).toBe("环保任务");
    expect(notificationTypeLabel("REDEMPTION")).toBe("兑换订单");
    expect(notificationTypeLabel("FEEDBACK")).toBe("问题反馈");
  });

  it("labels unknown business types as system notices", () => {
    expect(notificationTypeLabel("UNKNOWN")).toBe("系统通知");
    expect(notificationTypeLabel(null)).toBe("系统通知");
  });

  it("maps business records to their detail pages", () => {
    expect(notificationTarget("ADOPTION", "12")).toEqual({
      kind: "path",
      path: "/adoptions/12",
    });
    expect(notificationTarget("CARE", "9")).toEqual({
      kind: "path",
      path: "/care/9",
    });
    expect(notificationTarget("REDEMPTION", "34")).toEqual({
      kind: "path",
      path: "/rewards/orders/34",
    });
    expect(notificationTarget("FEEDBACK", "5")).toEqual({
      kind: "path",
      path: "/feedback/5",
    });
  });

  it("returns the participation id for task notices", () => {
    expect(notificationTarget("TASK", "34")).toEqual({
      kind: "participation",
      participationId: 34,
    });
  });

  it("returns null for unknown types or missing ids", () => {
    expect(notificationTarget("UNKNOWN", "7")).toBeNull();
    expect(notificationTarget("ADOPTION", null)).toBeNull();
    expect(notificationTarget(null, "7")).toBeNull();
    expect(notificationTarget("ADOPTION", "abc")).toBeNull();
    expect(notificationTarget("ADOPTION", "0")).toBeNull();
  });
});
