import { useApi } from "~/composables/useApi";

/** 上架奖励；`remainingStock` 由服务端扣除占用与已领取后算出。 */
export type Reward = {
  id: number;
  name: string;
  description: string | null;
  imageFileIds: number[];
  pointsCost: number;
  availableStock: number;
  reservedStock: number;
  claimedCount: number;
  remainingStock: number;
  location: string;
  pickupDays: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

/** 兑换订单；状态由服务端在兑换、取消与超时处理中维护。 */
export type RedemptionOrder = {
  id: number;
  orderNo: string;
  studentId: number;
  studentEmail: string;
  rewardId: number;
  rewardName: string;
  pointsCost: number;
  status: string;
  location: string;
  pickupDeadline: string;
  reason: string | null;
  refundedAt: string | null;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 浏览上架奖励。 */
export function listRewards() {
  return useApi().request<Reward[]>("rewards");
}

/** 兑换奖励；服务端同时扣积分、占用库存并创建订单。 */
export function redeemReward(rewardId: number) {
  return useApi().request<RedemptionOrder>(`rewards/${rewardId}/redeem`, {
    method: "POST",
  });
}

/** 当前学生的兑换订单，服务端按创建时间倒序返回。 */
export function listOrders() {
  return useApi().request<RedemptionOrder[]>("rewards/orders");
}

/** 读取一条兑换订单。 */
export function getOrder(orderId: number) {
  return useApi().request<RedemptionOrder>(`rewards/orders/${orderId}`);
}

/** 取消待领取订单；服务端退回积分并释放库存，不需要请求体。 */
export function cancelOrder(orderId: number) {
  return useApi().request<RedemptionOrder>(`rewards/orders/${orderId}/cancel`, {
    method: "POST",
  });
}
