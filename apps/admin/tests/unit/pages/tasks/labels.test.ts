import { describe, expect, it } from "vitest";
import {
  accountStatusLabel,
  participationStatusColor,
  participationStatusLabel,
  taskStatusColor,
  taskStatusLabel,
} from "@/pages/tasks/labels";

describe("task labels", () => {
  it("maps task statuses to Chinese labels and colors", () => {
    expect(taskStatusLabel("DRAFT")).toBe("草稿");
    expect(taskStatusLabel("UPCOMING")).toBe("未开始");
    expect(taskStatusLabel("ONGOING")).toBe("进行中");
    expect(taskStatusLabel("ENDED")).toBe("已结束");
    expect(taskStatusLabel("STOPPED")).toBe("已停用");
    expect(taskStatusColor("ONGOING")).toBe("green");
    expect(taskStatusColor("STOPPED")).toBe("red");
  });

  it("maps participation statuses to Chinese labels and colors", () => {
    expect(participationStatusLabel("JOINED")).toBe("已报名未提交");
    expect(participationStatusLabel("PENDING_REVIEW")).toBe("待审核");
    expect(participationStatusLabel("APPROVED")).toBe("已通过");
    expect(participationStatusLabel("REJECTED")).toBe("已驳回");
    expect(participationStatusColor("PENDING_REVIEW")).toBe("gold");
    expect(participationStatusColor("APPROVED")).toBe("green");
  });

  it("falls back to the raw value for unknown statuses", () => {
    expect(taskStatusLabel("ARCHIVED")).toBe("ARCHIVED");
    expect(participationStatusLabel("")).toBe("未知状态");
    expect(accountStatusLabel("DISABLED")).toBe("已禁用");
    expect(taskStatusColor("ARCHIVED")).toBe("default");
  });
});
