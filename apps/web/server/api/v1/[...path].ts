import { readSessionToken } from "#server/utils/session";
import { assertAllowedMethod, buildSpringUrl } from "#server/utils/spring";

/**
 * 同源 API 入口：浏览器和 SSR 的数据请求统一进入 Nitro。
 *
 * Spring Bearer 只由服务端从 HttpOnly Cookie 生成，浏览器脚本无法读取令牌。
 */
export default defineEventHandler(async (event) => {
  assertAllowedMethod(event);

  const token = readSessionToken(event);
  const path = getRouterParam(event, "path") ?? "";

  if (token) {
    event.node.req.headers.authorization = `Bearer ${token}`;
  } else {
    delete event.node.req.headers.authorization;
  }

  delete event.node.req.headers.cookie;
  delete event.node.req.headers.host;
  delete event.node.req.headers.origin;
  delete event.node.req.headers.referer;

  try {
    return await proxyRequest(event, buildSpringUrl(event, path));
  } catch (error) {
    console.error("[nitro] Spring proxy failed", error);
    throw createError({
      statusCode: 502,
      statusMessage: "Spring service unavailable",
    });
  }
});
