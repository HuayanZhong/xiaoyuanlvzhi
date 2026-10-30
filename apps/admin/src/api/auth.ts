import { request, requestVoid } from "./client";

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

const LOGIN_PATH = "auth/login";
const ME_PATH = "auth/me";
const LOGOUT_PATH = "auth/logout";

/** 登录；返回 Spring 原始账号和 token，由 store 决定角色和持久化。 */
export function login(
  identifier: string,
  password: string,
): Promise<AuthResult> {
  return request<AuthResult>(LOGIN_PATH, {
    method: "POST",
    json: { email: identifier, password },
  });
}

/** 查询当前 token 对应的账号。 */
export function me(): Promise<AdminAccount> {
  return request<AdminAccount>(ME_PATH);
}

/** 注销当前 token；Spring 对重复注销返回成功。 */
export function logout(): Promise<void> {
  return requestVoid(LOGOUT_PATH, { method: "POST" });
}
