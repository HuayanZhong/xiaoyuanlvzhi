import { callWithNuxt, clearNuxtData, tryUseNuxtApp, useState } from "#app";
import type { NuxtApp } from "#app";
import type { ComputedRef, Ref } from "vue";
import {
  getCurrentAccount,
  loginWithEmail,
  logoutStudent,
  registerStudent,
  type RegisterPayload,
  type StudentAccount,
} from "~/utils/auth-api";
import { ApiError } from "~/utils/api";
import { clearToken, getToken, setToken } from "~/utils/token";

export type AuthStatus = "checking" | "anonymous" | "authenticated" | "error";

const AUTH_STATUS_KEY = "student-auth-status";
const AUTH_ACCOUNT_KEY = "student-auth-account";
const PROFILE_DATA_KEYS = ["home-profile", "me-profile"];

type AuthSession = { attempt: number; promise: Promise<void> | null };

/** 无 Nuxt 上下文时（纯单元测试）的退路。 */
const fallbackStatus = ref<AuthStatus>("checking");
const fallbackAccount = ref<StudentAccount | null>(null);
let fallbackSession: AuthSession = { attempt: 0, promise: null };

/** 服务端每个请求有独立 NuxtApp，按实例隔离恢复去重与迟到响应号。 */
const sessions = new WeakMap<object, AuthSession>();

export type UseAuth = {
  status: Ref<AuthStatus>;
  account: Ref<StudentAccount | null>;
  isAuthenticated: ComputedRef<boolean>;
  restore: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<{ revokeFailed: boolean }>;
  clear: () => void;
};

/**
 * 学生端认证状态机。
 *
 * 状态放在 `useState` 中，SSR 请求之间不会串号；只有本地 token 换回的
 * ACTIVE STUDENT 才算登录成功，`restore` 用尝试编号丢弃迟到响应。
 */
export function useAuth(): UseAuth {
  const status = statusState();
  const account = accountState();
  const isAuthenticated = computed(
    () => status.value === "authenticated" && account.value !== null,
  );

  return {
    status,
    account,
    isAuthenticated,
    restore,
    login,
    register,
    logout,
    clear: clearAuth,
  };
}

/** 清空认证状态；测试和 401 事件复用。 */
export function clearAuth(): void {
  const session = currentSession();

  session.attempt += 1;
  session.promise = null;
  clearToken();
  statusState().value = "anonymous";
  accountState().value = null;
  clearProfileData();
}

/** 重置到启动状态，仅供测试使用。 */
export function resetAuthForTests(): void {
  const session = currentSession();

  session.attempt += 1;
  session.promise = null;
  clearToken();
  statusState().value = "checking";
  accountState().value = null;
  clearProfileData();
}

function restore(): Promise<void> {
  const session = currentSession();
  const nuxtApp = tryUseNuxtApp();
  const status = statusState();
  const account = accountState();

  if (session.promise) {
    return session.promise;
  }

  const attempt = ++session.attempt;

  status.value = "checking";
  account.value = null;

  if (!getToken()) {
    status.value = "anonymous";
    return Promise.resolve();
  }

  const promise = restoreSession({
    attempt,
    session,
    nuxtApp,
    status,
    account,
  });

  session.promise = promise;
  promise.finally(() => {
    if (session.promise === promise) {
      session.promise = null;
    }
  });

  return promise;
}

async function restoreSession(context: {
  attempt: number;
  session: AuthSession;
  nuxtApp: NuxtApp | null;
  status: Ref<AuthStatus>;
  account: Ref<StudentAccount | null>;
}): Promise<void> {
  try {
    const current = await getCurrentAccount();

    if (context.attempt !== context.session.attempt) {
      return;
    }

    if (!isActiveStudent(current)) {
      runInNuxt(context.nuxtApp, clearAuth);
      return;
    }

    context.status.value = "authenticated";
    context.account.value = current;
  } catch (error) {
    if (context.attempt !== context.session.attempt) {
      return;
    }

    if (isUnauthorized(error)) {
      runInNuxt(context.nuxtApp, clearAuth);
      return;
    }

    // 网络或 5xx 失败保留 token，允许用户重试。
    context.status.value = "error";
  }
}

/**
 * 等待网络响应后，Nuxt 的异步上下文可能已经结束；服务端再次读写
 * `useCookie`/`useState` 前必须显式切回该请求的 NuxtApp。
 */
function runInNuxt(nuxtApp: NuxtApp | null, action: () => void): void {
  if (nuxtApp) {
    callWithNuxt(nuxtApp, action);
    return;
  }

  action();
}

async function login(email: string, password: string): Promise<void> {
  const session = currentSession();

  session.attempt += 1;
  session.promise = null;

  const result = await loginWithEmail(email, password);

  await acceptSession(result.accessToken, result.account);
}

async function register(payload: RegisterPayload): Promise<void> {
  const session = currentSession();

  session.attempt += 1;
  session.promise = null;

  const result = await registerStudent(payload);

  await acceptSession(result.accessToken, result.account);
}

async function acceptSession(
  accessToken: string,
  current: StudentAccount,
): Promise<void> {
  if (current.role !== "STUDENT") {
    await discardToken(accessToken);
    throw new ApiError("NOT_STUDENT", "仅学生账号可登录学生端", 403);
  }

  if (current.status !== "ACTIVE") {
    await discardToken(accessToken);
    throw new ApiError("ACCOUNT_DISABLED", "账号暂不可用，请联系管理员", 403);
  }

  setToken(accessToken);
  statusState().value = "authenticated";
  accountState().value = current;
}

/** 非学生令牌从未写入持久化存储，注销时显式带上请求头即可。 */
async function discardToken(accessToken: string): Promise<void> {
  try {
    await logoutStudent(accessToken);
  } catch {
    // best-effort：本地状态不会保存该令牌。
  }

  clearAuth();
}

async function logout(): Promise<{ revokeFailed: boolean }> {
  const session = currentSession();

  session.attempt += 1;
  session.promise = null;

  let revokeFailed = false;

  try {
    await logoutStudent();
  } catch (error) {
    revokeFailed = !isUnauthorized(error);
  }

  clearAuth();

  return { revokeFailed };
}

function isActiveStudent(current: StudentAccount): boolean {
  return current.role === "STUDENT" && current.status === "ACTIVE";
}

function isUnauthorized(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 401 || error.code === "UNAUTHORIZED")
  );
}

function statusState(): Ref<AuthStatus> {
  return hasNuxtApp()
    ? useState<AuthStatus>(AUTH_STATUS_KEY, () => "checking")
    : fallbackStatus;
}

function accountState(): Ref<StudentAccount | null> {
  return hasNuxtApp()
    ? useState<StudentAccount | null>(AUTH_ACCOUNT_KEY, () => null)
    : fallbackAccount;
}

function currentSession(): AuthSession {
  const nuxtApp = tryUseNuxtApp();

  if (!nuxtApp) {
    return fallbackSession;
  }

  let session = sessions.get(nuxtApp);

  if (!session) {
    session = { attempt: 0, promise: null };
    sessions.set(nuxtApp, session);
  }

  return session;
}

function hasNuxtApp(): boolean {
  return Boolean(tryUseNuxtApp());
}

function clearProfileData(): void {
  if (!hasNuxtApp()) {
    return;
  }

  for (const key of PROFILE_DATA_KEYS) {
    clearNuxtData(key);
  }
}
