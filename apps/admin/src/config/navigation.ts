import {
  AccountBookOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  FlagOutlined,
  GiftOutlined,
  HomeOutlined,
  InboxOutlined,
  LineChartOutlined,
  MessageOutlined,
  ProfileOutlined,
  ReadOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ComponentType } from "react";

export type NavItem = {
  key: string;
  label: string;
  path: string;
  icon: ComponentType;
};

export type NavGroup = {
  key: string;
  label: string;
  icon: ComponentType;
  items: NavItem[];
};

export type BreadcrumbItem = {
  title: string;
  path?: string;
};

export const navGroups: NavGroup[] = [
  {
    key: "operations",
    label: "运营",
    icon: DashboardOutlined,
    items: [
      {
        key: "dashboard",
        label: "工作台",
        path: "/dashboard",
        icon: HomeOutlined,
      },
      {
        key: "adoptions",
        label: "领养管理",
        path: "/adoptions",
        icon: FileTextOutlined,
      },
      {
        key: "care-reviews",
        label: "养护审核",
        path: "/care-reviews",
        icon: CheckCircleOutlined,
      },
      {
        key: "tasks",
        label: "环保任务",
        path: "/tasks",
        icon: FlagOutlined,
      },
      {
        key: "feedback",
        label: "问题反馈",
        path: "/feedback",
        icon: MessageOutlined,
      },
    ],
  },
  {
    key: "resources",
    label: "资源",
    icon: AppstoreOutlined,
    items: [
      {
        key: "species",
        label: "品种档案",
        path: "/plants/species",
        icon: ExperimentOutlined,
      },
      {
        key: "instances",
        label: "单株库存",
        path: "/plants/instances",
        icon: InboxOutlined,
      },
    ],
  },
  {
    key: "points",
    label: "积分",
    icon: GiftOutlined,
    items: [
      {
        key: "point-rules",
        label: "积分规则与流水",
        path: "/points/rules",
        icon: AccountBookOutlined,
      },
      {
        key: "rewards",
        label: "奖励商品",
        path: "/points/rewards",
        icon: ShoppingOutlined,
      },
      {
        key: "orders",
        label: "兑换订单",
        path: "/points/orders",
        icon: ProfileOutlined,
      },
    ],
  },
  {
    key: "users",
    label: "用户",
    icon: TeamOutlined,
    items: [
      {
        key: "students",
        label: "学生管理",
        path: "/students",
        icon: UserOutlined,
      },
      {
        key: "articles",
        label: "资讯管理",
        path: "/articles",
        icon: ReadOutlined,
      },
    ],
  },
  {
    key: "data",
    label: "数据",
    icon: BarChartOutlined,
    items: [
      {
        key: "statistics",
        label: "数据统计",
        path: "/statistics",
        icon: LineChartOutlined,
      },
    ],
  },
];

function normalizePath(pathname: string) {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

function matchesPath(pathname: string, itemPath: string) {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function findGroupByPath(pathname: string) {
  const normalized = normalizePath(pathname);

  return navGroups.find((group) =>
    group.items.some((item) => matchesPath(normalized, item.path)),
  );
}

export function findItemByPath(pathname: string) {
  const normalized = normalizePath(pathname);
  const exact = navGroups
    .flatMap((group) => group.items)
    .find((item) => normalized === item.path);

  if (exact) {
    return exact;
  }

  const matches = navGroups
    .flatMap((group) => group.items)
    .filter((item) => matchesPath(normalized, item.path));

  return matches.reduce<NavItem | undefined>(
    (longest, item) =>
      !longest || item.path.length > longest.path.length ? item : longest,
    undefined,
  );
}

export function getBreadcrumb(pathname: string): BreadcrumbItem[] {
  const group = findGroupByPath(pathname);
  const item = findItemByPath(pathname);

  if (!group || !item) {
    return [];
  }

  return [{ title: group.label }, { title: item.label, path: item.path }];
}
