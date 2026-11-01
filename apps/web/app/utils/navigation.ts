export type NavItem = {
  label: string;
  to: string;
  /** 额外归属该入口的路径前缀，例如积分入口同时覆盖奖励商城与兑换订单。 */
  match?: string[];
};

/** 学生端主导航；只列出已经实现的模块，避免死链。 */
export const STUDENT_NAV: NavItem[] = [
  { label: "首页", to: "/" },
  { label: "绿植", to: "/plants" },
  { label: "任务", to: "/tasks" },
  { label: "积分", to: "/points", match: ["/rewards"] },
  { label: "我的", to: "/me" },
];

/** 当前路径是否属于某个导航入口（含子路径）。 */
export function isNavActive(currentPath: string, to: string): boolean {
  if (to === "/") {
    return currentPath === "/";
  }

  return currentPath === to || currentPath.startsWith(`${to}/`);
}

/** 当前路径是否命中导航项，包括该入口额外声明的路径前缀。 */
export function isNavItemActive(currentPath: string, item: NavItem): boolean {
  if (isNavActive(currentPath, item.to)) {
    return true;
  }

  return (item.match ?? []).some((prefix) => isNavActive(currentPath, prefix));
}
