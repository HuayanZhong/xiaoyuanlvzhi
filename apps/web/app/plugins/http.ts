import { createApiClient } from "~/utils/api";
import { emitUnauthorized } from "~/utils/auth-events";
import { getToken } from "~/utils/token";

/**
 * 学生端的唯一 HTTP 客户端。
 *
 * 浏览器始终请求同源 `/api/v1/`，由 `server/api/[...path]` 转发；
 * SSR 阶段直接访问 Spring 源地址，避免在同一次渲染里再绕回本进程。
 */
export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();
  const baseUrl = import.meta.server
    ? new URL(
        runtimeConfig.public.apiBaseUrl,
        `${runtimeConfig.springApiOrigin}/`,
      ).toString()
    : runtimeConfig.public.apiBaseUrl;
  const api = createApiClient({
    baseUrl,
    getToken,
    onUnauthorized: emitUnauthorized,
  });

  return {
    provide: { api },
  };
});
