import { createApiClient } from "~/utils/api";
import { emitUnauthorized } from "~/utils/auth-events";
import { API_PREFIX } from "~~/shared/utils/api";

/**
 * 学生端的唯一 HTTP 客户端。
 *
 * 浏览器和 SSR 都请求同源 `/api/v1/`。SSR 使用 `useRequestFetch`
 * 携带当前请求上下文，Nitro 再从 HttpOnly Cookie 生成 Spring Bearer。
 */
export default defineNuxtPlugin(() => {
  const requestHeaders = import.meta.server
    ? useRequestHeaders(["cookie"])
    : undefined;
  const apiFetch = $fetch.create({
    baseURL: API_PREFIX,
    ...(requestHeaders ? { headers: requestHeaders } : {}),
  });

  const api = createApiClient({
    fetch: apiFetch,
    onUnauthorized: emitUnauthorized,
  });

  return {
    provide: { api, apiFetch },
  };
});
