import { describe, expect, it } from "vitest";
import {
  directionLabel,
  formatDelta,
  frequencyPeriodLabel,
  frequencySummary,
  pointSourceLabel,
  ruleSourceLabel,
  ruleStatusLabel,
} from "@/pages/points/labels";

describe("point labels", () => {
  it("maps rule sources and status", () => {
    expect(ruleSourceLabel("CARE_CHECKIN")).toBe("养护打卡");
    expect(ruleSourceLabel("ECO_TASK")).toBe("环保任务");
    expect(ruleSourceLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(ruleStatusLabel(true)).toBe("启用");
    expect(ruleStatusLabel(false)).toBe("停用");
  });

  it("formats frequency periods and summaries", () => {
    expect(frequencyPeriodLabel(null)).toBe("不限");
    expect(frequencyPeriodLabel("DAILY")).toBe("每日");
    expect(frequencyPeriodLabel("WEEKLY")).toBe("每周");
    expect(frequencyPeriodLabel("PER_TASK")).toBe("PER_TASK");
    expect(
      frequencySummary({ frequencyLimit: 2, frequencyPeriod: "WEEKLY" }),
    ).toBe("每周 2 次");
    expect(
      frequencySummary({ frequencyLimit: null, frequencyPeriod: null }),
    ).toBe("不限");
  });

  it("maps ledger sources and directions", () => {
    expect(pointSourceLabel("CARE_CHECKIN")).toBe("养护打卡");
    expect(pointSourceLabel("ECO_TASK")).toBe("环保任务");
    expect(pointSourceLabel("REDEMPTION")).toBe("奖励兑换");
    expect(pointSourceLabel("REDEMPTION_REFUND")).toBe("兑换退回");
    expect(pointSourceLabel("ADJUSTMENT")).toBe("人工调整");
    expect(pointSourceLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(directionLabel("income")).toBe("收入");
    expect(directionLabel("expense")).toBe("支出");
    expect(directionLabel("all")).toBe("全部方向");
  });

  it("formats signed deltas", () => {
    expect(formatDelta(10)).toBe("+10");
    expect(formatDelta(-5)).toBe("-5");
    expect(formatDelta(0)).toBe("0");
  });
});
