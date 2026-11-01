export type AuthRouteTarget = {
  path: string;
  fullPath: string;
  query?: Record<string, unknown>;
};

export type AuthRouteState = {
  status: "checking" | "anonymous" | "authenticated" | "error";
  isAuthenticated: boolean;
};

export type AuthRedirect = {
  path: string;
  query?: { returnTo: string };
};

const AUTH_PAGES = new Set(["/login", "/register"]);
const PROTECTED_PAGES = new Set(["/", "/me"]);
const PROTECTED_PREFIXES = ["/plants", "/adoptions"];

/** 认证页与受保护页之外的路径（包括 404）保持公开。 */
export function resolveAuthRedirect(
  target: AuthRouteTarget,
  auth: AuthRouteState,
): AuthRedirect | null {
  const path = normalizePath(target.path);

  if (isProtectedPath(path) && !auth.isAuthenticated) {
    return { path: "/login", query: { returnTo: target.fullPath } };
  }

  if (AUTH_PAGES.has(path) && auth.isAuthenticated) {
    return { path: "/" };
  }

  return null;
}

/** 401 时只在受保护页面跳转登录；公开页面静默清理登录态。 */
export function resolveUnauthorizedRedirect(
  target: AuthRouteTarget,
): AuthRedirect | null {
  if (!isProtectedPath(normalizePath(target.path))) {
    return null;
  }

  return { path: "/login", query: { returnTo: target.fullPath } };
}

function isProtectedPath(path: string): boolean {
  if (PROTECTED_PAGES.has(path)) {
    return true;
  }

  return PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * 只接受单个站内业务路径作为登录后的回跳目标。
 *
 * 拒绝外部地址、协议相对地址、反斜杠、认证页和控制字符，避免开放重定向
 * 和登录页重定向循环。
 */
export function resolveReturnTo(value: unknown): string {
  if (typeof value !== "string") {
    return "/";
  }

  const candidate = value.trim();

  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/";
  }

  if (candidate.includes("\\") || hasControlCharacter(candidate)) {
    return "/";
  }

  const path = candidate.split(/[?#]/, 1)[0] ?? "";

  if (AUTH_PAGES.has(path)) {
    return "/";
  }

  return candidate;
}

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((char) => {
    const code = char.codePointAt(0) ?? 0;

    return code < 0x20 || code === 0x7f;
  });
}

function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}
