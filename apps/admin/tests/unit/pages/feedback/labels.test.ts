import { describe, expect, it } from "vitest";
import {
  feedbackStatusColor,
  feedbackStatusLabel,
  feedbackTypeLabel,
  isFeedbackStatusFilter,
  isFeedbackTypeFilter,
  relatedBusinessLabel,
} from "@/pages/feedback/labels";

describe("feedback labels", () => {
  it("maps known statuses and colors", () => {
    expect(feedbackStatusLabel("PENDING")).toBe("待处理");
    expect(feedbackStatusLabel("IN_PROGRESS")).toBe("处理中");
    expect(feedbackStatusLabel("REPLIED")).toBe("已回复");
    expect(feedbackStatusLabel("CLOSED")).toBe("已关闭");
    expect(feedbackStatusColor("PENDING")).toBe("gold");
    expect(feedbackStatusColor("IN_PROGRESS")).toBe("blue");
    expect(feedbackStatusColor("REPLIED")).toBe("green");
    expect(feedbackStatusColor("CLOSED")).toBe("default");
  });

  it("maps known types and falls back to raw values", () => {
    expect(feedbackTypeLabel("PLANT_ISSUE")).toBe("绿植问题");
    expect(feedbackTypeLabel("ACCOUNT_ISSUE")).toBe("账号问题");
    expect(feedbackTypeLabel("REWARD_ISSUE")).toBe("奖励问题");
    expect(feedbackTypeLabel("OTHER")).toBe("其他");
    expect(feedbackTypeLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(feedbackStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(feedbackStatusColor("UNKNOWN")).toBe("default");
  });

  it("renders related business labels", () => {
    expect(relatedBusinessLabel("ADOPTION", "12")).toBe("领养申请 #12");
    expect(relatedBusinessLabel("TASK", null)).toBe("环保任务");
    expect(relatedBusinessLabel(null, "12")).toBe("—");
    expect(relatedBusinessLabel("CUSTOM", "9")).toBe("CUSTOM #9");
  });

  it("recognizes known filter values", () => {
    expect(isFeedbackStatusFilter("PENDING")).toBe(true);
    expect(isFeedbackStatusFilter("all")).toBe(true);
    expect(isFeedbackStatusFilter("UNKNOWN")).toBe(false);
    expect(isFeedbackTypeFilter("REWARD_ISSUE")).toBe(true);
    expect(isFeedbackTypeFilter("all")).toBe(true);
    expect(isFeedbackTypeFilter("UNKNOWN")).toBe(false);
  });
});
