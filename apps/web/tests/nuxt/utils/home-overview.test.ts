import { describe, expect, it } from "vitest";
import type { AdoptionApplication } from "../../../app/utils/adoption-api";
import type {
  CareCheckin,
  CareEligiblePlant,
} from "../../../app/utils/care-api";
import type { RedemptionOrder } from "../../../app/utils/reward-api";
import {
  buildPendingGroups,
  selectDuePlants,
  selectJoinableTasks,
} from "../../../app/utils/home-overview";
import type { EcoTask, TaskParticipation } from "../../../app/utils/task-api";

function checkin(overrides: Partial<CareCheckin> = {}): CareCheckin {
  return {
    id: 12,
    checkinNo: "CARE-1A2B3C4D",
    studentId: 2,
    studentEmail: "student@qq.com",
    plantId: 10,
    plantCode: "PLANT-001",
    plantName: "绿萝 · PLANT-001",
    location: "图书馆一楼",
    status: "PENDING_REVIEW",
    latestVersion: 1,
    createdAt: "2026-11-01T09:00:00",
    updatedAt: "2026-11-01T09:00:00",
    submissions: [],
    ...overrides,
  };
}

function application(
  overrides: Partial<AdoptionApplication> = {},
): AdoptionApplication {
  return {
    id: 9,
    applicationNo: "ADP-1A2B3C4D",
    speciesId: 3,
    speciesName: "绿萝",
    studentId: 2,
    studentEmail: "student@qq.com",
    note: null,
    status: "REJECTED",
    reviewReason: "照片不清晰",
    plantId: null,
    plantCode: null,
    plantLocation: null,
    pickupDeadline: null,
    handedOverAt: null,
    endedAt: null,
    returnReason: null,
    returnResult: null,
    createdAt: "2026-11-01T09:00:00",
    updatedAt: "2026-11-01T09:00:00",
    timeline: [],
    ...overrides,
  };
}

function participation(
  overrides: Partial<TaskParticipation> = {},
): TaskParticipation {
  return {
    id: 34,
    taskId: 7,
    taskTitle: "垃圾分类宣传",
    studentId: 2,
    studentEmail: "student@qq.com",
    status: "REJECTED",
    joinedAt: "2026-11-01T09:00:00",
    submissions: [],
    ...overrides,
  };
}

function order(overrides: Partial<RedemptionOrder> = {}): RedemptionOrder {
  return {
    id: 8,
    orderNo: "RDM-1A2B3C4D",
    studentId: 2,
    studentEmail: "student@qq.com",
    rewardId: 4,
    rewardName: "环保帆布袋",
    pointsCost: 50,
    status: "WAITING_PICKUP",
    location: "学生活动中心 101",
    pickupDeadline: "2026-11-09T00:00:00",
    reason: null,
    refundedAt: null,
    claimedAt: null,
    createdAt: "2026-11-01T09:00:00",
    updatedAt: "2026-11-01T09:00:00",
    ...overrides,
  };
}

function task(overrides: Partial<EcoTask> = {}): EcoTask {
  return {
    id: 7,
    title: "垃圾分类宣传",
    coverFileId: null,
    details: "在食堂门口宣传垃圾分类",
    startsAt: "2026-11-01T09:00:00",
    endsAt: "2026-11-10T09:00:00",
    maxParticipants: 20,
    participantCount: 5,
    approvedCount: 0,
    pointsPerPerson: 20,
    requireText: true,
    requirePhoto: false,
    status: "ONGOING",
    currentUserParticipating: false,
    createdAt: "2026-11-01T09:00:00",
    updatedAt: "2026-11-01T09:00:00",
    ...overrides,
  };
}

function plant(overrides: Partial<CareEligiblePlant> = {}): CareEligiblePlant {
  return {
    plantId: 10,
    plantCode: "PLANT-001",
    plantName: "绿萝 · PLANT-001",
    location: "图书馆一楼",
    careIntervalDays: 7,
    lastApprovedAt: "2026-10-20T09:00:00",
    nextEligibleAt: "2026-10-27T09:00:00",
    eligible: true,
    pendingCheckinId: null,
    pendingSubmittedAt: null,
    blockedReason: null,
    ...overrides,
  };
}

describe("home overview", () => {
  it("groups pending records in a fixed order and links the latest one", () => {
    const groups = buildPendingGroups({
      checkins: [
        checkin(),
        checkin({ id: 13, checkinNo: "CARE-2B3C4D5E" }),
        checkin({ id: 14, status: "REJECTED", checkinNo: "CARE-3C4D5E6F" }),
      ],
      applications: [application()],
      participations: [participation()],
      orders: [order()],
    });

    expect(groups.map((group) => group.key)).toEqual([
      "care-pending",
      "adoption-rejected",
      "care-rejected",
      "task-rejected",
      "reward-pickup",
    ]);
    expect(groups[0]).toMatchObject({
      label: "待审核打卡",
      count: 2,
      to: "/care/12",
      record: "CARE-1A2B3C4D",
    });
    expect(groups[1]).toMatchObject({
      label: "待重提 · 领养",
      count: 1,
      to: "/adoptions/9",
    });
    expect(groups[2]).toMatchObject({
      label: "待重提 · 养护",
      count: 1,
      to: "/care/14",
    });
    expect(groups[3]).toMatchObject({
      label: "待重提 · 任务",
      count: 1,
      to: "/tasks/7",
      record: "垃圾分类宣传",
    });
    expect(groups[4]).toMatchObject({
      label: "待领取奖励",
      count: 1,
      to: "/rewards/orders/8",
    });
  });

  it("omits empty groups", () => {
    const groups = buildPendingGroups({
      checkins: [checkin({ status: "APPROVED" })],
      applications: [application({ status: "ACTIVE" })],
      participations: [participation({ status: "APPROVED" })],
      orders: [order({ status: "CLAIMED" })],
    });

    expect(groups).toEqual([]);
  });

  it("selects at most three joinable tasks", () => {
    const tasks = selectJoinableTasks([
      task({ id: 1 }),
      task({ id: 2, currentUserParticipating: true }),
      task({ id: 3, status: "ENDED" }),
      task({ id: 4, participantCount: 20 }),
      task({ id: 5 }),
      task({ id: 6 }),
      task({ id: 7 }),
    ]);

    expect(tasks.map((item) => item.id)).toEqual([1, 5, 6]);
  });

  it("selects at most three due plants", () => {
    const plants = selectDuePlants([
      plant({ plantId: 1 }),
      plant({ plantId: 2, eligible: false }),
      plant({ plantId: 3 }),
      plant({ plantId: 4 }),
      plant({ plantId: 5 }),
    ]);

    expect(plants.map((item) => item.plantId)).toEqual([1, 3, 4]);
  });
});
