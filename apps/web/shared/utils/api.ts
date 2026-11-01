/** 学生端 API base 的默认值，与 Spring 的 `/api/v1` 对齐。 */
export const DEFAULT_API_BASE_URL = "/api/v1/";

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
  const targetOrigin = origin.replace(/\/+$/, "");
  const targetPath = path.replace(/^\/+/, "");
  const target = targetPath
    ? `${targetOrigin}/api/${targetPath}`
    : `${targetOrigin}/api`;

  if (!search) {
    return target;
  }

  return `${target}${search.startsWith("?") ? search : `?${search}`}`;
}
