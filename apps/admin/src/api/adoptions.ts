import { request } from "./client";

export const ADOPTION_STATUSES = [
  "PENDING_REVIEW",
  "REJECTED",
  "WAITING_PICKUP",
  "CANCEL_REVIEW",
  "ACTIVE",
  "RETURN_REVIEW",
  "ENDED",
  "CANCELLED",
] as const;

export type AdoptionStatus = (typeof ADOPTION_STATUSES)[number];

export const RETURN_RESULTS = ["AVAILABLE", "MAINTENANCE"] as const;
export type ReturnResult = (typeof RETURN_RESULTS)[number];

export type AdoptionEventView = {
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  createdAt: string;
};

export type AdoptionView = {
  id: number;
  applicationNo: string;
  studentId: number;
  studentEmail: string;
  speciesId: number;
  speciesName: string;
  plantId: number | null;
  plantCode: string | null;
  plantLocation: string | null;
  note: string | null;
  status: string;
  reviewReason: string | null;
  pickupDeadline: string | null;
  handedOverAt: string | null;
  returnReason: string | null;
  returnResult: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: AdoptionEventView[];
};

const ADOPTIONS_PATH = "admin/adoptions";

export function listAdoptions(): Promise<AdoptionView[]> {
  return request<AdoptionView[]>(ADOPTIONS_PATH);
}

export function getAdoption(id: number): Promise<AdoptionView> {
  return request<AdoptionView>(`${ADOPTIONS_PATH}/${id}`);
}

export function approveAdoption(
  id: number,
  plantId: number,
): Promise<AdoptionView> {
  return request<AdoptionView>(`${ADOPTIONS_PATH}/${id}/approve`, {
    method: "POST",
    json: { plantId },
  });
}

export function rejectAdoption(
  id: number,
  reason: string,
): Promise<AdoptionView> {
  return request<AdoptionView>(`${ADOPTIONS_PATH}/${id}/reject`, {
    method: "POST",
    json: { reason },
  });
}

export function confirmHandover(id: number): Promise<AdoptionView> {
  return request<AdoptionView>(`${ADOPTIONS_PATH}/${id}/handover`, {
    method: "POST",
  });
}

export function decideCancel(
  id: number,
  approved: boolean,
  reason?: string,
): Promise<AdoptionView> {
  const body: { approved: boolean; reason?: string } = { approved };

  if (reason) {
    body.reason = reason;
  }

  return request<AdoptionView>(`${ADOPTIONS_PATH}/${id}/cancel-decision`, {
    method: "POST",
    json: body,
  });
}

export function decideReturn(
  id: number,
  approved: boolean,
  returnResult?: ReturnResult,
  reason?: string,
): Promise<AdoptionView> {
  const body: {
    approved: boolean;
    returnResult?: ReturnResult;
    reason?: string;
  } = { approved };

  if (returnResult) {
    body.returnResult = returnResult;
  }

  if (reason) {
    body.reason = reason;
  }

  return request<AdoptionView>(`${ADOPTIONS_PATH}/${id}/return-decision`, {
    method: "POST",
    json: body,
  });
}
