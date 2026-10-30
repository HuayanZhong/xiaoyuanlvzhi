export const DIFFICULTY_OPTIONS = [
  { value: "EASY", label: "简单" },
  { value: "MEDIUM", label: "一般" },
  { value: "HARD", label: "较难" },
] as const;

export const SPECIES_STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "enabled", label: "启用" },
  { value: "disabled", label: "停用" },
] as const;

export const INDIVIDUAL_STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "AVAILABLE", label: "可领养" },
  { value: "WAITING_PICKUP", label: "待领取" },
  { value: "ACTIVE", label: "养护中" },
  { value: "MAINTENANCE", label: "维护中" },
  { value: "DISABLED", label: "已停用" },
] as const;

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "简单",
  MEDIUM: "一般",
  HARD: "较难",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "可领养",
  WAITING_PICKUP: "待领取",
  ACTIVE: "养护中",
  MAINTENANCE: "维护中",
  DISABLED: "已停用",
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "green",
  WAITING_PICKUP: "blue",
  ACTIVE: "cyan",
  MAINTENANCE: "orange",
  DISABLED: "default",
};

export function difficultyLabel(value: string): string {
  return DIFFICULTY_LABELS[value] ?? value;
}

export function statusLabel(value: string): string {
  return STATUS_LABELS[value] ?? value;
}

export function statusColor(value: string): string {
  return STATUS_COLORS[value] ?? "default";
}
