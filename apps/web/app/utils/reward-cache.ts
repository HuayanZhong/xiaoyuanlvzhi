import { clearNuxtData } from "#app";

/**
 * 兑换与取消会同时改变余额、库存和订单，清掉其他页面的缓存键，
 * 让它们下次进入时重新取数，避免看到旧余额或旧库存。
 */
export function clearRewardCaches(): void {
  clearNuxtData("points");
  clearNuxtData("rewards");
  clearNuxtData("rewards-orders");
}
