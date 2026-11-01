import type { AuthRedirect } from "./auth-route";
import { resolveUnauthorizedRedirect } from "./auth-route";

type RouteLike = { path: string; fullPath: string };

/**
 * 把未认证事件转换为“清理登录态 + 受保护页面跳转登录”。
 *
 * 公开页面上的后台请求只清理状态，不打断当前页面。
 */
export function createUnauthorizedHandler(options: {
  getRoute: () => RouteLike;
  clear: () => void;
  navigate: (target: AuthRedirect) => void;
}) {
  return () => {
    const redirect = resolveUnauthorizedRedirect(options.getRoute());

    options.clear();

    if (redirect) {
      options.navigate(redirect);
    }
  };
}
