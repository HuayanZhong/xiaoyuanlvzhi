import { describe, expect, it } from "vitest";
import {
  adoptionHistoryStatusColor,
  adoptionHistoryStatusLabel,
  careHistoryStatusLabel,
  formatPointDelta,
  orderHistoryStatusColor,
  orderHistoryStatusLabel,
  participationHistoryStatusLabel,
  pointSourceLabel,
  studentStatusColor,
  studentStatusLabel,
} from "@/pages/students/labels";

describe("student labels", () => {
  it("maps account statuses", () => {
    expect(studentStatusLabel("ACTIVE")).toBe("正常");
    expect(studentStatusLabel("DISABLED")).toBe("已禁用");
    expect(studentStatusColor("DISABLED")).toBe("default");
  });

  it("maps history statuses and falls back to raw values", () => {
    expect(adoptionHistoryStatusLabel("ACTIVE")).toBe("养护中");
    expect(adoptionHistoryStatusColor("RETURN_REVIEW")).toBe("purple");
    expect(careHistoryStatusLabel("PENDING_REVIEW")).toBe("待审核");
    expect(participationHistoryStatusLabel("JOINED")).toBe("已报名未提交");
    expect(participationHistoryStatusLabel(null)).toBe("—");
    expect(orderHistoryStatusLabel("EXPIRED")).toBe("已超时");
    expect(orderHistoryStatusColor("CLAIMED")).toBe("green");
    expect(adoptionHistoryStatusLabel("CUSTOM")).toBe("CUSTOM");
  });

  it("maps point sources and formats deltas", () => {
    expect(pointSourceLabel("CARE_CHECKIN")).toBe("养护打卡");
    expect(pointSourceLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(formatPointDelta(12)).toBe("+12");
    expect(formatPointDelta(-5)).toBe("-5");
  });
});
