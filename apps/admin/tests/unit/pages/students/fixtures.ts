import type {
  StudentHistoryAdoption,
  StudentHistoryCare,
  StudentHistoryOrder,
  StudentHistoryPoint,
  StudentHistoryTask,
  StudentHistoryView,
  StudentRecordView,
} from "@/api/accounts";

export function makeStudent(
  overrides: Partial<StudentRecordView> = {},
): StudentRecordView {
  return {
    id: 2,
    email: "student@qq.com",
    role: "STUDENT",
    status: "ACTIVE",
    fullName: "张三",
    studentNumber: "20260001",
    department: "计算机学院",
    className: "软件工程 1 班",
    phone: "13800138000",
    pointsBalance: 120,
    activeAdoptionCount: 2,
    createdAt: "2026-10-01T09:00:00",
    updatedAt: "2026-10-02T09:00:00",
    ...overrides,
  };
}

export function makeHistory(
  overrides: Partial<StudentHistoryView> = {},
): StudentHistoryView {
  return {
    adoptions: [],
    careCheckins: [],
    taskParticipations: [],
    pointLedger: [],
    rewardOrders: [],
    ...overrides,
  };
}

export function makeAdoptionHistory(
  overrides: Partial<StudentHistoryAdoption> = {},
): StudentHistoryAdoption {
  return {
    id: 1,
    applicationNo: "AD-1001",
    speciesName: "绿萝",
    plantCode: "PLANT-001",
    status: "ACTIVE",
    createdAt: "2026-10-01T09:00:00",
    updatedAt: "2026-10-02T09:00:00",
    ...overrides,
  };
}

export function makeCareHistory(
  overrides: Partial<StudentHistoryCare> = {},
): StudentHistoryCare {
  return {
    id: 1,
    checkinNo: "CK-1001",
    plantCode: "PLANT-001",
    plantName: "图书馆绿萝",
    status: "APPROVED",
    latestNote: "叶片状态良好",
    createdAt: "2026-10-03T09:00:00",
    ...overrides,
  };
}

export function makeTaskHistory(
  overrides: Partial<StudentHistoryTask> = {},
): StudentHistoryTask {
  return {
    id: 1,
    taskId: 3,
    taskTitle: "校园垃圾分类宣传",
    status: "APPROVED",
    latestSubmissionStatus: "APPROVED",
    latestNote: "已完成宣传",
    joinedAt: "2026-10-04T09:00:00",
    ...overrides,
  };
}

export function makePointHistory(
  overrides: Partial<StudentHistoryPoint> = {},
): StudentHistoryPoint {
  return {
    id: 1,
    deltaPoints: 10,
    balanceAfter: 120,
    sourceType: "CARE_CHECKIN",
    sourceId: "9",
    reason: "养护打卡通过",
    createdAt: "2026-10-05T09:00:00",
    ...overrides,
  };
}

export function makeOrderHistory(
  overrides: Partial<StudentHistoryOrder> = {},
): StudentHistoryOrder {
  return {
    id: 1,
    orderNo: "RO-1001",
    rewardName: "环保帆布袋",
    pointsCost: 50,
    status: "CLAIMED",
    createdAt: "2026-10-06T09:00:00",
    pickupDeadline: "2026-10-13T09:00:00",
    ...overrides,
  };
}
