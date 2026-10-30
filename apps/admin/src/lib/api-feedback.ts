import { ApiError } from "@/api/client";
import { emitToast } from "./toast-events";

/**
 * 把接口错误转成 toast。
 * 401 由登录态流程统一跳转，页面不再重复提示。
 */
export function notifyError(
  reason: unknown,
  fallback = "操作失败，请稍后重试",
): void {
  if (reason instanceof ApiError && reason.status === 401) {
    return;
  }

  emitToast("error", reason instanceof Error ? reason.message : fallback);
}
