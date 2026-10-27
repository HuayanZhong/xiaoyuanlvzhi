export {
  createHttpClient,
  DEFAULT_RETRY_LIMIT,
  DEFAULT_TIMEOUT_MS,
  type HttpClientOptions,
} from "./client";

/**
 * 错误模型沿用 ky 原生类型：非 2xx 响应抛出 `HTTPError`，
 * 网络故障抛出 `NetworkError`，超时抛出 `TimeoutError`。
 * 类型守卫可直接用于区分这些失败，无需业务代码依赖 ky。
 */
export {
  HTTPError,
  isHTTPError,
  isNetworkError,
  isTimeoutError,
  NetworkError,
  TimeoutError,
} from "ky";

export type { KyInstance, Options as KyOptions } from "ky";
