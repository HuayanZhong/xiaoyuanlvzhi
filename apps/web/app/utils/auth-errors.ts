import { ApiError } from "~/utils/api";

export type AuthField =
  | "email"
  | "code"
  | "password"
  | "studentNumber"
  | "phone";

export type AuthErrorInfo = {
  message: string;
  field?: AuthField;
  action?: "login";
  clearCode?: boolean;
  restartCountdown?: boolean;
};

const AUTH_ERRORS: Record<string, AuthErrorInfo> = {
  EMAIL_ALREADY_REGISTERED: {
    message: "这个邮箱已经注册，请直接登录",
    field: "email",
    action: "login",
  },
  STUDENT_NUMBER_ALREADY_USED: {
    message: "这个学号已经注册",
    field: "studentNumber",
  },
  PHONE_ALREADY_USED: {
    message: "这个手机号已绑定其他账号",
    field: "phone",
  },
  CODE_REQUIRED: { message: "请先获取邮箱验证码", field: "code" },
  CODE_EXPIRED: {
    message: "验证码已过期，请重新获取",
    field: "code",
    clearCode: true,
  },
  CODE_INVALID: { message: "验证码不正确", field: "code" },
  CODE_ATTEMPTS_EXCEEDED: {
    message: "验证码错误次数过多，请重新获取",
    field: "code",
    clearCode: true,
  },
  CODE_RESEND_TOO_SOON: {
    message: "请稍后再获取验证码",
    restartCountdown: true,
  },
  QQ_EMAIL_REQUIRED: {
    message: "注册邮箱必须是 QQ 邮箱",
    field: "email",
  },
  MAIL_NOT_CONFIGURED: { message: "注册邮件暂不可用，请联系管理员" },
  MAIL_SEND_FAILED: { message: "验证码邮件发送失败，请稍后重试" },
  DATA_CONFLICT: { message: "资料已被使用，请检查邮箱、学号或手机号" },
  INVALID_CREDENTIALS: { message: "邮箱或密码错误" },
  ACCOUNT_DISABLED: { message: "账号暂不可用，请联系管理员" },
  NOT_STUDENT: { message: "仅学生账号可登录学生端" },
};

const TRANSPORT_ERRORS = new Set([
  "NETWORK_ERROR",
  "REQUEST_TIMEOUT",
  "UPSTREAM_ERROR",
  "EMPTY_RESPONSE",
  "INVALID_RESPONSE",
  "UNAUTHORIZED",
  "FORBIDDEN",
]);

/**
 * 把认证接口错误映射为页面提示。
 *
 * 已知业务码落到对应字段；`INVALID_REQUEST` 使用后端的中文字段提示；
 * 其他未知业务码只显示通用重试文案，不把原始错误码暴露给用户。
 */
export function resolveAuthError(error: unknown): AuthErrorInfo {
  if (!(error instanceof ApiError)) {
    return { message: "请求失败，请稍后重试" };
  }

  const known = AUTH_ERRORS[error.code];

  if (known) {
    return { ...known };
  }

  if (error.code === "INVALID_REQUEST") {
    return { message: error.message.trim() || "请检查填写内容" };
  }

  if (TRANSPORT_ERRORS.has(error.code)) {
    return { message: error.message || "请求失败，请稍后重试" };
  }

  return { message: "请求失败，请稍后重试" };
}

/** 业务页面的通用错误文案；认证字段映射使用 `resolveAuthError`。 */
export function resolveRequestError(error: unknown): string {
  return resolveAuthError(error).message;
}
