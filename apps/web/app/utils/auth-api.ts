import { useApi } from "~/composables/useApi";

export type StudentAccount = {
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

export type AuthResult = {
  tokenType: string;
  accessToken: string;
  expiresAt: string;
  account: StudentAccount;
};

export type EmailCodeResult = {
  sent: boolean;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export type RegisterPayload = {
  email: string;
  verificationCode: string;
  password: string;
  fullName: string;
  studentNumber: string;
  department: string;
  className: string;
  phone: string;
};

/** 发送注册验证码。 */
export function sendRegistrationCode(email: string) {
  return useApi().request<EmailCodeResult>("auth/email-code/registration", {
    method: "POST",
    body: { email },
  });
}

/** 注册并直接获得登录态。 */
export function registerStudent(payload: RegisterPayload) {
  return useApi().request<AuthResult>("auth/register", {
    method: "POST",
    body: payload,
  });
}

/** 使用 QQ 邮箱和密码登录。 */
export function loginWithEmail(email: string, password: string) {
  return useApi().request<AuthResult>("auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/** 恢复当前登录账号。 */
export function getCurrentAccount() {
  return useApi().request<StudentAccount>("auth/me");
}

/**
 * 注销当前令牌。
 *
 * `token` 用于尚未持久化的令牌（例如非学生账号登录后的清理）；
 * 不传时由适配层读取当前登录态。401 视为令牌已失效。
 */
export function logoutStudent(token?: string) {
  return useApi().request<null>("auth/logout", {
    method: "POST",
    token,
    expectData: false,
  });
}
