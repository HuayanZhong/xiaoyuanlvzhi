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

/** 注册并由 Nitro 建立 HttpOnly 会话。 */
export function registerStudent(payload: RegisterPayload) {
  return useApi().request<AuthResult>("auth/register", {
    method: "POST",
    body: payload,
  });
}

/** 使用 QQ 邮箱和密码登录；令牌不会返回浏览器。 */
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

/** 注销当前 HttpOnly 会话。 */
export function logoutStudent() {
  return useApi().request<{ revokeFailed: boolean }>("auth/logout", {
    method: "POST",
  });
}
