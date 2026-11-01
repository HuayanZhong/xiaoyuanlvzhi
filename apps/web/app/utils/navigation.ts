export type NavItem = {
  label: string;
  to: string;
};

/** 学生端主导航；只列出已经实现的模块，避免死链。 */
export const STUDENT_NAV: NavItem[] = [
  { label: "首页", to: "/" },
  { label: "绿植", to: "/plants" },
  { label: "任务", to: "/tasks" },
  { label: "我的", to: "/me" },
];

/** 当前路径是否属于某个导航入口（含子路径）。 */
export function isNavActive(currentPath: string, to: string): boolean {
  if (to === "/") {
    return currentPath === "/";
  }

  return currentPath === to || currentPath.startsWith(`${to}/`);
}
