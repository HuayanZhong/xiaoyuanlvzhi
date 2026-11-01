/** 学生端 accessToken 的同源 Cookie 名，避免与 admin 的令牌互相覆盖。 */
export const TOKEN_COOKIE_NAME = "student-auth-token";

/** 与 Spring 的 7 天会话保持一致。 */
export const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

let memoryToken: string | null = null;

/**
 * 读取当前 accessToken。
 *
 * 服务端从请求 Cookie 读取，客户端优先使用内存副本；这样 SSR 守卫和
 * `useAsyncData` 能在服务端拿到登录态，而浏览器刷新后仍从 Cookie 恢复。
 */
export function getToken(): string | null {
  if (import.meta.server) {
    return useServerTokenCookie().value ?? null;
  }

  if (memoryToken !== null) {
    return memoryToken;
  }

  return readBrowserCookie(TOKEN_COOKIE_NAME);
}

/** 保存 accessToken；存储不可用时至少保留到当前页面生命周期结束。 */
export function setToken(token: string): void {
  memoryToken = token;

  if (import.meta.server) {
    useServerTokenCookie().value = token;
    return;
  }

  writeBrowserCookie(token, TOKEN_MAX_AGE_SECONDS);
}

/** 清除 accessToken；清理失败不应阻断退出流程。 */
export function clearToken(): void {
  memoryToken = null;

  if (import.meta.server) {
    useServerTokenCookie().value = null;
    return;
  }

  writeBrowserCookie("", 0);
}

function useServerTokenCookie() {
  return useCookie<string | null>(TOKEN_COOKIE_NAME, {
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
}

function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const entry = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

function writeBrowserCookie(value: string, maxAge: number): void {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}
