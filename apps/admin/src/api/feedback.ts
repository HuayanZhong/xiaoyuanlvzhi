import { request } from "./client";

export const FEEDBACK_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "REPLIED",
  "CLOSED",
] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_TYPES = [
  "PLANT_ISSUE",
  "ACCOUNT_ISSUE",
  "REWARD_ISSUE",
  "OTHER",
] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export type FeedbackEventView = {
  id: number;
  actorId: number | null;
  actorEmail: string | null;
  fromStatus: string | null;
  toStatus: string;
  message: string | null;
  createdAt: string;
};

export type FeedbackView = {
  id: number;
  feedbackNo: string;
  studentId: number;
  studentEmail: string;
  type: string;
  relatedType: string | null;
  relatedId: string | null;
  description: string;
  imageFileIds: number[];
  status: string;
  adminReply: string | null;
  handlerEmail: string | null;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: FeedbackEventView[];
};

export type ReplyRequest = {
  reply: string;
};

export type CloseRequest = {
  conclusion: string;
};

const FEEDBACK_PATH = "admin/feedback";

export function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return FEEDBACK_STATUSES.includes(value as FeedbackStatus);
}

export function isFeedbackType(value: unknown): value is FeedbackType {
  return FEEDBACK_TYPES.includes(value as FeedbackType);
}

export function listFeedback(status?: FeedbackStatus): Promise<FeedbackView[]> {
  return request<FeedbackView[]>(
    FEEDBACK_PATH,
    status ? { searchParams: { status } } : {},
  );
}

export function getFeedback(id: number): Promise<FeedbackView> {
  return request<FeedbackView>(`${FEEDBACK_PATH}/${id}`);
}

export function startFeedback(id: number): Promise<FeedbackView> {
  return request<FeedbackView>(`${FEEDBACK_PATH}/${id}/start`, {
    method: "POST",
  });
}

export function replyFeedback(
  id: number,
  input: ReplyRequest,
): Promise<FeedbackView> {
  return request<FeedbackView>(`${FEEDBACK_PATH}/${id}/reply`, {
    method: "POST",
    json: input,
  });
}

export function closeFeedback(
  id: number,
  input: CloseRequest,
): Promise<FeedbackView> {
  return request<FeedbackView>(`${FEEDBACK_PATH}/${id}/close`, {
    method: "POST",
    json: input,
  });
}
