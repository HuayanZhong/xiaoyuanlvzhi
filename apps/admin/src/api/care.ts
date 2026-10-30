import { request } from "./client";

export const CARE_CHECKIN_STATUSES = [
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
] as const;

export type CareCheckinStatus = (typeof CARE_CHECKIN_STATUSES)[number];

export const POINTS_SOURCES = ["RULE", "SPECIES", "NONE"] as const;
export type PointsSource = (typeof POINTS_SOURCES)[number];

/** 管理端凭证版本视图；未通过的版本 `awardedPoints` 为 null。 */
export type AdminSubmissionView = {
  id: number;
  version: number;
  note: string | null;
  imageFileIds: number[];
  status: string;
  reviewReason: string | null;
  reviewerName: string | null;
  reviewerEmail: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  awardedPoints: number | null;
};

/** 管理端打卡审核视图；学生端 `CheckinView` 不使用该类型。 */
export type AdminCheckinView = {
  id: number;
  checkinNo: string;
  studentId: number;
  studentName: string | null;
  studentNumber: string | null;
  studentEmail: string;
  studentStatus: string | null;
  plantId: number;
  plantCode: string;
  plantDisplayName: string | null;
  plantName: string;
  location: string | null;
  plantStatus: string;
  speciesId: number;
  speciesName: string;
  careIntervalDays: number;
  lightDescription: string | null;
  waterDescription: string | null;
  status: string;
  latestVersion: number;
  createdAt: string;
  updatedAt: string;
  lastApprovedAt: string | null;
  pendingPoints: number;
  pointsSource: PointsSource;
  hasEvidence: boolean;
  duplicatePending: boolean;
  submissions: AdminSubmissionView[];
};

/** 审核操作记录；只包含通过/驳回事件。 */
export type CareEventView = {
  id: number;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
};

const CARE_PATH = "admin/care/checkins";

export function isCareCheckinStatus(
  value: unknown,
): value is CareCheckinStatus {
  return CARE_CHECKIN_STATUSES.includes(value as CareCheckinStatus);
}

/** 列表只接受合法状态；未知值不拼接 query，避免服务端 400 或空数组歧义。 */
export function listCareCheckins(
  status?: CareCheckinStatus | null,
): Promise<AdminCheckinView[]> {
  if (status && isCareCheckinStatus(status)) {
    return request<AdminCheckinView[]>(CARE_PATH, {
      searchParams: { status },
    });
  }

  return request<AdminCheckinView[]>(CARE_PATH);
}

export function getCareCheckin(id: number): Promise<AdminCheckinView> {
  return request<AdminCheckinView>(`${CARE_PATH}/${id}`);
}

export function listCareEvents(id: number): Promise<CareEventView[]> {
  return request<CareEventView[]>(`${CARE_PATH}/${id}/events`);
}

/** 通过接口无请求体；积分由服务端按规则优先、品种兜底计算。 */
export function approveCareCheckin(id: number): Promise<AdminCheckinView> {
  return request<AdminCheckinView>(`${CARE_PATH}/${id}/approve`, {
    method: "POST",
  });
}

export function rejectCareCheckin(
  id: number,
  reason: string,
): Promise<AdminCheckinView> {
  return request<AdminCheckinView>(`${CARE_PATH}/${id}/reject`, {
    method: "POST",
    json: { reason },
  });
}
