import type { Reward } from "./reward-api";

export type OrderStatusTone = "alive" | "pending" | "danger" | "neutral";

export type OrderStatusMeta = {
  label: string;
  tone: OrderStatusTone;
  hint: string;
};

const ORDER_STATUS: Record<string, OrderStatusMeta> = {
  WAITING_PICKUP: {
    label: "待领取",
    tone: "pending",
    hint: "请在截止时间前到领取地点线下领取。",
  },
  CLAIMED: {
    label: "已领取",
    tone: "alive",
    hint: "奖励已领取完成。",
  },
  CANCELLED: {
    label: "已取消",
    tone: "neutral",
    hint: "订单已取消，积分已退回。",
  },
  EXPIRED: {
    label: "已超时",
    tone: "neutral",
    hint: "超过领取期限，积分已退回。",
  },
};

/** 订单状态的中文标签与印章语气；未知状态按只读处理。 */
export function orderStatusMeta(status: string): OrderStatusMeta {
  return (
    ORDER_STATUS[status] ?? {
      label: "状态未知",
      tone: "neutral",
      hint: "请联系管理员确认订单状态。",
    }
  );
}

/** 只有待领取订单可以取消。 */
export function canCancelOrder(status: string): boolean {
  return status === "WAITING_PICKUP";
}

export type RedeemBlockReason =
  | "out-of-stock"
  | "insufficient-points"
  | "balance-unavailable";

export type RedeemCheck =
  | { allowed: true; reason: null; label: "" }
  | { allowed: false; reason: RedeemBlockReason; label: string };

/** 能否兑换：先看库存，再看余额；`balance` 为 `null` 表示余额未取到。 */
export function canRedeem(
  reward: Pick<Reward, "pointsCost" | "remainingStock">,
  balance: number | null,
): RedeemCheck {
  if (reward.remainingStock <= 0) {
    return { allowed: false, reason: "out-of-stock", label: "库存不足" };
  }

  if (balance === null) {
    return {
      allowed: false,
      reason: "balance-unavailable",
      label: "暂时无法核对积分",
    };
  }

  if (balance < reward.pointsCost) {
    return { allowed: false, reason: "insufficient-points", label: "积分不足" };
  }

  return { allowed: true, reason: null, label: "" };
}
