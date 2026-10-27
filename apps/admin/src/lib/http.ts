import { createHttpClient } from "@repo/http-client";

/** 解析 admin 的 API base URL；未配置或为空白时回退到 `/api/`。 */
export function resolveApiBaseUrl(value: string | undefined): string {
  return value?.trim() || "/api/";
}

/**
 * admin 的唯一 HTTP 客户端。
 *
 * 环境读取只发生在这里，未来根目录环境模块落地后替换这一处即可。
 */
export const http = createHttpClient({
  baseUrl: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
});
