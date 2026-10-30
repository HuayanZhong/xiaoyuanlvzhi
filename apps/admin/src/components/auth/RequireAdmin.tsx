import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "@/stores/auth";

type AuthBoundaryProps = {
  children: ReactNode;
};

/** 保护后台壳下的业务路由，未登录时携带原路径回到登录页。 */
export default function RequireAdmin({ children }: AuthBoundaryProps) {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === "authenticated") {
    return children;
  }

  if (status === "anonymous") {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    const search = new URLSearchParams({ returnTo }).toString();

    return <Navigate replace to={`/login?${search}`} />;
  }

  // checking / error 由 SessionGate 处理；直接渲染时保持空白。
  return null;
}

/** 已登录用户不应再看到登录页。 */
export function RedirectIfAuthenticated({ children }: AuthBoundaryProps) {
  const status = useAuthStore((state) => state.status);

  if (status === "authenticated") {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}
