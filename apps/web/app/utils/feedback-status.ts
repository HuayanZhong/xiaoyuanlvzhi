export type FeedbackTone = "alive" | "pending" | "danger" | "neutral";

export type FeedbackStatusMeta = {
  label: string;
  tone: FeedbackTone;
  hint: string;
};

const STATUS_META: Record<string, FeedbackStatusMeta> = {
  PENDING: {
    label: "待处理",
    tone: "pending",
    hint: "管理员会尽快处理这条反馈。",
  },
  IN_PROGRESS: {
    label: "处理中",
    tone: "pending",
    hint: "管理员正在处理，请留意回复。",
  },
  REPLIED: {
    label: "已回复",
    tone: "alive",
    hint: "管理员已回复，确认问题解决后可关闭。",
  },
  CLOSED: {
    label: "已关闭",
    tone: "neutral",
    hint: "这条反馈已关闭。",
  },
};

const UNKNOWN_STATUS: FeedbackStatusMeta = {
  label: "状态未知",
  tone: "neutral",
  hint: "无法识别当前状态，请稍后刷新。",
};

export const FEEDBACK_TYPE_OPTIONS = [
  { value: "PLANT_ISSUE", label: "绿植问题" },
  { value: "ACCOUNT_ISSUE", label: "账号问题" },
  { value: "REWARD_ISSUE", label: "奖励问题" },
  { value: "OTHER", label: "其他" },
] as const;

export const RELATED_TYPE_OPTIONS = [
  { value: "ADOPTION", label: "领养申请" },
  { value: "CARE", label: "养护打卡" },
  { value: "TASK", label: "环保任务" },
  { value: "REDEMPTION", label: "兑换订单" },
  { value: "PLANT", label: "绿植" },
] as const;

export function feedbackStatusMeta(
  value: string | null | undefined,
): FeedbackStatusMeta {
  if (!value) {
    return UNKNOWN_STATUS;
  }

  return STATUS_META[value] ?? UNKNOWN_STATUS;
}

export function feedbackTypeLabel(value: string | null | undefined): string {
  if (!value) {
    return "未知类型";
  }

  return (
    FEEDBACK_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    "未知类型"
  );
}

export function relatedTypeLabel(value: string | null | undefined): string {
  if (!value) {
    return "关联记录";
  }

  return (
    RELATED_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

/** 关联记录展示为「领养申请 #12」；没有关联时显示占位符。 */
export function relatedRecordLabel(
  relatedType: string | null | undefined,
  relatedId: string | null | undefined,
): string {
  if (!relatedType) {
    return "—";
  }

  const label = relatedTypeLabel(relatedType);

  return relatedId ? `${label} #${relatedId}` : label;
}

/** 只有管理员已回复的反馈允许学生确认关闭。 */
export function canCloseFeedback(value: string | null | undefined): boolean {
  return value === "REPLIED";
}
