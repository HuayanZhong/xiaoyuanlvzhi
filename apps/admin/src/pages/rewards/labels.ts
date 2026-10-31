import type { OrderStatus, OrderView, RewardView } from "@/api/rewards";

export const REWARD_STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "enabled", label: "上架" },
  { value: "disabled", label: "下架" },
] as const;

export type RewardStatusFilter =
  (typeof REWARD_STATUS_OPTIONS)[number]["value"];

export const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "WAITING_PICKUP", label: "待领取" },
  { value: "CLAIMED", label: "已领取" },
  { value: "CANCELLED", label: "已取消" },
  { value: "EXPIRED", label: "已超时" },
] as const;

export type OrderStatusFilter = (typeof ORDER_STATUS_OPTIONS)[number]["value"];

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

export function rewardStatusLabel(enabled: boolean): string {
  return enabled ? "上架" : "下架";
}

export function rewardStatusColor(enabled: boolean): string {
  return enabled ? "green" : "default";
}

export function orderStatusLabel(value: string): string {
  return ORDER_STATUS_LABELS[value] ?? (value || "未知状态");
}

export function orderStatusColor(value: string): string {
  return ORDER_STATUS_COLORS[value] ?? "default";
}

export function stockSummary(reward: RewardView): string {
  return `剩余 ${reward.remainingStock} / 总 ${reward.availableStock}`;
}

export function stockDetail(reward: RewardView): string {
  return `已预留 ${reward.reservedStock} · 已领取 ${reward.claimedCount}`;
}

/** 待领取订单超过领取截止时间时，页面按超时展示；最终状态以服务端为准。 */
export function isOrderOverdue(
  order: Pick<OrderView, "status" | "pickupDeadline">,
  now: Date = new Date(),
): boolean {
  if (order.status !== "WAITING_PICKUP") {
    return false;
  }

  const deadline = new Date(order.pickupDeadline);

  return (
    !Number.isNaN(deadline.getTime()) && deadline.getTime() <= now.getTime()
  );
}

export function orderDisplayStatus(
  order: Pick<OrderView, "status" | "pickupDeadline">,
  now: Date = new Date(),
): OrderStatus | "OVERDUE" {
  return isOrderOverdue(order, now) ? "OVERDUE" : (order.status as OrderStatus);
}

export function orderDisplayStatusLabel(
  order: Pick<OrderView, "status" | "pickupDeadline">,
  now: Date = new Date(),
): string {
  return isOrderOverdue(order, now) ? "已超时" : orderStatusLabel(order.status);
}

export function orderDisplayStatusColor(
  order: Pick<OrderView, "status" | "pickupDeadline">,
  now: Date = new Date(),
): string {
  return isOrderOverdue(order, now) ? "red" : orderStatusColor(order.status);
}

export function isKnownOrderStatus(value: string): value is OrderStatus {
  return (
    value === "WAITING_PICKUP" ||
    value === "CLAIMED" ||
    value === "CANCELLED" ||
    value === "EXPIRED"
  );
}
