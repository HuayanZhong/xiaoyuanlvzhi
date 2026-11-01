import { describe, expect, it } from "vitest";
import {
  canJoin,
  canSubmit,
  isFull,
  participationStatusMeta,
  remainingQuota,
  taskStatusMeta,
} from "../../../app/utils/task-status";

describe("task status", () => {
  it("labels task display statuses", () => {
    expect(taskStatusMeta("UPCOMING").label).toBe("尚未开始");
    expect(taskStatusMeta("ONGOING").label).toBe("进行中");
    expect(taskStatusMeta("ENDED").label).toBe("已结束");
  });

  it("treats unknown task status as read-only neutral", () => {
    const meta = taskStatusMeta("STOPPED");

    expect(meta.label).toBe("状态未知");
    expect(meta.tone).toBe("neutral");
  });

  it("labels participation statuses", () => {
    expect(participationStatusMeta("JOINED").label).toBe("已报名");
    expect(participationStatusMeta("PENDING_REVIEW").label).toBe("待审核");
    expect(participationStatusMeta("APPROVED").label).toBe("已通过");
    expect(participationStatusMeta("REJECTED").label).toBe("已驳回");
  });

  it("treats unknown participation status as read-only", () => {
    expect(participationStatusMeta("SOMETHING").readOnly).toBe(true);
    expect(participationStatusMeta("REJECTED").readOnly).toBe(false);
  });

  it("computes remaining quota and full state", () => {
    expect(remainingQuota({ maxParticipants: 10, participantCount: 4 })).toBe(
      6,
    );
    expect(remainingQuota({ maxParticipants: 3, participantCount: 5 })).toBe(0);
    expect(remainingQuota({ maxParticipants: null, participantCount: 9 })).toBe(
      null,
    );
    expect(isFull({ maxParticipants: 3, participantCount: 3 })).toBe(true);
    expect(isFull({ maxParticipants: null, participantCount: 99 })).toBe(false);
  });

  it("allows joining only for an open, unfilled task", () => {
    const base = {
      status: "ONGOING",
      currentUserParticipating: false,
      maxParticipants: 5,
      participantCount: 1,
    };

    expect(canJoin(base)).toBe(true);
    expect(canJoin({ ...base, status: "UPCOMING" })).toBe(false);
    expect(canJoin({ ...base, currentUserParticipating: true })).toBe(false);
    expect(canJoin({ ...base, participantCount: 5 })).toBe(false);
  });

  it("allows submitting only with configured evidence and an editable participation", () => {
    const task = { status: "ONGOING", requireText: true, requirePhoto: false };

    expect(canSubmit(task, { status: "JOINED" })).toBe(true);
    expect(canSubmit(task, { status: "REJECTED" })).toBe(true);
    expect(canSubmit(task, { status: "PENDING_REVIEW" })).toBe(false);
    expect(canSubmit(task, null)).toBe(false);
    expect(canSubmit({ ...task, status: "ENDED" }, { status: "JOINED" })).toBe(
      false,
    );
    expect(
      canSubmit(
        { status: "ONGOING", requireText: false, requirePhoto: false },
        { status: "JOINED" },
      ),
    ).toBe(false);
  });
});
