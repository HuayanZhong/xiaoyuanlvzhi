const DEFAULT_RETURN_TO = "/dashboard";

/**
 * 只接受站内绝对路径，拒绝协议相对路径、外部 URL 和反斜杠变体。
 * 回跳目标是用户可控输入，必须防止开放重定向。
 */
export function resolveReturnTo(
  value: string | null | undefined,
  fallback = DEFAULT_RETURN_TO,
): string {
  if (!value) {
    return fallback;
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }

  return value;
}
