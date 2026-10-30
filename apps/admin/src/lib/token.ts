/** 管理端 accessToken 的 localStorage 键名。 */
export const TOKEN_STORAGE_KEY = "admin-auth-token";

let memoryToken: string | null = null;

/** localStorage 在隐私模式或配额耗尽时可能抛错，降级为模块内存。 */
function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** 读取当前 accessToken；内存值优先，避免每次请求都访问存储。 */
export function getToken(): string | null {
  if (memoryToken !== null) {
    return memoryToken;
  }

  try {
    return getStorage()?.getItem(TOKEN_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

/** 保存 accessToken；存储不可用时至少保留到当前页面生命周期结束。 */
export function setToken(token: string): void {
  memoryToken = token;

  try {
    getStorage()?.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // 内存副本已经生效，刷新后才会丢失。
  }
}

/** 清除 accessToken；清理失败不应阻断退出流程。 */
export function clearToken(): void {
  memoryToken = null;

  try {
    getStorage()?.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // 存储不可用时无需额外处理。
  }
}
