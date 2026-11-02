import { describe, expect, it } from "vitest";
import {
  canCloseFeedback,
  feedbackStatusMeta,
  feedbackTypeLabel,
  relatedRecordLabel,
  relatedTypeLabel,
} from "../../../app/utils/feedback-status";

describe("feedback status", () => {
  it("labels the four feedback statuses", () => {
    expect(feedbackStatusMeta("PENDING")).toMatchObject({
      label: "待处理",
      tone: "pending",
    });
    expect(feedbackStatusMeta("IN_PROGRESS")).toMatchObject({
      label: "处理中",
      tone: "pending",
    });
    expect(feedbackStatusMeta("REPLIED")).toMatchObject({
      label: "已回复",
      tone: "alive",
    });
    expect(feedbackStatusMeta("CLOSED")).toMatchObject({
      label: "已关闭",
      tone: "neutral",
    });
    expect(feedbackStatusMeta("REPLIED").hint).toContain("可关闭");
  });

  it("keeps unknown statuses readable", () => {
    expect(feedbackStatusMeta("ARCHIVED")).toMatchObject({
      label: "状态未知",
      tone: "neutral",
    });
    expect(feedbackStatusMeta(null).label).toBe("状态未知");
  });

  it("labels the four feedback types", () => {
    expect(feedbackTypeLabel("PLANT_ISSUE")).toBe("绿植问题");
    expect(feedbackTypeLabel("ACCOUNT_ISSUE")).toBe("账号问题");
    expect(feedbackTypeLabel("REWARD_ISSUE")).toBe("奖励问题");
    expect(feedbackTypeLabel("OTHER")).toBe("其他");
    expect(feedbackTypeLabel("UNKNOWN")).toBe("未知类型");
  });

  it("labels related business records", () => {
    expect(relatedTypeLabel("ADOPTION")).toBe("领养申请");
    expect(relatedTypeLabel("CARE")).toBe("养护打卡");
    expect(relatedTypeLabel("TASK")).toBe("环保任务");
    expect(relatedTypeLabel("REDEMPTION")).toBe("兑换订单");
    expect(relatedTypeLabel("PLANT")).toBe("绿植");
    expect(relatedTypeLabel("CUSTOM")).toBe("CUSTOM");
    expect(relatedRecordLabel("ADOPTION", "12")).toBe("领养申请 #12");
    expect(relatedRecordLabel("ADOPTION", null)).toBe("领养申请");
    expect(relatedRecordLabel(null, "12")).toBe("—");
  });

  it("allows closing only replied feedback", () => {
    expect(canCloseFeedback("REPLIED")).toBe(true);
    expect(canCloseFeedback("PENDING")).toBe(false);
    expect(canCloseFeedback("IN_PROGRESS")).toBe(false);
    expect(canCloseFeedback("CLOSED")).toBe(false);
    expect(canCloseFeedback(null)).toBe(false);
  });
});
