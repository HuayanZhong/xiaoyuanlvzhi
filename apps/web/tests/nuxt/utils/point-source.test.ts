import { describe, expect, it } from "vitest";
import {
  formatPointDelta,
  pointSourceLabel,
} from "../../../app/utils/point-source";

describe("point source", () => {
  it("labels every known source", () => {
    expect(pointSourceLabel("CARE_CHECKIN")).toBe("养护打卡");
    expect(pointSourceLabel("ECO_TASK")).toBe("环保任务");
    expect(pointSourceLabel("REDEMPTION")).toBe("兑换扣减");
    expect(pointSourceLabel("REDEMPTION_REFUND")).toBe("兑换退回");
    expect(pointSourceLabel("ADJUSTMENT")).toBe("管理员调整");
  });

  it("falls back to a generic label for unknown sources", () => {
    expect(pointSourceLabel("ARTICLE_READ")).toBe("其他变动");
    expect(pointSourceLabel("")).toBe("其他变动");
  });

  it("formats gains with a plus sign", () => {
    expect(formatPointDelta(10)).toBe("+10");
    expect(formatPointDelta(-50)).toBe("-50");
    expect(formatPointDelta(0)).toBe("0");
  });
});
