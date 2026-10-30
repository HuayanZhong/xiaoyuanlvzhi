import type { AdoptionStatus, ReturnResult } from "@/api/adoptions";

export const ADOPTION_STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "PENDING_REVIEW", label: "待审核" },
  { value: "REJECTED", label: "已驳回" },
  { value: "WAITING_PICKUP", label: "待领取" },
  { value: "CANCEL_REVIEW", label: "取消审核中" },
  { value: "ACTIVE", label: "养护中" },
  { value: "RETURN_REVIEW", label: "归还审核中" },
  { value: "ENDED", label: "已结束" },
  { value: "CANCELLED", label: "已取消" },
] as const satisfies ReadonlyArray<{
  value: "all" | AdoptionStatus;
  label: string;
}>;

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "待审核",
  REJECTED: "已驳回",
  WAITING_PICKUP: "待领取",
  CANCEL_REVIEW: "取消审核中",
  ACTIVE: "养护中",
  RETURN_REVIEW: "归还审核中",
  ENDED: "已结束",
  CANCELLED: "已取消",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "gold",
  REJECTED: "red",
  WAITING_PICKUP: "blue",
  CANCEL_REVIEW: "orange",
  ACTIVE: "green",
  RETURN_REVIEW: "purple",
  ENDED: "default",
  CANCELLED: "default",
};

const RETURN_RESULT_LABELS: Record<ReturnResult, string> = {
  AVAILABLE: "重新开放领养",
  MAINTENANCE: "转入维护",
};

export function adoptionStatusLabel(value: string): string {
  return STATUS_LABELS[value] ?? value;
}

export function adoptionStatusColor(value: string): string {
  return STATUS_COLORS[value] ?? "default";
}

export function returnResultLabel(value: string | null): string {
  if (!value) {
    return "—";
  }

  return RETURN_RESULT_LABELS[value as ReturnResult] ?? value;
}
