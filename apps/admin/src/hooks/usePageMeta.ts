import { useLocation } from "react-router";
import {
  findGroupByPath,
  findItemByPath,
  getBreadcrumb,
} from "@/config/navigation";

/** 从当前 URL 推导导航分组、菜单项和面包屑；导航渲染不依赖路由 handle。 */
export function usePageMeta() {
  const { pathname, search } = useLocation();

  return {
    pathname,
    search,
    group: findGroupByPath(pathname),
    item: findItemByPath(pathname),
    breadcrumb: getBreadcrumb(pathname),
  };
}
