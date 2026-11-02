import { clearNuxtData } from "#app";

/**
 * 资料更新后清空首页缓存，让首页重新取数。
 *
 * 当前页面用 `PUT profile` 的返回值就地更新，不能再清自己的 `me-profile`，
 * 否则正在挂载的 `useAsyncData` 会被重置成空数据。
 */
export function clearHomeProfileCache(): void {
  clearNuxtData("home-profile");
}
