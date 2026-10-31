import { request } from "./client";

export const ORDER_STATUSES = [
  "WAITING_PICKUP",
  "CLAIMED",
  "CANCELLED",
  "EXPIRED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type RewardView = {
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

export type OrderView = {
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

export type RewardRequest = {
  name: string;
  description: string | null;
  imageFileIds: number[];
  pointsCost: number;
  availableStock: number;
  location: string;
  pickupDays: number;
  enabled: boolean;
};

export type CancelOrderRequest = {
  reason: string;
};

const REWARDS_PATH = "admin/rewards";

export function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export function listRewards(): Promise<RewardView[]> {
  return request<RewardView[]>(REWARDS_PATH);
}

export function createReward(input: RewardRequest): Promise<RewardView> {
  return request<RewardView>(REWARDS_PATH, { method: "POST", json: input });
}

export function updateReward(
  id: number,
  input: RewardRequest,
): Promise<RewardView> {
  return request<RewardView>(`${REWARDS_PATH}/${id}`, {
    method: "PUT",
    json: input,
  });
}

export function listOrders(status?: OrderStatus): Promise<OrderView[]> {
  return request<OrderView[]>(
    `${REWARDS_PATH}/orders`,
    status ? { searchParams: { status } } : {},
  );
}

export function claimOrder(id: number): Promise<OrderView> {
  return request<OrderView>(`${REWARDS_PATH}/orders/${id}/claim`, {
    method: "POST",
  });
}

export function cancelOrder(
  id: number,
  input: CancelOrderRequest,
): Promise<OrderView> {
  return request<OrderView>(`${REWARDS_PATH}/orders/${id}/cancel`, {
    method: "POST",
    json: input,
  });
}
