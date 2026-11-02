import { clearNuxtData } from "#app";

/** 已读或全部已读后清空共享通知缓存，首页、“我的”和通知页同时失效。 */
export function clearNotificationCache(): void {
  clearNuxtData("notifications");
}
