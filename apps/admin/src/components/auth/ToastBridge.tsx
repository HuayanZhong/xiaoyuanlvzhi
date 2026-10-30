import { useEffect } from "react";
import { onUnauthorized } from "@/lib/auth-events";
import { showToast } from "@/lib/toast-dom";
import { onToast } from "@/lib/toast-events";

/**
 * 把认证事件转换成页面级提示。
 *
 * 提示渲染在 body 上，不依赖 antd message 的 App 上下文或路由生命周期。
 */
export default function ToastBridge() {
  useEffect(() => {
    const unsubscribeToast = onToast(({ type, content }) => {
      showToast(type, content);
    });
    const unsubscribeUnauthorized = onUnauthorized(() => {
      showToast("warning", "登录已过期，请重新登录");
    });

    return () => {
      unsubscribeToast();
      unsubscribeUnauthorized();
    };
  }, []);

  return null;
}
