import { create } from "zustand";
import {
  AuthApiError,
  login as loginRequest,
  logout as logoutRequest,
  me as meRequest,
  type AdminAccount,
} from "@/api/auth";
import { onUnauthorized } from "@/lib/auth-events";
import { clearToken, getToken, setToken } from "@/lib/token";

export type AuthStatus = "checking" | "authenticated" | "anonymous" | "error";

type AuthState = {
  status: AuthStatus;
  account: AdminAccount | null;
  /** 启动或重试时用本地 token 换取当前账号。 */
  restore: () => Promise<void>;
  /** 登录；只有 ADMIN 账号会保存 token。 */
  login: (identifier: string, password: string) => Promise<void>;
  /** 退出；返回注销请求是否失败。 */
  logout: () => Promise<{ revokeFailed: boolean }>;
  /** 清空本地登录态。 */
  clear: () => void;
};

let restoring: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()((set) => {
  async function restoreSession(): Promise<void> {
    set({ status: "checking", account: null });

    if (!getToken()) {
      set({ status: "anonymous", account: null });
      return;
    }

    try {
      const account = await meRequest();

      if (account.role !== "ADMIN") {
        clearToken();
        set({ status: "anonymous", account: null });
        return;
      }

      set({ status: "authenticated", account });
    } catch (error) {
      if (isUnauthorized(error)) {
        clearToken();
        set({ status: "anonymous", account: null });
        return;
      }

      set({ status: "error", account: null });
    }
  }

  return {
    status: "checking",
    account: null,

    restore: () => {
      if (restoring) {
        return restoring;
      }

      restoring = restoreSession().finally(() => {
        restoring = null;
      });

      return restoring;
    },

    login: async (identifier, password) => {
      const result = await loginRequest(identifier, password);

      if (result.account.role !== "ADMIN") {
        setToken(result.accessToken);
        try {
          await logoutRequest();
        } catch {
          // 注销是 best-effort，本地状态仍必须清理。
        }
        clearToken();
        set({ status: "anonymous", account: null });
        throw new AuthApiError("NOT_ADMIN", "仅管理员账号可登录管理后台", 403);
      }

      setToken(result.accessToken);
      set({ status: "authenticated", account: result.account });
    },

    logout: async () => {
      let revokeFailed = false;

      try {
        await logoutRequest();
      } catch (error) {
        revokeFailed = !isUnauthorized(error);
      }

      clearToken();
      set({ status: "anonymous", account: null });

      return { revokeFailed };
    },

    clear: () => {
      clearToken();
      set({ status: "anonymous", account: null });
    },
  };
});

/** 任意请求收到 401 时，HTTP 适配层通过事件清空登录态。 */
onUnauthorized(() => {
  useAuthStore.getState().clear();
});

function isUnauthorized(error: unknown): boolean {
  return (
    error instanceof AuthApiError &&
    (error.status === 401 || error.code === "UNAUTHORIZED")
  );
}
