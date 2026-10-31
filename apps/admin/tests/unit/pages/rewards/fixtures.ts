import type { OrderView, RewardView } from "@/api/rewards";
import type { StudentView } from "@/api/accounts";

export function makeReward(overrides: Partial<RewardView> = {}): RewardView {
  return {
    id: 1,
    name: "环保帆布袋",
    description: "校园环保主题帆布袋",
    imageFileIds: [],
    pointsCost: 50,
    availableStock: 20,
    reservedStock: 3,
    claimedCount: 5,
    remainingStock: 12,
    location: "学生活动中心 101",
    pickupDays: 7,
    enabled: true,
    createdAt: "2026-10-30T09:00:00",
    updatedAt: "2026-10-30T09:00:00",
    ...overrides,
  };
}

export function makeOrder(overrides: Partial<OrderView> = {}): OrderView {
  return {
    id: 5,
    orderNo: "RDM-1A2B3C4D",
    studentId: 2,
    studentEmail: "student@qq.com",
    rewardId: 1,
    rewardName: "环保帆布袋",
    pointsCost: 50,
    status: "WAITING_PICKUP",
    location: "学生活动中心 101",
    pickupDeadline: "2026-11-05T10:00:00",
    reason: null,
    refundedAt: null,
    claimedAt: null,
    createdAt: "2026-10-30T10:00:00",
    updatedAt: "2026-10-30T10:00:00",
    ...overrides,
  };
}

export function makeStudent(overrides: Partial<StudentView> = {}): StudentView {
  return {
    id: 2,
    email: "student@qq.com",
    fullName: "张三",
    studentNumber: "20260001",
    department: "计算机学院",
    className: "软件工程 1 班",
    status: "ACTIVE",
    pointsBalance: 100,
    ...overrides,
  };
}
