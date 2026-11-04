import type { AsyncDataOptions } from "#app";

/**
 * 页面数据的 `useAsyncData` 包装：客户端返回页面时先用上一次数据渲染，
 * 再在后台刷新，避免每次返回都整页等待。
 *
 * 缓存随 Nuxt payload 存活；退出登录或切换账号时必须调用 `clearNuxtData()`。
 */
export function usePageData<T>(
  key: string | (() => string),
  handler: () => Promise<T>,
  options: AsyncDataOptions<T> = {},
) {
  return useAsyncData<T>(key, handler, {
    ...options,
    getCachedData: (cacheKey, nuxtApp, context) => {
      // 手动/钩子刷新必须重新请求，不能用旧数据短路。
      if (
        context.cause === "refresh:manual" ||
        context.cause === "refresh:hook"
      ) {
        return undefined;
      }

      return nuxtApp.payload.data[cacheKey] ?? nuxtApp.static.data[cacheKey];
    },
  });
}
