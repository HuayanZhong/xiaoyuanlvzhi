import { createHttpClient } from "@repo/http-client";
import { emitUnauthorized } from "./auth-events";
import { clearToken, getToken } from "./token";

/** 解析 admin 的 API base URL；未配置或为空白时回退到 `/api/v1/`。 */
export function resolveApiBaseUrl(value: string | undefined): string {
  return value?.trim() || "/api/v1/";
}

/** 为请求附加当前 accessToken；没有登录态时保持匿名请求。 */
export function attachAuthorization(request: { headers: Headers }): void {
  const token = getToken();

  if (token) {
    request.headers.set("Authorization", `Bearer ${token}`);
  }
}

/** 401 表示登录态已失效；403 和 5xx 不应触发退出。 */
export function handleUnauthorized(
  response: { status: number },
  request?: { url: string },
): void {
  if (response.status !== 401) {
    return;
  }

  clearToken();

  // 登录失败和主动注销由各自流程提示，避免误报“登录已过期”。
  if (request && isAuthAction(request.url)) {
    return;
  }

  emitUnauthorized();
}

function isAuthAction(url: string): boolean {
  const pathname = safePathname(url);

  return pathname.endsWith("/auth/login") || pathname.endsWith("/auth/logout");
}

function safePathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

/**
 * admin 的唯一 HTTP 客户端。
 *
 * 环境读取只发生在这里，环境文件由脚本里的 dotenv-cli 注入。
 * 认证头与 401 处理留在应用适配层，`@repo/http-client` 保持环境无关。
 */
export const http = createHttpClient({
  baseUrl: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  hooks: {
    beforeRequest: [
      ({ request }) => {
        attachAuthorization(request);
      },
    ],
    afterResponse: [
      ({ request, response }) => {
        handleUnauthorized(response, request);
      },
    ],
  },
});
