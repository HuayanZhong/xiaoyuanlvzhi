import type { StudentRecordView } from "@/api/accounts";

export const STUDENT_STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "ACTIVE", label: "正常" },
  { value: "DISABLED", label: "已禁用" },
] as const;

export type StudentStatusFilter =
  (typeof STUDENT_STATUS_OPTIONS)[number]["value"];

const STUDENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "正常",
  DISABLED: "已禁用",
};

const STUDENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "green",
  DISABLED: "default",
};

const ADOPTION_STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "待审核",
  REJECTED: "已驳回",
  WAITING_PICKUP: "待领取",
  CANCEL_REVIEW: "取消审核中",
  ACTIVE: "养护中",
  RETURN_REVIEW: "归还审核中",
  ENDED: "已结束",
  CANCELLED: "已取消",
};

const ADOPTION_STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "gold",
  REJECTED: "red",
  WAITING_PICKUP: "blue",
  CANCEL_REVIEW: "orange",
  ACTIVE: "green",
  RETURN_REVIEW: "purple",
  ENDED: "default",
  CANCELLED: "default",
};

const CARE_STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "待审核",
  APPROVED: "已通过",
  REJECTED: "已驳回",
};

const CARE_STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "gold",
  APPROVED: "green",
  REJECTED: "red",
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

const ORDER_STATUS_LABELS: Record<string, string> = {
  WAITING_PICKUP: "待领取",
  CLAIMED: "已领取",
  CANCELLED: "已取消",
  EXPIRED: "已超时",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  WAITING_PICKUP: "gold",
  CLAIMED: "green",
  CANCELLED: "default",
  EXPIRED: "red",
};

const POINT_SOURCE_LABELS: Record<string, string> = {
  CARE_CHECKIN: "养护打卡",
  ECO_TASK: "环保任务",
  REDEMPTION: "奖励兑换",
  REDEMPTION_REFUND: "兑换退回",
  ADJUSTMENT: "人工调整",
};

const UNKNOWN = "未知状态";

export function studentStatusLabel(value: string): string {
  return STUDENT_STATUS_LABELS[value] ?? (value || UNKNOWN);
}

export function studentStatusColor(value: string): string {
  return STUDENT_STATUS_COLORS[value] ?? "default";
}

export function studentDisplayName(
  student: Pick<StudentRecordView, "fullName" | "email">,
): string {
  return student.fullName || student.email;
}

export function adoptionHistoryStatusLabel(value: string): string {
  return ADOPTION_STATUS_LABELS[value] ?? (value || UNKNOWN);
}

export function adoptionHistoryStatusColor(value: string): string {
  return ADOPTION_STATUS_COLORS[value] ?? "default";
}

export function careHistoryStatusLabel(value: string): string {
  return CARE_STATUS_LABELS[value] ?? (value || UNKNOWN);
}

export function careHistoryStatusColor(value: string): string {
  return CARE_STATUS_COLORS[value] ?? "default";
}

export function participationHistoryStatusLabel(value: string | null): string {
  return value ? (PARTICIPATION_STATUS_LABELS[value] ?? value) : "—";
}

export function participationHistoryStatusColor(value: string | null): string {
  return value ? (PARTICIPATION_STATUS_COLORS[value] ?? "default") : "default";
}

export function orderHistoryStatusLabel(value: string): string {
  return ORDER_STATUS_LABELS[value] ?? (value || UNKNOWN);
}

export function orderHistoryStatusColor(value: string): string {
  return ORDER_STATUS_COLORS[value] ?? "default";
}

export function pointSourceLabel(value: string): string {
  return POINT_SOURCE_LABELS[value] ?? (value || "未知来源");
}

export function formatPointDelta(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
