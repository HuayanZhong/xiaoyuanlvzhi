import ky, { type KyInstance, type Options } from "ky";

/** 默认请求超时时间（毫秒）。 */
export const DEFAULT_TIMEOUT_MS = 15_000;

/** 默认重试上限。 */
export const DEFAULT_RETRY_LIMIT = 2;

/** `createHttpClient` 的配置；`baseUrl` 必填，其余选项透传给 ky。 */
export type HttpClientOptions = Omit<Options, "baseUrl"> & {
  baseUrl: string | URL;
};

/**
 * 创建工作区统一的 ky HTTP 客户端。
 *
 * 共享包不读取任何环境变量，调用方必须显式传入 `baseUrl`；
 * 未来根目录环境模块只需替换应用侧适配层。
 *
 * `baseUrl` 会自动补全末尾斜杠。请求路径应使用 `health` 这类相对路径；
 * 以 `/` 开头的路径会按 ky 语义解析到站点根路径，从而绕过 `baseUrl`。
 *
 * @example
 * const http = createHttpClient({ baseUrl: "/api/" });
 * const health = await http.get("health").json<{ status: string }>();
 */
export function createHttpClient({
  baseUrl,
  timeout = DEFAULT_TIMEOUT_MS,
  retry = { limit: DEFAULT_RETRY_LIMIT },
  ...options
}: HttpClientOptions): KyInstance {
  return ky.create({
    ...options,
    baseUrl: normalizeBaseUrl(baseUrl),
    retry,
    timeout,
  });
}

/** 将 base URL 归一化为以 `/` 结尾，并拒绝空白值。 */
function normalizeBaseUrl(baseUrl: string | URL): string {
  const value = baseUrl instanceof URL ? baseUrl.toString() : baseUrl.trim();

  if (value.length === 0) {
    throw new TypeError("baseUrl must not be empty");
  }

  return value.endsWith("/") ? value : `${value}/`;
}
