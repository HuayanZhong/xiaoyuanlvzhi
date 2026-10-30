import type { CareCheckinStatus, PointsSource } from "@/api/care";

export const CARE_STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "PENDING_REVIEW", label: "待审核" },
  { value: "APPROVED", label: "已通过" },
  { value: "REJECTED", label: "已驳回" },
] as const satisfies ReadonlyArray<{
  value: "all" | CareCheckinStatus;
  label: string;
}>;

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "待审核",
  APPROVED: "已通过",
  REJECTED: "已驳回",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "gold",
  APPROVED: "green",
  REJECTED: "red",
};

const POINTS_SOURCE_LABELS: Record<PointsSource, string> = {
  RULE: "积分规则",
  SPECIES: "品种积分",
  NONE: "未配置",
};

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "正常",
  DISABLED: "已禁用",
};

const PLANT_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "可领养",
  WAITING_PICKUP: "待领取",
  ACTIVE: "养护中",
  MAINTENANCE: "维护中",
  DISABLED: "已停用",
};

/** 未知状态回退到原始值，避免页面出现空白或崩溃。 */
export function careStatusLabel(value: string): string {
  return STATUS_LABELS[value] ?? (value || "未知状态");
}

export function careStatusColor(value: string): string {
  return STATUS_COLORS[value] ?? "default";
}

export function pointsSourceLabel(value: string): string {
  return POINTS_SOURCE_LABELS[value as PointsSource] ?? (value || "未知来源");
}

export function accountStatusLabel(value: string): string {
  return ACCOUNT_STATUS_LABELS[value] ?? (value || "未知状态");
}

export function plantStatusLabel(value: string): string {
  return PLANT_STATUS_LABELS[value] ?? (value || "未知状态");
}
