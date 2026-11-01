import { ApiError } from "./api";

/**
 * 养护与上传场景的错误文案：后端 DomainException 的消息本身就是面向用户的中文，
 * 因此业务错误直接展示，避免未知业务码被折叠成通用提示。
 */
export function resolveCareError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message.trim() || "请求失败，请稍后重试";
  }

  return "请求失败，请稍后重试";
}
