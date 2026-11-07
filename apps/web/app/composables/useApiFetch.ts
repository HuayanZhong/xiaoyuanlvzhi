/**
 * 带统一 `/api/v1/` 基地址与 Nitro 请求上下文的 Nuxt useFetch。
 *
 * 首屏 GET 应优先使用它；多请求组合使用 useAsyncData + `$apiFetch`。
 */
export const useApiFetch = createUseFetch(() => ({
  $fetch: useNuxtApp().$apiFetch as typeof $fetch,
}));
