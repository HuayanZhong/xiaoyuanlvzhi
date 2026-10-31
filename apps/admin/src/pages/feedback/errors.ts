import { ApiError } from "@/api/client";

/** 把反馈操作错误映射为可展示的中文提示；401 由全局登录处理。 */
export function feedbackActionError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  switch (error.code) {
    case "FEEDBACK_STATUS_INVALID":
      return "反馈状态已变化，请刷新后重试";
    case "FEEDBACK_NOT_FOUND":
      return "反馈不存在，请刷新后重试";
    case "INVALID_REQUEST":
      return error.message || fallback;
    default:
      return error.message || fallback;
  }
}

export function isStaleFeedbackError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === "FEEDBACK_STATUS_INVALID" ||
      error.code === "FEEDBACK_NOT_FOUND")
  );
}
