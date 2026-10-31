import type { FeedbackStatus, FeedbackType } from "@/api/feedback";

export const FEEDBACK_STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "PENDING", label: "待处理" },
  { value: "IN_PROGRESS", label: "处理中" },
  { value: "REPLIED", label: "已回复" },
  { value: "CLOSED", label: "已关闭" },
] as const;

export type FeedbackStatusFilter =
  (typeof FEEDBACK_STATUS_OPTIONS)[number]["value"];

export const FEEDBACK_TYPE_OPTIONS = [
  { value: "all", label: "全部类型" },
  { value: "PLANT_ISSUE", label: "绿植问题" },
  { value: "ACCOUNT_ISSUE", label: "账号问题" },
  { value: "REWARD_ISSUE", label: "奖励问题" },
  { value: "OTHER", label: "其他" },
] as const;

export type FeedbackTypeFilter =
  (typeof FEEDBACK_TYPE_OPTIONS)[number]["value"];

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  PENDING: "待处理",
  IN_PROGRESS: "处理中",
  REPLIED: "已回复",
  CLOSED: "已关闭",
};

const STATUS_COLORS: Record<FeedbackStatus, string> = {
  PENDING: "gold",
  IN_PROGRESS: "blue",
  REPLIED: "green",
  CLOSED: "default",
};

const TYPE_LABELS: Record<FeedbackType, string> = {
  PLANT_ISSUE: "绿植问题",
  ACCOUNT_ISSUE: "账号问题",
  REWARD_ISSUE: "奖励问题",
  OTHER: "其他",
};

const RELATED_TYPE_LABELS: Record<string, string> = {
  ADOPTION: "领养申请",
  CARE: "养护打卡",
  TASK: "环保任务",
  REDEMPTION: "兑换订单",
  REWARD: "奖励商品",
  PLANT: "绿植",
};

export function feedbackStatusLabel(value: string): string {
  return STATUS_LABELS[value as FeedbackStatus] ?? (value || "未知状态");
}

export function feedbackStatusColor(value: string): string {
  return STATUS_COLORS[value as FeedbackStatus] ?? "default";
}

export function feedbackTypeLabel(value: string): string {
  return TYPE_LABELS[value as FeedbackType] ?? (value || "未知类型");
}

export function relatedBusinessLabel(
  relatedType: string | null,
  relatedId: string | null,
): string {
  if (!relatedType) {
    return "—";
  }

  const label = RELATED_TYPE_LABELS[relatedType] ?? relatedType;

  return relatedId ? `${label} #${relatedId}` : label;
}

export function isFeedbackStatusFilter(
  value: string,
): value is FeedbackStatusFilter {
  return FEEDBACK_STATUS_OPTIONS.some((option) => option.value === value);
}

export function isFeedbackTypeFilter(
  value: string,
): value is FeedbackTypeFilter {
  return FEEDBACK_TYPE_OPTIONS.some((option) => option.value === value);
}
