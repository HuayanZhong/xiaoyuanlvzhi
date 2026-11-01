import { createHttpClient, type KyInstance } from "@repo/http-client";
import { getToken } from "./token";

/** Spring 的统一响应信封。 */
export type SpringEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

/** 适配层对页面暴露的稳定错误对象。 */
export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** 显式 token 只用于注销等一次性请求；`undefined` 读取当前登录态，`null` 表示匿名。 */
  token?: string | null;
  signal?: AbortSignal;
  retry?: number;
  /** 注销等无返回数据的操作传 `false`；默认要求成功响应带 data。 */
  expectData?: boolean;
};

export type ApiClientOptions = {
  baseUrl: string;
  client?: KyInstance;
  fetch?: typeof globalThis.fetch;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
};

export type ApiClient = {
  request<T>(path: string, options?: ApiRequestOptions): Promise<T>;
};

const AUTH_ACTION_PREFIXES = [
  "auth/login",
  "auth/register",
  "auth/email-code",
  "auth/logout",
];

/**
 * 创建学生端 API 适配层。
 *
 * `@repo/http-client` 只负责传输；Spring 信封、Bearer 注入和 401 事件
 * 都留在这里。请求路径必须相对 base URL，避免绕过 `/api/v1/`。
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  const client =
    options.client ??
    createHttpClient({
      baseUrl: options.baseUrl,
      ...(options.fetch ? { fetch: options.fetch } : {}),
    });
  const readToken = options.getToken ?? getToken;
  const onUnauthorized = options.onUnauthorized ?? (() => {});

  return {
    async request<T>(path: string, requestOptions: ApiRequestOptions = {}) {
      assertRelativePath(path);

      const {
        method = "GET",
        body,
        token,
        signal,
        retry,
        expectData = true,
      } = requestOptions;
      const headers = new Headers();
      const accessToken = token === undefined ? readToken() : token;

      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }

      let response: Response;

      try {
        response = await client(path, {
          method,
          headers,
          signal,
          retry: retry ?? (isAuthAction(path) ? 0 : undefined),
          throwHttpErrors: false,
          ...(body === undefined ? {} : { json: body }),
        });
      } catch (error) {
        throw transportError(error);
      }

      if (response.status === 401 && !isAuthAction(path)) {
        onUnauthorized();
      }

      const envelope = await readEnvelope(response);

      if (response.ok) {
        if (!envelope) {
          throw new ApiError(
            "INVALID_RESPONSE",
            "服务返回了无法识别的响应",
            response.status,
          );
        }

        if (!envelope.success) {
          throw businessError(envelope, response.status);
        }

        if (envelope.data === null && expectData) {
          throw new ApiError(
            "EMPTY_RESPONSE",
            "服务未返回数据，请稍后重试",
            response.status,
          );
        }

        return envelope.data as T;
      }

      if (envelope && !envelope.success && envelope.error) {
        throw new ApiError(
          envelope.error.code,
          envelope.error.message,
          response.status,
        );
      }

      throw statusError(response.status);
    },
  };
}

function assertRelativePath(path: string): void {
  if (path.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(path)) {
    throw new ApiError(
      "INVALID_REQUEST_PATH",
      "API 请求路径必须相对于配置的 base URL",
    );
  }
}

function isAuthAction(path: string): boolean {
  return AUTH_ACTION_PREFIXES.some((prefix) => path.startsWith(prefix));
}

async function readEnvelope(
  response: Response,
): Promise<SpringEnvelope<unknown> | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(text);

    if (isEnvelope(value)) {
      return value;
    }

    return null;
  } catch {
    return null;
  }
}

function isEnvelope(value: unknown): value is SpringEnvelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof (value as { success: unknown }).success === "boolean"
  );
}

function businessError(
  envelope: SpringEnvelope<unknown>,
  status: number,
): ApiError {
  const error = envelope.error;

  return new ApiError(
    error?.code ?? "UNKNOWN_ERROR",
    error?.message ?? "请求失败，请稍后重试",
    status,
  );
}

function statusError(status: number): ApiError {
  if (status === 401) {
    return new ApiError("UNAUTHORIZED", "登录已过期，请重新登录", status);
  }

  if (status === 403) {
    return new ApiError("FORBIDDEN", "没有权限执行此操作", status);
  }

  if (status >= 500) {
    return new ApiError("UPSTREAM_ERROR", "服务暂时不可用，请稍后重试", status);
  }

  return new ApiError("HTTP_ERROR", "请求失败，请稍后重试", status);
}

function transportError(error: unknown): ApiError {
  if (error instanceof Error && error.name === "TimeoutError") {
    return new ApiError("REQUEST_TIMEOUT", "请求超时，请稍后重试");
  }

  return new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试");
}
