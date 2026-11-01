import { request } from "./client";

const ACCOUNTS_PATH = "admin/accounts";

/** 领养、反馈、积分和奖励页面展示学生所需的最小账号字段。 */
export type StudentView = {
  id: number;
  email: string;
  fullName: string | null;
  studentNumber: string | null;
  department: string | null;
  className: string | null;
  status: string;
  pointsBalance: number;
  role?: string;
  phone?: string | null;
  activeAdoptionCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

/** 学生管理页面使用的完整账号视图。 */
export type StudentRecordView = StudentView & {
  role: string;
  phone: string | null;
  activeAdoptionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type StudentHistoryAdoption = {
  id: number;
  applicationNo: string;
  speciesName: string;
  plantCode: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type StudentHistoryCare = {
  id: number;
  checkinNo: string;
  plantCode: string;
  plantName: string;
  status: string;
  latestNote: string | null;
  createdAt: string;
};

export type StudentHistoryTask = {
  id: number;
  taskId: number;
  taskTitle: string;
  status: string;
  latestSubmissionStatus: string | null;
  latestNote: string | null;
  joinedAt: string;
};

export type StudentHistoryPoint = {
  id: number;
  deltaPoints: number;
  balanceAfter: number;
  sourceType: string;
  sourceId: string | null;
  reason: string | null;
  createdAt: string;
};

export type StudentHistoryOrder = {
  id: number;
  orderNo: string;
  rewardName: string;
  pointsCost: number;
  status: string;
  createdAt: string;
  pickupDeadline: string;
};

export type StudentHistoryView = {
  adoptions: StudentHistoryAdoption[];
  careCheckins: StudentHistoryCare[];
  taskParticipations: StudentHistoryTask[];
  pointLedger: StudentHistoryPoint[];
  rewardOrders: StudentHistoryOrder[];
};

export function listStudents(): Promise<StudentView[]> {
  return request<StudentView[]>(ACCOUNTS_PATH);
}

export function listStudentRecords(): Promise<StudentRecordView[]> {
  return request<StudentRecordView[]>(ACCOUNTS_PATH);
}

export function getStudent(id: number): Promise<StudentRecordView> {
  return request<StudentRecordView>(`${ACCOUNTS_PATH}/${id}`);
}

export function getStudentHistory(id: number): Promise<StudentHistoryView> {
  return request<StudentHistoryView>(`${ACCOUNTS_PATH}/${id}/history`);
}

export function disableStudent(
  id: number,
  reason: string,
): Promise<StudentRecordView> {
  return request<StudentRecordView>(`${ACCOUNTS_PATH}/${id}/disable`, {
    method: "POST",
    json: { reason },
  });
}

export function enableStudent(
  id: number,
  reason: string,
): Promise<StudentRecordView> {
  return request<StudentRecordView>(`${ACCOUNTS_PATH}/${id}/enable`, {
    method: "POST",
    json: { reason },
  });
}
