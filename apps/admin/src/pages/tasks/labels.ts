import type { ParticipationStatus, TaskStatus } from "@/api/tasks";

export const TASK_STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "DRAFT", label: "草稿" },
  { value: "UPCOMING", label: "未开始" },
  { value: "ONGOING", label: "进行中" },
  { value: "ENDED", label: "已结束" },
  { value: "STOPPED", label: "已停用" },
] as const satisfies ReadonlyArray<{
  value: "all" | TaskStatus;
  label: string;
}>;

export const PARTICIPATION_STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "PENDING_REVIEW", label: "待审核" },
  { value: "APPROVED", label: "已通过" },
  { value: "REJECTED", label: "已驳回" },
  { value: "JOINED", label: "已报名未提交" },
] as const satisfies ReadonlyArray<{
  value: "all" | ParticipationStatus;
  label: string;
}>;

const TASK_STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  UPCOMING: "未开始",
  ONGOING: "进行中",
  ENDED: "已结束",
  STOPPED: "已停用",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  DRAFT: "default",
  UPCOMING: "blue",
  ONGOING: "green",
  ENDED: "default",
  STOPPED: "red",
};

const PARTICIPATION_STATUS_LABELS: Record<string, string> = {
  JOINED: "已报名未提交",
  PENDING_REVIEW: "待审核",
  APPROVED: "已通过",
  REJECTED: "已驳回",
};

const PARTICIPATION_STATUS_COLORS: Record<string, string> = {
  JOINED: "default",
  PENDING_REVIEW: "gold",
  APPROVED: "green",
  REJECTED: "red",
};

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "正常",
  DISABLED: "已禁用",
};

/** 未知状态回退到原始值，避免页面出现空白或崩溃。 */
export function taskStatusLabel(value: string): string {
  return TASK_STATUS_LABELS[value] ?? (value || "未知状态");
}

export function taskStatusColor(value: string): string {
  return TASK_STATUS_COLORS[value] ?? "default";
}

export function participationStatusLabel(value: string): string {
  return PARTICIPATION_STATUS_LABELS[value] ?? (value || "未知状态");
}

export function participationStatusColor(value: string): string {
  return PARTICIPATION_STATUS_COLORS[value] ?? "default";
}

export function accountStatusLabel(value: string): string {
  return ACCOUNT_STATUS_LABELS[value] ?? (value || "未知状态");
}
