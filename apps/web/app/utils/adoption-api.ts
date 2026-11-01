import { useApi } from "~/composables/useApi";

export type AdoptionEvent = {
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  createdAt: string | null;
};

export type AdoptionApplication = {
  id: number;
  applicationNo: string;
  speciesId: number;
  speciesName: string;
  studentId: number;
  studentEmail: string;
  note: string | null;
  status: string;
  reviewReason: string | null;
  plantId: number | null;
  plantCode: string | null;
  plantLocation: string | null;
  pickupDeadline: string | null;
  handedOverAt: string | null;
  endedAt: string | null;
  returnReason: string | null;
  returnResult: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  timeline: AdoptionEvent[];
};

export type ApplicationCreatePayload = {
  speciesId: number;
  note?: string;
};

/** 当前学生的领养申请，按更新时间倒序。 */
export function listApplications() {
  return useApi().request<AdoptionApplication[]>("adoptions");
}

/** 单个申请详情，包含状态时间线。 */
export function getApplication(id: number | string) {
  return useApi().request<AdoptionApplication>(`adoptions/${id}`);
}

/** 提交领养申请；备注为空时不发送 note 字段。 */
export function createApplication(payload: ApplicationCreatePayload) {
  const note = payload.note?.trim();

  return useApi().request<AdoptionApplication>("adoptions", {
    method: "POST",
    body: note
      ? { speciesId: payload.speciesId, note }
      : { speciesId: payload.speciesId },
  });
}

/** 撤回待审核申请。 */
export function withdrawApplication(id: number | string) {
  return useApi().request<AdoptionApplication>(`adoptions/${id}/withdraw`, {
    method: "POST",
  });
}

/** 修改备注后重新提交被驳回的申请。 */
export function resubmitApplication(id: number | string, note: string) {
  return useApi().request<AdoptionApplication>(`adoptions/${id}/resubmit`, {
    method: "POST",
    body: { note: note.trim() },
  });
}

/** 取消待领取申请，原因 5–200 字。 */
export function requestCancelApplication(id: number | string, reason: string) {
  return useApi().request<AdoptionApplication>(
    `adoptions/${id}/cancel-request`,
    {
      method: "POST",
      body: { reason: reason.trim() },
    },
  );
}

/** 申请归还在养绿植，原因 5–200 字。 */
export function requestReturnApplication(id: number | string, reason: string) {
  return useApi().request<AdoptionApplication>(
    `adoptions/${id}/return-request`,
    {
      method: "POST",
      body: { reason: reason.trim() },
    },
  );
}
