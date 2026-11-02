import { useApi } from "~/composables/useApi";

/** 反馈处理时间线中的一次状态变化。 */
export type FeedbackEvent = {
  id: number;
  actorId: number | null;
  actorEmail: string | null;
  fromStatus: string | null;
  toStatus: string;
  message: string | null;
  createdAt: string;
};

/** 学生自己的反馈记录及完整处理时间线。 */
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
  timeline: FeedbackEvent[];
};

export type FeedbackCreateInput = {
  type: string;
  description: string;
  relatedType?: string;
  relatedId?: string;
  imageFileIds?: number[];
};

/** 提交问题反馈，初始状态为待处理。 */
export function createFeedback(input: FeedbackCreateInput) {
  return useApi().request<FeedbackView>("feedback", {
    method: "POST",
    body: input,
  });
}

/** 当前学生的全部反馈，按创建时间倒序。 */
export function listFeedback() {
  return useApi().request<FeedbackView[]>("feedback");
}

/** 单条反馈详情；不存在或不属于当前账号时返回 404。 */
export function getFeedback(id: number | string) {
  return useApi().request<FeedbackView>(`feedback/${id}`);
}

/** 确认问题已解决并关闭；仅已回复状态可用。 */
export function closeFeedback(id: number | string) {
  return useApi().request<FeedbackView>(`feedback/${id}/close`, {
    method: "POST",
  });
}
