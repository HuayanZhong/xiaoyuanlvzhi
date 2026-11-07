import type { $Fetch } from "nitropack";
import type { SpringEnvelope } from "~~/shared/utils/api";

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
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** 注销等无返回数据的操作传 `false`。 */
  expectData?: boolean;
};

export type FormRequestOptions = {
  signal?: AbortSignal;
  expectData?: boolean;
};

export type ApiClientOptions = {
  fetch: $Fetch;
  onUnauthorized?: () => void;
};

export type ApiClient = {
  request<T>(path: string, options?: ApiRequestOptions): Promise<T>;
  requestForm<T>(
    path: string,
    form: FormData,
    options?: FormRequestOptions,
  ): Promise<T>;
  requestBlob(path: string, options?: { signal?: AbortSignal }): Promise<Blob>;
};

const AUTH_ACTION_PREFIXES = [
  "auth/login",
  "auth/register",
  "auth/email-code",
  "auth/logout",
];

/**
 * 以 Nuxt `$fetch` 为唯一传输层，统一解析 Spring 响应信封。
 *
 * 所有路径都保持相对同源 `/api/v1/`，SSR 由 `useRequestFetch` 把当前请求
 * 带入 Nitro，浏览器则由同一 Cookie 驱动服务端认证。
 */
export function createApiClient(options: ApiClientOptions): ApiClient {
  const onUnauthorized = options.onUnauthorized ?? (() => {});

  return {
    async request<T>(path: string, requestOptions: ApiRequestOptions = {}) {
      assertRelativePath(path);

      const {
        method = "GET",
        body,
        signal,
        expectData = true,
      } = requestOptions;
      let response;

      try {
        response = await options.fetch.raw<SpringEnvelope<T>>(`/${path}`, {
          method,
          body: body as BodyInit | Record<string, unknown> | undefined,
          signal,
          ignoreResponseError: true,
        });
      } catch (error) {
        throw transportError(error);
      }

      if (response.status === 401 && !isAuthAction(path)) {
        onUnauthorized();
      }

      // oxlint-disable-next-line eslint/no-underscore-dangle -- ofetch raw response
      return unwrapEnvelope<T>(response._data, response.status, expectData);
    },

    async requestForm<T>(
      path: string,
      form: FormData,
      formOptions: FormRequestOptions = {},
    ) {
      assertRelativePath(path);

      let response;

      try {
        response = await options.fetch.raw<SpringEnvelope<T>>(`/${path}`, {
          method: "POST",
          body: form,
          signal: formOptions.signal,
          ignoreResponseError: true,
        });
      } catch (error) {
        throw transportError(error);
      }

      if (response.status === 401) {
        onUnauthorized();
      }

      // oxlint-disable-next-line eslint/no-underscore-dangle -- ofetch raw response
      const data = response._data;

      return unwrapEnvelope<T>(
        data,
        response.status,
        formOptions.expectData ?? true,
      );
    },

    async requestBlob(path: string, blobOptions = {}) {
      assertRelativePath(path);

      let response;

      try {
        response = await options.fetch.raw<Blob>(`/${path}`, {
          method: "GET",
          responseType: "blob",
          signal: blobOptions.signal,
          ignoreResponseError: true,
        });
      } catch (error) {
        throw transportError(error);
      }

      if (response.status === 401) {
        onUnauthorized();
      }

      // oxlint-disable-next-line eslint/no-underscore-dangle -- ofetch raw response
      if (!response.ok || !(response._data instanceof Blob)) {
        throw statusError(response.status);
      }

      // oxlint-disable-next-line eslint/no-underscore-dangle -- ofetch raw response
      return response._data;
    },
  };
}

function wrapEnvelopeData<T>(value: unknown): {
  envelope: SpringEnvelope<T> | null;
  status: number;
} {
  if (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof value.success === "boolean"
  ) {
    return { envelope: value as SpringEnvelope<T>, status: 200 };
  }

  return { envelope: null, status: 200 };
}

function unwrapEnvelope<T>(
  value: unknown,
  status: number,
  expectData: boolean,
): T {
  const envelope = parseEnvelope<T>(value);
  const effectiveStatus = status || wrapEnvelopeData<T>(value).status;

  if (effectiveStatus >= 200 && effectiveStatus < 300) {
    if (!envelope) {
      throw new ApiError(
        "INVALID_RESPONSE",
        "服务返回了无法识别的响应",
        effectiveStatus,
      );
    }

    if (!envelope.success) {
      throw businessError(envelope, effectiveStatus);
    }

    if (envelope.data === null && expectData) {
      throw new ApiError(
        "EMPTY_RESPONSE",
        "服务未返回数据，请稍后重试",
        effectiveStatus,
      );
    }

    return envelope.data as T;
  }

  if (envelope && !envelope.success && envelope.error) {
    throw businessError(envelope, effectiveStatus);
  }

  throw statusError(effectiveStatus);
}

function parseEnvelope<T>(value: unknown): SpringEnvelope<T> | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("success" in value) ||
    typeof value.success !== "boolean"
  ) {
    return null;
  }

  return value as SpringEnvelope<T>;
}

function assertRelativePath(path: string): void {
  if (path.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(path)) {
    throw new ApiError(
      "INVALID_REQUEST_PATH",
      "API 请求路径必须相对于 /api/v1/",
    );
  }
}

function isAuthAction(path: string): boolean {
  return AUTH_ACTION_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function businessError<T>(
  envelope: SpringEnvelope<T>,
  status: number,
): ApiError {
  return new ApiError(
    envelope.error?.code ?? "UNKNOWN_ERROR",
    envelope.error?.message ?? "请求失败，请稍后重试",
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

  if (status === 502) {
    return new ApiError(
      "UPSTREAM_UNAVAILABLE",
      "服务暂时不可用，请稍后重试",
      status,
    );
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

export type { SpringEnvelope };
