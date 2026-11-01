import { resolveSpringApiTarget } from "~~/shared/utils/api";

/**
 * 同源 API 入口：浏览器请求 `/api/v1/*`，由 Nitro 转发到 Spring。
 *
 * 保留方法、查询、请求体和认证头；生产环境不再依赖外部反向代理。
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const path = getRouterParam(event, "path") ?? "";

  return proxyRequest(
    event,
    resolveSpringApiTarget(config.springApiOrigin, path),
  );
});
