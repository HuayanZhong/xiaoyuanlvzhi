import { isHTTPError, isNetworkError, isTimeoutError } from "@repo/http-client";
import type { HTTPError, KyOptions } from "@repo/http-client";
import { http } from "@/lib/http";

/** Spring 统一响应信封。 */
export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

/** 领域接口错误；`code` 保留 Spring 的业务错误码。 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiRequestOptions = Omit<KyOptions, "method" | "json"> & {
  method?: "GET" | "POST" | "PUT";
  json?: unknown;
};

/** 发送请求并返回信封中的 `data`；业务失败或 `data` 为 null 时抛出 ApiError。 */
export async function request<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  try {
    return readData(await send(path, options).json<ApiEnvelope<T>>());
  } catch (error) {
    throw toApiError(error);
  }
}

/** 发送不返回数据的请求；只检查信封的 `success`。 */
export async function requestVoid(
  path: string,
  options: ApiRequestOptions = {},
): Promise<void> {
  try {
    const body = await send(path, options).json<ApiEnvelope<null>>();

    if (!body.success) {
      throw envelopeError(body);
    }
  } catch (error) {
    throw toApiError(error);
  }
}

function send(path: string, options: ApiRequestOptions) {
  const { method = "GET", ...rest } = options;

  if (method === "POST") {
    return http.post(path, rest);
  }

  if (method === "PUT") {
    return http.put(path, rest);
  }

  return http.get(path, rest);
}

function readData<T>(body: ApiEnvelope<T>): T {
  if (!body.success || body.data === null) {
    throw envelopeError(body);
  }

  return body.data;
}

function envelopeError(body: ApiEnvelope<unknown>): ApiError {
  return new ApiError(
    body.error?.code ?? "INVALID_REQUEST",
    body.error?.message ?? "请求失败，请稍后重试",
  );
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isHTTPError(error)) {
    return fromHttpError(error);
  }

  if (isTimeoutError(error)) {
    return new ApiError("REQUEST_TIMEOUT", "请求超时，请稍后重试");
  }

  if (isNetworkError(error)) {
    return new ApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试");
  }

  return new ApiError("UNKNOWN_ERROR", "请求失败，请稍后重试");
}

function fromHttpError(error: HTTPError): ApiError {
  const payload =
    typeof error.data === "object" && error.data !== null
      ? (error.data as Partial<ApiEnvelope<unknown>>)
      : undefined;
  const status = error.response.status;

  return new ApiError(
    payload?.error?.code ?? fallbackCode(status),
    payload?.error?.message ?? fallbackMessage(status),
    status,
  );
}

function fallbackCode(status: number): string {
  if (status === 401) {
    return "UNAUTHORIZED";
  }
  if (status === 403) {
    return "FORBIDDEN";
  }
  return status >= 500 ? "UPSTREAM_UNAVAILABLE" : "INVALID_REQUEST";
}

function fallbackMessage(status: number): string {
  if (status === 401) {
    return "请先登录或重新登录";
  }
  if (status === 403) {
    return "没有执行此操作的权限";
  }
  if (status >= 500) {
    return "后端服务暂不可用，请稍后重试";
  }
  return "请求参数不正确";
}
