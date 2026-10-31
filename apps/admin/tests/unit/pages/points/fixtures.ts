import type { StudentView } from "@/api/accounts";
import type { PointLedgerView, PointRuleView } from "@/api/points";

export function makeRule(
  overrides: Partial<PointRuleView> = {},
): PointRuleView {
  return {
    id: 1,
    sourceType: "CARE_CHECKIN",
    points: 10,
    frequencyLimit: 1,
    frequencyPeriod: "DAILY",
    enabled: true,
    effectiveFrom: "2026-10-30T09:00:00",
    updatedAt: "2026-10-30T09:00:00",
    ...overrides,
  };
}

export function makeLedger(
  overrides: Partial<PointLedgerView> = {},
): PointLedgerView {
  return {
    id: 1,
    accountId: 2,
    studentEmail: "student@qq.com",
    deltaPoints: 10,
    balanceAfter: 120,
    sourceType: "CARE_CHECKIN",
    sourceId: "11",
    reason: "养护打卡审核通过",
    actorEmail: "admin@qq.com",
    createdAt: "2026-10-30T10:00:00",
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
