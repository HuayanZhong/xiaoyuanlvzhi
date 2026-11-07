/** 学生端唯一允许使用的同源 API 前缀。 */
export const API_PREFIX = "/api/v1";

/** 学生端 API base 的默认值，与 Spring 的 `/api/v1` 对齐。 */
export const DEFAULT_API_BASE_URL = `${API_PREFIX}/`;

/** Spring 的统一响应信封。 */
export type SpringEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

/**
 * 解析 web 的 API base URL；未配置或为空白时回退到默认值。
 *
 * 共享 HTTP 客户端会按相对路径拼接 base URL，因此返回值保留末尾斜杠。
 */
export function resolveApiBaseUrl(value: string | undefined): string {
  return value?.trim() || DEFAULT_API_BASE_URL;
}

/**
 * 计算 Nitro 代理的目标地址。
 *
 * `path` 是 `/api` 之后的通配段（例如 `v1/auth/login`），拼接时必须补回
 * `/api` 前缀；两端斜杠先归一化，避免出现 `//` 或重复的 `/api`。
 * `search` 是浏览器请求的原始查询串（含 `?`），必须一并转发，否则筛选
 * 和分页参数会在代理层丢失。
 */
export function resolveSpringApiTarget(
  origin: string,
  path: string,
  search = "",
): string {
  return resolveSpringTarget(origin, "/api", path, search);
}

/** 解析 `/api/v1/*` Nitro 路由对应的 Spring 目标地址。 */
export function resolveSpringApiV1Target(
  origin: string,
  path: string,
  search = "",
): string {
  return resolveSpringTarget(origin, API_PREFIX, path, search);
}

function resolveSpringTarget(
  origin: string,
  prefix: string,
  path: string,
  search: string,
): string {
  const targetOrigin = origin.replace(/\/+$/, "");
  const targetPath = path.replace(/^\/+/, "");
  const target = targetPath
    ? `${targetOrigin}${prefix}/${targetPath}`
    : `${targetOrigin}${prefix}`;

  if (!search) {
    return target;
  }

  return `${target}${search.startsWith("?") ? search : `?${search}`}`;
}
