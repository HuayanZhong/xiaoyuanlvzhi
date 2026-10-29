import { theme } from "antd";
import { useLayoutEffect } from "react";

/**
 * 把 antd 语义 token 暴露为根节点 CSS 变量，供 Tailwind 的 `@theme inline` 别名引用。
 *
 * 必须渲染在 `ConfigProvider` 内；亮暗模式跟随 antd algorithm，不再单独维护一套颜色。
 */
export default function ThemeTokenBridge() {
  const { token } = theme.useToken();

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--app-color-canvas", token.colorBgLayout);
    root.style.setProperty("--app-color-surface", token.colorBgContainer);
    root.style.setProperty("--app-color-ink", token.colorText);
    root.style.setProperty("--app-color-line", token.colorBorderSecondary);
    root.style.setProperty("--app-color-muted", token.colorTextSecondary);
    root.style.setProperty("--app-color-primary", token.colorPrimary);
  }, [token]);

  return null;
}
