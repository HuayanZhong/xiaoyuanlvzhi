import { useApi } from "~/composables/useApi";

/** 当前学生处于养护中的一株绿植。 */
export type CareEligiblePlant = {
  plantId: number;
  plantCode: string;
  plantName: string;
  location: string | null;
  careIntervalDays: number;
  lastApprovedAt: string | null;
  nextEligibleAt: string | null;
  eligible: boolean;
  pendingCheckinId: number | null;
  pendingSubmittedAt: string | null;
  blockedReason: string | null;
};

/** 一次打卡凭证版本。 */
export type CareSubmission = {
  id: number;
  version: number;
  note: string | null;
  imageFileIds: number[];
  status: string;
  reviewReason: string | null;
  reviewerEmail: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
};

/** 学生端打卡记录。 */
export type CareCheckin = {
  id: number;
  checkinNo: string;
  studentId: number;
  studentEmail: string;
  plantId: number;
  plantCode: string;
  plantName: string;
  location: string | null;
  status: string;
  latestVersion: number;
  createdAt: string;
  updatedAt: string;
  submissions: CareSubmission[];
};

export type CareSubmitInput = {
  plantId: number;
  note?: string;
  imageFileIds?: number[];
};

export type CareResubmitInput = {
  note?: string;
  imageFileIds?: number[];
};

/** 在养植株与打卡资格。 */
export function listEligiblePlants() {
  return useApi().request<CareEligiblePlant[]>("care/eligible-plants");
}

/** 当前学生的全部打卡记录，按创建时间倒序。 */
export function listCheckins() {
  return useApi().request<CareCheckin[]>("care/checkins");
}

/** 单条打卡记录及其全部凭证版本。 */
export function getCheckin(id: number | string) {
  return useApi().request<CareCheckin>(`care/checkins/${id}`);
}

/** 提交养护打卡。 */
export function submitCheckin(input: CareSubmitInput) {
  return useApi().request<CareCheckin>("care/checkins", {
    method: "POST",
    body: input,
  });
}

/** 被驳回后重新提交凭证。 */
export function resubmitCheckin(id: number | string, input: CareResubmitInput) {
  return useApi().request<CareCheckin>(`care/checkins/${id}/resubmit`, {
    method: "POST",
    body: input,
  });
}
