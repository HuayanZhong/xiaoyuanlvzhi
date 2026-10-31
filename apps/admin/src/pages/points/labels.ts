import type { FrequencyPeriod, PointSource, RuleSource } from "@/api/points";
import type { PointRuleView } from "@/api/points";

export const RULE_SOURCE_OPTIONS = [
  { value: "all", label: "全部来源" },
  { value: "CARE_CHECKIN", label: "养护打卡" },
  { value: "ECO_TASK", label: "环保任务" },
] as const;

export const POINT_SOURCE_OPTIONS = [
  { value: "all", label: "全部来源" },
  { value: "CARE_CHECKIN", label: "养护打卡" },
  { value: "ECO_TASK", label: "环保任务" },
  { value: "REDEMPTION", label: "奖励兑换" },
  { value: "REDEMPTION_REFUND", label: "兑换退回" },
  { value: "ADJUSTMENT", label: "人工调整" },
] as const;

export const DIRECTION_OPTIONS = [
  { value: "all", label: "全部方向" },
  { value: "income", label: "收入" },
  { value: "expense", label: "支出" },
] as const;

export type LedgerDirection = (typeof DIRECTION_OPTIONS)[number]["value"];

const RULE_SOURCE_LABELS: Record<string, string> = {
  CARE_CHECKIN: "养护打卡",
  ECO_TASK: "环保任务",
};

const FREQUENCY_PERIOD_LABELS: Record<string, string> = {
  DAILY: "每日",
  WEEKLY: "每周",
};

const POINT_SOURCE_LABELS: Record<string, string> = {
  CARE_CHECKIN: "养护打卡",
  ECO_TASK: "环保任务",
  REDEMPTION: "奖励兑换",
  REDEMPTION_REFUND: "兑换退回",
  ADJUSTMENT: "人工调整",
};

/** 未知值回退原始字符串，避免历史来源导致空白。 */
export function ruleSourceLabel(value: string): string {
  return RULE_SOURCE_LABELS[value] ?? (value || "未知来源");
}

export function frequencyPeriodLabel(value: string | null): string {
  return value ? (FREQUENCY_PERIOD_LABELS[value] ?? value) : "不限";
}

export function frequencySummary(
  rule: Pick<PointRuleView, "frequencyLimit" | "frequencyPeriod">,
): string {
  if (rule.frequencyLimit == null || rule.frequencyPeriod == null) {
    return "不限";
  }

  return `${frequencyPeriodLabel(rule.frequencyPeriod)} ${rule.frequencyLimit} 次`;
}

export function pointSourceLabel(value: string): string {
  return POINT_SOURCE_LABELS[value] ?? (value || "未知来源");
}

export function directionLabel(value: LedgerDirection): string {
  return (
    DIRECTION_OPTIONS.find((option) => option.value === value)?.label ??
    "全部方向"
  );
}

export function ruleStatusLabel(enabled: boolean): string {
  return enabled ? "启用" : "停用";
}

export function formatDelta(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function isKnownRuleSource(value: string): value is RuleSource {
  return value === "CARE_CHECKIN" || value === "ECO_TASK";
}

export function isKnownFrequencyPeriod(
  value: string | null,
): value is FrequencyPeriod {
  return value === "DAILY" || value === "WEEKLY";
}

export function isKnownPointSource(value: string): value is PointSource {
  return (
    value === "CARE_CHECKIN" ||
    value === "ECO_TASK" ||
    value === "REDEMPTION" ||
    value === "REDEMPTION_REFUND" ||
    value === "ADJUSTMENT"
  );
}
