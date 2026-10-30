import { isHTTPError, isNetworkError, isTimeoutError } from "@repo/http-client";
import type { HTTPError } from "@repo/http-client";
import { http } from "@/lib/http";

/** Spring 账号视图；角色和状态保留为字符串，未知值按非 ADMIN 处理。 */
export type AdminAccount = {
  id: number;
  email: string;
  role: string;
  status: string;
  fullName: string | null;
  studentNumber: string | null;
  department: string | null;
  className: string | null;
  phone: string | null;
};

/** Spring 登录成功时返回的认证结果。 */
export type AuthResult = {
  tokenType: string;
  accessToken: string;
  expiresAt: string;
  account: AdminAccount;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

/** 认证接口错误；`code` 保留 Spring 的业务错误码。 */
export class AuthApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

const LOGIN_PATH = "auth/login";
const ME_PATH = "auth/me";
const LOGOUT_PATH = "auth/logout";

/** 登录；返回 Spring 原始账号和 token，由 store 决定角色和持久化。 */
export function login(
  identifier: string,
  password: string,
): Promise<AuthResult> {
  return unwrap(
    http
      .post(LOGIN_PATH, { json: { email: identifier, password } })
      .json<ApiEnvelope<AuthResult>>(),
  );
}

/** 查询当前 token 对应的账号。 */
export function me(): Promise<AdminAccount> {
  return unwrap(http.get(ME_PATH).json<ApiEnvelope<AdminAccount>>());
}

/** 注销当前 token；Spring 对重复注销返回成功。 */
export async function logout(): Promise<void> {
  await unwrapVoid(http.post(LOGOUT_PATH).json<ApiEnvelope<null>>());
}

async function unwrap<T>(promise: Promise<ApiEnvelope<T>>): Promise<T> {
  try {
    const body = await promise;

    if (!body.success || body.data === null) {
      throw new AuthApiError(
        body.error?.code ?? "INVALID_REQUEST",
        body.error?.message ?? "请求失败，请稍后重试",
      );
    }

    return body.data;
  } catch (error) {
    throw toAuthApiError(error);
  }
}

/** 注销的 `data` 为 null，因此只检查信封的 `success`。 */
async function unwrapVoid(promise: Promise<ApiEnvelope<null>>): Promise<void> {
  try {
    const body = await promise;

    if (!body.success) {
      throw new AuthApiError(
        body.error?.code ?? "INVALID_REQUEST",
        body.error?.message ?? "请求失败，请稍后重试",
      );
    }
  } catch (error) {
    throw toAuthApiError(error);
  }
}

function toAuthApiError(error: unknown): AuthApiError {
  if (error instanceof AuthApiError) {
    return error;
  }

  if (isHTTPError(error)) {
    return fromHttpError(error);
  }

  if (isTimeoutError(error)) {
    return new AuthApiError("REQUEST_TIMEOUT", "请求超时，请稍后重试");
  }

  if (isNetworkError(error)) {
    return new AuthApiError("NETWORK_ERROR", "无法连接后端服务，请稍后重试");
  }

  return new AuthApiError("UNKNOWN_ERROR", "请求失败，请稍后重试");
}

function fromHttpError(error: HTTPError): AuthApiError {
  const payload =
    typeof error.data === "object" && error.data !== null
      ? (error.data as Partial<ApiEnvelope<unknown>>)
      : undefined;
  const status = error.response.status;

  return new AuthApiError(
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
    return "邮箱或密码错误";
  }
  if (status === 403) {
    return "没有执行此操作的权限";
  }
  if (status >= 500) {
    return "后端服务暂不可用，请稍后重试";
  }
  return "请求参数不正确";
}
